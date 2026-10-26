// Generates the narration with Gemini 3.8 Flash TTS on kie.ai, one clip per line so each line
// can be placed on its story beat. Writes public/voice/<id>.wav and src/BrainLying/voice.json
// (speech bounds + estimated word start times per clip).
// Run: npm run voice            (regenerates only lines whose text/style changed)
//      npm run voice -- --force (regenerates everything)
import fs from "node:fs";
import { createTask, download, waitForTask } from "./kie.mjs";
import { alignWords } from "./align.mjs";
import { readWav, toWav } from "./audio-utils.mjs";

const VOICE = "Charon";
const MODEL = "google/gemini-3-8-flash-tts";

// story = frame on the original 30 s animation timeline where the line should begin.
// anchors = words whose spoken moment should line up with a story frame.
// *word* = emphasised in the captions.
const LINES = [
  { id: "hook", story: 4, anchors: { giant: 84 }, text: "Your brain can turn a small fear into a *giant* *monster.*", style: "Gripping narrator opening a viral short. Low, intimate and slightly ominous, brisk pace, lean hard into 'giant monster'." },
  { id: "sentence", story: 152, text: "He has one sentence to say.", style: "Gentle, matter-of-fact storyteller, brisk." },
  { id: "people", story: 226, text: "Just a few people listening.", style: "Gentle, matter-of-fact storyteller, brisk." },
  { id: "head", story: 300, text: "But in his head...", style: "Dropping lower and slower, building suspense." },
  { id: "enormous", story: 372, anchors: { enormous: 392 }, text: "it feels *enormous.*", style: "Dramatic, heavy and intense, stretch the word 'enormous'." },
  { id: "real", story: 450, text: "The fear is real.", style: "Serious, sincere and empathetic, slow. Never dismissive." },
  { id: "breathe", story: 512, text: "So he pauses. Breathes. Slowly.", style: "Calm, slow and soothing, with natural pauses between each phrase." },
  { id: "practices", story: 575, text: "He practices.", style: "Steady and encouraging." },
  { id: "once", story: 590, text: "Once.", style: "Quiet, counting an attempt." },
  { id: "twice", story: 630, text: "Twice.", style: "A little more confident, counting an attempt." },
  { id: "again", story: 668, text: "Again.", style: "Determined, counting an attempt." },
  { id: "speaks", story: 700, text: "Then he speaks.", style: "Hopeful and rising, a turning point." },
  { id: "shrinks", story: 742, text: "And the shadow shrinks back to its real size.", style: "Warm, relieved and confident, brisk." },
  { id: "courage", story: 808, text: "Courage starts before you feel ready.", style: "Inspiring closing line. Warm, powerful and deliberate, each word lands." },
];

const force = process.argv.includes("--force");
const outDir = new URL("../public/voice/", import.meta.url);
const rawDir = new URL("../.cache/voice-raw/", import.meta.url);
const manifestUrl = new URL("../src/BrainLying/voice.json", import.meta.url);
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(rawDir, { recursive: true });

const plain = (text) => text.replace(/\*/g, "");

// ---------- Generate (only what changed) ----------
// A sidecar per finished clip records what it was generated from, so reruns resume after failures.
const metaUrl = (line) => new URL(`${line.id}.json`, rawDir);
const signature = (line) => JSON.stringify({ text: line.text, style: line.style, voice: VOICE, model: MODEL });
const todo = LINES.filter((line) => {
  const file = new URL(`${line.id}.wav`, outDir);
  const meta = metaUrl(line);
  return force || !fs.existsSync(file) || !fs.existsSync(meta) || fs.readFileSync(meta, "utf8") !== signature(line);
});

const generate = async (line) => {
  for (let attempt = 1; ; attempt++) {
    try {
      const taskId = await createTask(MODEL, {
        temperature: 1,
        speakers: [{ speaker_id: "Speaker 1", voice_name: VOICE }],
        dialogue_turns: [{ speaker_id: "Speaker 1", style: line.style, text: plain(line.text) }],
      });
      const data = await waitForTask(taskId, { intervalMs: 3000 });
      const url = JSON.parse(data.resultJson).resultUrls[0];
      const raw = new URL(`${line.id}${url.slice(url.lastIndexOf("."))}`, rawDir);
      await download(url, raw);
      toWav(raw.pathname.replace(/^\/([A-Za-z]:)/, "$1"), new URL(`${line.id}.wav`, outDir).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
      fs.writeFileSync(metaUrl(line), signature(line));
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

// ---------- Analyse each clip: speech bounds + word starts ----------
const syllables = (w) => Math.max(1, (w.toLowerCase().replace(/[^a-z]/g, "").replace(/e$/, "").match(/[aeiouy]+/g) || []).length);

const analyse = async (line) => {
  const wavUrl = new URL(`${line.id}.wav`, outDir);
  const { sampleRate, channels } = readWav(wavUrl);
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
  const aligned = await alignWords(wavUrl.pathname.replace(/^\/([A-Za-z]:)/, "$1"), words);
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
    voice: VOICE,
    story: line.story,
    anchors: line.anchors ?? {},
    file: `voice/${line.id}.wav`,
    duration: x.length / sampleRate,
    speechStart,
    speechEnd,
    words: words.map((w, i) => ({ text: line.text.split(" ")[i], start: +starts[i].toFixed(3) })),
  };
};

const lines = [];
for (const line of LINES) lines.push(await analyse(line));
fs.writeFileSync(manifestUrl, JSON.stringify({ voice: VOICE, model: MODEL, lines }, null, 2) + "\n");
for (const l of lines) console.log(`${l.id.padEnd(10)} speech ${l.speechStart.toFixed(2)}-${l.speechEnd.toFixed(2)}s  ${l.words.map((w) => `${w.text}@${w.start}`).join(" ")}`);
