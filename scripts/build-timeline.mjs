// Places each narration line on its story beat and derives everything timed to the voice:
// the story -> output time-warp, caption chunks with per-word frames, and the end-card word frames.
// Writes <episode>/timeline.json. Run: npm run timeline [-- <episode dir>] (after npm run voice)
import { loadEpisode } from "./episode.mjs";

const ep = loadEpisode();
const voice = ep.readJson("voice.json");
const beats = ep.readJson("beats.json");
const FPS = beats.fps;

const t = ep.cfg.timeline;
const GAP = t.gap; // minimum frames of silence between lines
const MAX_SPEEDUP = t.maxSpeedup; // the animation may play at most this much faster than designed
const END_HOLD = t.endHold; // frames held after the last word
const CAPTION_LEAD = t.captionLead; // captions appear this many frames before the word is heard
// Words per caption chunk, so captions break on meaning. Other lines split on punctuation / length.
const CHUNKS = ep.cfg.captions?.chunks ?? {};
// Optional end card: a closing line shown big on screen instead of as a caption.
const END_CARD = ep.cfg.endCard;

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
// After the last line the story plays at normal speed; the video ends once both the voice and the story are done.
const storyEndOut = last.onset + (beats.duration - last.story);
push(beats.duration, storyEndOut);
const duration = Math.ceil(Math.max(last.speechEndFrame + END_HOLD, storyEndOut));
const endLine = END_CARD && placed.find((p) => p.id === END_CARD.line);
// End card appears just before its line is spoken
const endCardOut = endLine && endLine.onset - (endLine.story - END_CARD.storyFrom);

// ---------- Caption chunks (every line except the end-card line) ----------
const captions = [];
const body = placed.filter((p) => p !== endLine);
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
        : Math.min(Math.round(p.speechEndFrame) + 12, nextLine ? Math.round(nextLine.onset) - CAPTION_LEAD : Infinity);
    captions.push({ line: p.id, from, to, words: c });
  });
});

const timeline = {
  fps: FPS,
  duration,
  anchors,
  ...(endLine
    ? {
        endCard: {
          from: Math.round(endCardOut),
          words: endLine.words.map((w, i) => ({ text: w.text.replace(/\*/g, ""), frame: Math.round(endLine.wordFrames[i]) })),
        },
      }
    : {}),
  voice: placed.map((p) => ({
    id: p.id,
    file: p.file,
    at: +(p.clipStart / FPS).toFixed(4),
    speech: [+(p.onset / FPS).toFixed(3), +(p.speechEndFrame / FPS).toFixed(3)],
    ...(p.fx ? { fx: p.fx } : {}),
  })),
  captions,
};
ep.writeJson("timeline.json", timeline);

console.log(`duration ${duration} frames (${(duration / FPS).toFixed(2)}s)`);
for (const p of placed) console.log(`${p.id.padEnd(10)} story ${String(p.story).padStart(3)} -> out ${p.onset.toFixed(1).padStart(6)}  ends ${p.speechEndFrame.toFixed(1)}`);
console.log("captions:", captions.map((c) => `[${c.from}-${c.to}] ${c.words.map((w) => w.text).join(" ")}`).join("\n          "));
