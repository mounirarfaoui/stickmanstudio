// Places each narration line on its story beat and derives everything timed to the voice:
// the story -> output time-warp, caption chunks with per-word frames, and the end-card word frames.
// Writes src/BrainLying/timeline.json. Run: npm run timeline (after npm run voice)
import fs from "node:fs";

const voice = JSON.parse(fs.readFileSync(new URL("../src/BrainLying/voice.json", import.meta.url), "utf8"));
const beats = JSON.parse(fs.readFileSync(new URL("../src/BrainLying/beats.json", import.meta.url), "utf8"));
const FPS = beats.fps;

const GAP = 7; // minimum frames of silence between lines
const MAX_SPEEDUP = 1.25; // the animation may play at most this much faster than designed
const END_HOLD = 66; // frames held on the end card after the last word
const CAPTION_LEAD = 2; // captions appear this many frames before the word is heard
// Words per caption chunk, so captions break on meaning. Other lines split on punctuation / length.
const CHUNKS = { hook: [4, 3, 4], sentence: [6], head: [4], enormous: [2, 1], real: [4], speaks: [3], shrinks: [3, 2, 4] };

// ---------- Place lines ----------
const placed = [];
for (const line of voice.lines) {
  const prev = placed[placed.length - 1];
  // `onset` = output frame where this line's speech begins
  let onset = line.story;
  if (prev) {
    const storyGap = line.story - prev.story;
    onset = Math.max(prev.onset + storyGap / MAX_SPEEDUP, prev.speechEndFrame + GAP);
  }
  const clipStart = onset - line.speechStart * FPS; // output frame where the clip file starts
  placed.push({
    ...line,
    onset,
    clipStart,
    speechEndFrame: clipStart + line.speechEnd * FPS,
    wordFrames: line.words.map((w) => clipStart + w.start * FPS),
  });
}

// ---------- Time-warp anchors: [storyFrame, outputFrame], strictly increasing in both ----------
const anchors = [[0, 0]];
const push = (story, out) => {
  const [ls, lo] = anchors[anchors.length - 1];
  if (story > ls && out > lo) anchors.push([story, +out.toFixed(2)]);
};
for (const p of placed) {
  push(p.story, p.onset);
  for (const [word, story] of Object.entries(p.anchors ?? {})) {
    const i = p.words.findIndex((w) => w.text.replace(/[^a-z]/gi, "").toLowerCase() === word);
    if (i >= 0) push(story, p.wordFrames[i]);
  }
}
const last = placed[placed.length - 1];
const duration = Math.ceil(last.speechEndFrame + END_HOLD);
// End card appears just before the closing line; afterwards the story plays at normal speed.
const endCardOut = last.onset - (last.story - beats.endCard.from);
push(beats.duration, endCardOut + (beats.duration - beats.endCard.from));

// ---------- Caption chunks (every line except the closing one, which the end card shows) ----------
const captions = [];
const body = placed.filter((p) => p.id !== last.id);
body.forEach((p) => {
  const words = p.words.map((w, i) => ({
    text: w.text.replace(/\*/g, ""),
    emph: w.text.startsWith("*"),
    frame: Math.round(p.wordFrames[i]),
  }));
  const chunks = [];
  let cur = [];
  if (CHUNKS[p.id]) {
    let i = 0;
    for (const n of CHUNKS[p.id]) chunks.push(words.slice(i, (i += n)));
  } else for (const w of words) {
    const len = [...cur, w].map((x) => x.text).join(" ").length;
    if (cur.length && (cur.length >= 3 || len > 18)) {
      chunks.push(cur);
      cur = [];
    }
    cur.push(w);
    if (/[.,!?]$/.test(w.text) && !w.text.endsWith("...")) {
      chunks.push(cur);
      cur = [];
    }
  }
  if (cur.length) chunks.push(cur);
  if (chunks.flat().length !== words.length) throw new Error(`${p.id}: CHUNKS does not cover all ${words.length} words`);

  const nextLine = placed[placed.indexOf(p) + 1];
  chunks.forEach((c, ci) => {
    const from = c[0].frame - CAPTION_LEAD;
    const to =
      ci + 1 < chunks.length
        ? chunks[ci + 1][0].frame - CAPTION_LEAD
        : Math.min(Math.round(p.speechEndFrame) + 12, Math.round(nextLine.onset) - CAPTION_LEAD);
    captions.push({ line: p.id, from, to, words: c });
  });
});

const timeline = {
  fps: FPS,
  duration,
  anchors,
  endCard: {
    from: Math.round(endCardOut),
    words: last.words.map((w, i) => ({ text: w.text.replace(/\*/g, ""), frame: Math.round(last.wordFrames[i]) })),
  },
  voice: placed.map((p) => ({ id: p.id, file: p.file, at: +(p.clipStart / FPS).toFixed(4), speech: [+(p.onset / FPS).toFixed(3), +(p.speechEndFrame / FPS).toFixed(3)] })),
  captions,
};
fs.writeFileSync(new URL("../src/BrainLying/timeline.json", import.meta.url), JSON.stringify(timeline, null, 2) + "\n");

console.log(`duration ${duration} frames (${(duration / FPS).toFixed(2)}s)`);
for (const p of placed) console.log(`${p.id.padEnd(10)} story ${String(p.story).padStart(3)} -> out ${p.onset.toFixed(1).padStart(6)}  ends ${p.speechEndFrame.toFixed(1)}`);
console.log("captions:", captions.map((c) => `[${c.from}-${c.to}] ${c.words.map((w) => w.text).join(" ")}`).join("\n          "));
