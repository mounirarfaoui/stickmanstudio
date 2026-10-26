// Generates an episode's narration with Gemini 3.8 Flash TTS on kie.ai, one clip per line so each line
// can be placed on its story beat. Writes public/<publicDir>/voice/<id>.wav and <episode>/voice.json
// (speech bounds + word start times per clip, aligned with local whisper.cpp).
// Run: npm run voice [-- <episode dir>] [--force]   (default episode: src/BrainLying)
// Lines live in <episode>/episode.json: { id, story, anchors?, text, style, voice?, fx? }
//   story   = story frame where the line should begin; anchors = { word: storyFrame } to sync on
//   *word*  = emphasised in the captions; voice overrides the episode voice; fx is applied in the mix
import fs from "node:fs";
import path from "node:path";
import { createTask, download, waitForTask } from "./kie.mjs";
import { alignWords } from "./align.mjs";
import { readWav, toWav, writeWav } from "./audio-utils.mjs";
import { loadEpisode } from "./episode.mjs";

const MODEL = "google/gemini-3-8-flash-tts";
const ep = loadEpisode();
const { cfg } = ep;
const LINES = cfg.lines;
const voiceOf = (line) => line.voice ?? cfg.voice;

const force = process.argv.includes("--force");
const outDir = path.join(ep.publicDir, "voice");
const rawDir = path.join(ep.cacheDir, "voice-raw");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(rawDir, { recursive: true });

const plain = (text) => text.replace(/\*/g, "");
const wavOf = (line) => path.join(outDir, `${line.id}.wav`);
// Untouched 48 kHz take; the public clip may be a tightened copy of it
const fullOf = (line) => path.join(rawDir, `${line.id}.48k.wav`);

// ---------- Generate (only what changed) ----------
// A sidecar per finished clip records what it was generated from, so reruns resume after failures.
const metaOf = (line) => path.join(rawDir, `${line.id}.json`);
const signature = (line) => JSON.stringify({ text: line.text, style: line.style, voice: voiceOf(line), model: MODEL });
const todo = LINES.filter((line) => {
  const meta = metaOf(line);
  return force || !fs.existsSync(wavOf(line)) || !fs.existsSync(meta) || fs.readFileSync(meta, "utf8") !== signature(line);
});

const generate = async (line) => {
  for (let attempt = 1; ; attempt++) {
    try {
      const taskId = await createTask(MODEL, {
        temperature: 1,
        speakers: [{ speaker_id: "Speaker 1", voice_name: voiceOf(line) }],
        dialogue_turns: [{ speaker_id: "Speaker 1", style: line.style, text: plain(line.text) }],
      });
      const data = await waitForTask(taskId, { intervalMs: 3000 });
      const url = JSON.parse(data.resultJson).resultUrls[0];
      const raw = path.join(rawDir, `${line.id}${url.slice(url.lastIndexOf("."))}`);
      await download(url, raw);
      toWav(raw, wavOf(line));
      fs.copyFileSync(wavOf(line), fullOf(line));
      fs.writeFileSync(metaOf(line), signature(line));
      return;
    } catch (e) {
      if (attempt >= 6) throw e;
      console.warn(`${line.id}: ${e.message} — retrying`);
    }
  }
};
// The provider times out under load, so keep only a few requests in flight.
const queue = [...todo];
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (queue.length) await generate(queue.shift());
  }),
);

// ---------- Tighten pauses ----------
// TTS lingers on every "..." and full stop. With timeline.maxPause (or a per-line maxPause) set,
// silences inside a clip longer than that are cut down to it, with a short crossfade over the join.
const tighten = (line) => {
  const maxPause = line.maxPause ?? cfg.timeline.maxPause;
  if (maxPause === undefined) return;
  if (!fs.existsSync(fullOf(line))) fs.copyFileSync(wavOf(line), fullOf(line));
  const { sampleRate, channels } = readWav(fullOf(line));
  const x = channels[0];
  const hop = Math.round(sampleRate * 0.01);
  const env = [];
  for (let i = 0; i + hop <= x.length; i += hop) {
    let s = 0;
    for (let j = i; j < i + hop; j++) s += x[j] * x[j];
    env.push(10 * Math.log10(s / hop + 1e-12));
  }
  const thr = Math.max(-50, Math.max(...env) - 32);
  const first = env.findIndex((v) => v > thr);
  const last = env.length - 1 - [...env].reverse().findIndex((v) => v > thr);
  const keep = Math.round((maxPause / 0.01) / 2);
  const cuts = []; // [startSample, endSample) to remove
  for (let k = first; k <= last; ) {
    if (env[k] >= thr) {
      k++;
      continue;
    }
    let e = k;
    while (e <= last && env[e] < thr) e++;
    if (e - k > keep * 2) cuts.push([(k + keep) * hop, (e - keep) * hop]);
    k = e;
  }
  const xf = Math.round(sampleRate * 0.01);
  const out = [];
  let pos = 0;
  for (const [a, b] of cuts) {
    for (let i = pos; i < a; i++) out.push(x[i]);
    // crossfade the audio either side of the cut
    for (let j = 0; j < xf && a + j < x.length && b + j < x.length; j++) {
      const t = j / xf;
      out[out.length - xf + j] = out[out.length - xf + j] * (1 - t) + x[b - xf + j] * t;
    }
    pos = b;
  }
  for (let i = pos; i < x.length; i++) out.push(x[i]);
  writeWav(wavOf(line), sampleRate, [Float32Array.from(out)]);
  const saved = (x.length - out.length) / sampleRate;
  if (saved > 0.01) console.log(`${line.id}: tightened ${cuts.length} pause(s), -${saved.toFixed(2)}s`);
};
LINES.forEach(tighten);

// ---------- Analyse each clip: speech bounds + word starts ----------
const syllables = (w) => Math.max(1, (w.toLowerCase().replace(/[^a-z]/g, "").replace(/e$/, "").match(/[aeiouy]+/g) || []).length);

const analyse = async (line) => {
  const { sampleRate, channels } = readWav(wavOf(line));
  const x = channels[0];
  const hop = Math.round(sampleRate * 0.01);
  const env = [];
  for (let i = 0; i + hop <= x.length; i += hop) {
    let s = 0;
    for (let j = i; j < i + hop; j++) s += x[j] * x[j];
    env.push(10 * Math.log10(s / hop + 1e-12));
  }
  const peak = Math.max(...env);
  const thr = Math.max(-50, peak - 32);
  const first = env.findIndex((v) => v > thr);
  const last = env.length - 1 - [...env].reverse().findIndex((v) => v > thr);
  const speechStart = Math.max(0, first - 2) * 0.01;
  const speechEnd = Math.min(env.length, last + 6) * 0.01;

  const words = plain(line.text).split(" ");
  const weights = words.map((w) => syllables(w) + (/[.,!?]$/.test(w) ? 1.2 : 0));
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const starts = [speechStart];
  for (let i = 1; i < words.length; i++) {
    acc += weights[i - 1];
    const guess = speechStart + (speechEnd - speechStart) * (acc / total);
    // Snap to the quietest moment nearby; if that sits in a pause, start the word where the pause ends.
    const g = Math.round(guess / 0.01);
    let m = g;
    for (let k = Math.max(first, g - 15); k <= Math.min(last, g + 15); k++) if (env[k] < env[m]) m = k;
    let s = m;
    if (env[m] < thr) while (s < last && env[s] < thr) s++;
    starts.push(Math.max(starts[i - 1] + 0.08, s * 0.01));
  }
  // Whisper's word offsets win wherever it heard the word; the energy estimate fills any gaps.
  const aligned = await alignWords(wavOf(line), words);
  aligned.starts.forEach((t, i) => {
    if (t !== null) starts[i] = Math.max(speechStart, t);
  });
  // Whisper often stamps the first two words together; keep consecutive starts apart.
  for (let i = 1; i < starts.length; i++) starts[i] = Math.max(starts[i], starts[i - 1] + 0.12);
  const missed = aligned.starts.filter((t) => t === null).length;
  if (missed) console.warn(`${line.id}: whisper heard "${aligned.heard}", ${missed} word(s) estimated`);
  return {
    id: line.id,
    text: line.text,
    style: line.style,
    voice: voiceOf(line),
    story: line.story,
    anchors: line.anchors ?? {},
    ...(line.fx ? { fx: line.fx } : {}),
    file: ep.publicRel("voice", `${line.id}.wav`),
    duration: x.length / sampleRate,
    speechStart,
    speechEnd,
    words: words.map((w, i) => ({ text: line.text.split(" ")[i], start: +starts[i].toFixed(3) })),
  };
};

const lines = [];
for (const line of LINES) lines.push(await analyse(line));
ep.writeJson("voice.json", { voice: cfg.voice, model: MODEL, lines });
for (const l of lines) console.log(`${l.id.padEnd(10)} speech ${l.speechStart.toFixed(2)}-${l.speechEnd.toFixed(2)}s  ${l.words.map((w) => `${w.text}@${w.start}`).join(" ")}`);
