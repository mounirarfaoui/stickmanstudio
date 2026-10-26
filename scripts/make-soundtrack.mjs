// Mixes the final soundtrack for the BrainLying composition into public/soundtrack.wav:
//   voice  - narration clips placed by src/BrainLying/timeline.json
//   music  - public/music.wav (Suno) ducked under the voice, or a procedural pad if it is missing
//   sfx    - procedural, deterministic effects synced to the story beats and spoken words
// Run: npm run audio (after npm run voice / timeline / music)
import fs from "node:fs";
import { readWav, writeWav } from "./audio-utils.mjs";

const read = (rel) => JSON.parse(fs.readFileSync(new URL(rel, import.meta.url), "utf8"));
const beats = read("../src/BrainLying/beats.json");
const timeline = read("../src/BrainLying/timeline.json");
const SR = 48000;
const FPS = timeline.fps;
const N = Math.round((timeline.duration / FPS) * SR);
const TAU = Math.PI * 2;

const idx = (t) => Math.round(t * SR);
const dbToGain = (db) => 10 ** (db / 20);

// Story frame -> output seconds, matching toStory() in the composition (piecewise linear, extended at the end).
const [STORY, OUT] = [timeline.anchors.map((a) => a[0]), timeline.anchors.map((a) => a[1])];
const storySec = (s) => {
  let i = STORY.findIndex((v) => v > s) - 1;
  if (i < 0) i = s < STORY[0] ? 0 : STORY.length - 2;
  return (OUT[i] + ((s - STORY[i]) * (OUT[i + 1] - OUT[i])) / (STORY[i + 1] - STORY[i])) / FPS;
};
// Output frame -> story frame (inverse of the above)
const toStory = (f) => {
  let i = OUT.findIndex((v) => v > f) - 1;
  if (i < 0) i = f < OUT[0] ? 0 : OUT.length - 2;
  return STORY[i] + ((f - OUT[i]) * (STORY[i + 1] - STORY[i])) / (OUT[i + 1] - OUT[i]);
};

const stem = () => [new Float32Array(N), new Float32Array(N)];
const addTo = ([L, R], i, v, pan = 0) => {
  if (i < 0 || i >= N) return;
  L[i] += v * (1 - pan) * 0.5 * 2 ** 0.5;
  R[i] += v * (1 + pan) * 0.5 * 2 ** 0.5;
};
const rms = ([L, R], t0 = 0, t1 = N / SR) => {
  let s = 0;
  const a = idx(t0);
  const b = Math.min(N, idx(t1));
  for (let i = a; i < b; i++) s += (L[i] * L[i] + R[i] * R[i]) / 2;
  return Math.sqrt(s / Math.max(1, b - a));
};
const scale = ([L, R], g) => {
  for (let i = 0; i < N; i++) {
    L[i] *= g;
    R[i] *= g;
  }
};

// Seeded PRNG so every run produces identical noise
let seed = 20261026;
const noise = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
};
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
// Same shape as the video's interpolate(..., Easing.inOut(Easing.cubic)) tracks
const track = (frame, frames, values) => {
  if (frame <= frames[0]) return values[0];
  for (let i = 0; i < frames.length - 1; i++) {
    if (frame < frames[i + 1]) {
      const t = (frame - frames[i]) / (frames[i + 1] - frames[i]);
      return values[i] + (values[i + 1] - values[i]) * easeInOutCubic(t);
    }
  }
  return values[values.length - 1];
};
const lpCoef = (fc) => 1 - Math.exp((-TAU * fc) / SR);

// ================= Voice =================
const voice = stem();
for (const line of timeline.voice) {
  const { sampleRate, channels } = readWav(new URL(`../public/${line.file}`, import.meta.url));
  if (sampleRate !== SR) throw new Error(`${line.file}: expected ${SR} Hz`);
  const x = channels[0];
  const i0 = idx(line.at);
  for (let j = 0; j < x.length; j++) addTo(voice, i0 + j, x[j]);
}
// Speech activity (for ducking), smoothed with a fast attack / slow release
const speaking = new Float32Array(N);
for (const line of timeline.voice) {
  for (let i = idx(line.speech[0]); i < Math.min(N, idx(line.speech[1])); i++) speaking[i] = 1;
}
const duckEnv = new Float32Array(N);
{
  const att = 1 - Math.exp(-1 / (0.06 * SR));
  const rel = 1 - Math.exp(-1 / (0.35 * SR));
  let e = 0;
  // Look ahead 80 ms so the music is already down when a word starts
  const look = idx(0.08);
  for (let i = 0; i < N; i++) {
    const target = speaking[Math.min(N - 1, i + look)];
    e += (target > e ? att : rel) * (target - e);
    duckEnv[i] = e;
  }
}

// ================= Music =================
const music = stem();
const musicFile = new URL("../public/music.wav", import.meta.url);
const useSuno = fs.existsSync(musicFile);
if (useSuno) {
  const { sampleRate, channels } = readWav(musicFile);
  if (sampleRate !== SR) throw new Error(`music.wav: expected ${SR} Hz`);
  const [ml, mr] = channels.length > 1 ? channels : [channels[0], channels[0]];
  const fadeOut = idx(2.2);
  for (let i = 0; i < N && i < ml.length; i++) {
    const g = Math.min(1, i / idx(0.4), (N - 1 - i) / fadeOut);
    music[0][i] = ml[i] * g;
    music[1][i] = mr[i] * g;
  }
} else {
  // Procedural fallback: soft detuned pad following the story's mood (times in story frames)
  const NOTE = { A1: 55, F2: 87.31, G2: 98, A2: 110, Bb2: 116.54, B2: 123.47, C3: 130.81, D3: 146.83, E3: 164.81, G3: 196, A3: 220, C4: 261.63, D4: 293.66, E4: 329.63 };
  const chords = [
    { s: 0, notes: ["A2", "C3", "E3", "A3"] },
    { s: 150, notes: ["F2", "A2", "C3", "E3"] },
    { s: 300, notes: ["A1", "Bb2", "E3"] },
    { s: 504, notes: ["A2", "C3", "E3"] },
    { s: 576, notes: ["F2", "A2", "C3", "E3"] },
    { s: 639, notes: ["G2", "B2", "D3", "G3"] },
    { s: 702, notes: ["C3", "E3", "G3", "C4"] },
    { s: 801, notes: ["C3", "G3", "D4", "E4"] },
  ].map((c) => ({ ...c, t: storySec(c.s) }));
  const XF = 0.8;
  chords.forEach((c, ci) => {
    const end = ci + 1 < chords.length ? chords[ci + 1].t : N / SR;
    for (const [n, name] of c.notes.entries()) {
      const f = NOTE[name];
      const pan = (n / Math.max(1, c.notes.length - 1)) * 0.8 - 0.4;
      for (let i = idx(Math.max(0, c.t - XF / 2)); i < Math.min(N, idx(end + XF / 2)); i++) {
        const t = i / SR;
        const env = Math.sin((Math.max(0, Math.min(1, (t - c.t + XF / 2) / XF, ci + 1 < chords.length ? (end + XF / 2 - t) / XF : 1)) * Math.PI) / 2);
        const v = Math.sin(TAU * f * t) + Math.sin(TAU * f * 1.0021 * t + 1) + Math.sin(TAU * f * 0.9979 * t + 2) + 0.25 * Math.sin(TAU * f * 2 * t);
        addTo(music, i, v * env * (0.8 + 0.2 * Math.sin(TAU * 0.13 * t + n)), pan);
      }
    }
  });
}
// Duck ~10 dB under the narration
for (let i = 0; i < N; i++) {
  const g = 1 - duckEnv[i] * (1 - dbToGain(-10));
  music[0][i] *= g;
  music[1][i] *= g;
}

// ================= Sound effects =================
const sfx = stem();
const add = (i, v, pan) => addTo(sfx, i, v, pan);

// Monster rumble + growl, driven by the same monster track as the picture
{
  let brown = 0;
  let lp1 = 0;
  let lp2 = 0;
  let sawLp = 0;
  let phase = 0;
  const aRumble = lpCoef(140);
  const aSaw = lpCoef(380);
  const [b0, b1] = beats.breath;
  for (let i = 0; i < N; i++) {
    const frame = (i / SR) * FPS;
    const s = toStory(frame);
    const m = track(s, beats.monster.frames, beats.monster.values);
    if (m < 0.002 && Math.abs(lp2) < 1e-4) continue;
    brown = brown * 0.996 + noise() * 0.06;
    lp1 += aRumble * (brown - lp1);
    lp2 += aRumble * (lp1 - lp2);
    const t = i / SR;
    const sub = Math.sin(TAU * (38 + 14 * m) * t);
    // Pull the rumble back while he breathes
    const duck = 1 - 0.6 * Math.sin(Math.PI * Math.min(1, Math.max(0, (s - b0 + 8) / (b1 - b0 + 16))));
    const rumble = (lp2 * 2.2 + sub * 0.5) * m ** 1.3 * 0.2 * duck;
    // Growl when the monster is large, pulsing with the jaw on screen (real-time oscillator, like the picture)
    const roar = 0.35 + 0.65 * Math.abs(Math.sin(frame * 0.11));
    const growlEnv = Math.max(0, (m - 0.6) / 0.4) ** 1.5 * roar;
    phase += (52 + 6 * Math.sin(TAU * 0.7 * t)) / SR;
    const saw = ((phase % 1) * 2 - 1) * (0.6 + 0.4 * Math.sin(TAU * 7 * t));
    sawLp += aSaw * (saw - sawLp);
    add(i, rumble + sawLp * growlEnv * 0.12 * duck, 0);
  }
}

const blip = (t0, f0, f1, dur, level, pan = 0) => {
  let ph = 0;
  for (let j = 0; j < SR * dur * 3; j++) {
    const t = j / SR;
    ph += (f1 + (f0 - f1) * Math.exp(-t / (dur * 0.5))) / SR;
    add(idx(t0) + j, Math.sin(TAU * ph) * Math.exp(-t / (dur * 0.6)) * Math.min(1, t * 2000) * level, pan);
  }
};
const boom = (t0, level) => {
  let ph = 0;
  let lp = 0;
  const a = lpCoef(260);
  for (let j = 0; j < SR * 1.4; j++) {
    const t = j / SR;
    ph += (38 + 52 * Math.exp(-t * 9)) / SR;
    lp += a * (noise() - lp);
    add(idx(t0) + j, (Math.sin(TAU * ph) * 0.9 + lp * 1.6 * Math.exp(-t * 10)) * Math.exp(-t * 3.2) * Math.min(1, t * 800) * level, 0);
  }
};
const whoosh = (t0, dur, fFrom, fTo, level) => {
  let lp = 0;
  let lp2 = 0;
  for (let j = 0; j < SR * dur; j++) {
    const p = j / (SR * dur);
    const a = lpCoef(fFrom * (fTo / fFrom) ** p);
    const x = noise();
    lp += a * (x - lp);
    lp2 += a * 0.25 * (x - lp2);
    add(idx(t0) + j, (lp - lp2) * Math.sin(Math.PI * Math.min(1, p * 1.6)) ** 2 * (1 - p) ** 0.5 * level, Math.sin(p * Math.PI * 2) * 0.4);
  }
};
const breathNoise = (t0, t1, inhale, level) => {
  const n = idx(t1) - idx(t0);
  let lo = 0;
  let hi = 0;
  for (let j = 0; j < n; j++) {
    const p = j / n;
    const x = noise();
    hi += lpCoef(inhale ? 900 + 900 * p : 1500 - 800 * p) * (x - hi);
    lo += lpCoef(250) * (x - lo);
    const env = inhale ? Math.sin((Math.PI / 2) * Math.min(1, p * 1.3)) * (1 - p) ** 0.3 : Math.sin(Math.PI * Math.min(1, p * 2.5) * 0.5) * (1 - p) ** 1.2;
    add(idx(t0) + j, (hi - lo) * env * level, 0);
  }
};
const heartbeat = (t0, level) => {
  for (const [dt, amp] of [
    [0, 1],
    [0.2, 0.7],
  ]) {
    let ph = 0;
    for (let j = 0; j < SR * 0.3; j++) {
      const t = j / SR;
      ph += (48 + 30 * Math.exp(-t * 30)) / SR;
      add(idx(t0 + dt) + j, Math.sin(TAU * ph) * Math.exp(-t * 14) * Math.min(1, t * 600) * amp * level, 0);
    }
  }
};
const chime = (t0, f, level, pan = 0) => {
  for (let j = 0; j < SR * 1.6; j++) {
    const t = j / SR;
    const v = Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * f * 2.01 * t) * Math.exp(-t * 6) + 0.15 * Math.sin(TAU * f * 3.98 * t) * Math.exp(-t * 10);
    add(idx(t0) + j, v * Math.exp(-t * 3) * Math.min(1, t * 1500) * level, pan);
  }
};

// Title pop, then a pop as each caption word lands (emphasised words hit as booms)
blip(0.03, 520, 260, 0.08, 0.16);
for (const chunk of timeline.captions) {
  chunk.words.forEach((w, i) => {
    const t = (w.frame - 2) / FPS;
    if (w.emph) boom(t, 0.42);
    else blip(t, 1250 * (1 + 0.06 * (i % 3)), 1250 * 0.55, 0.03, i === 0 ? 0.06 : 0.04, (i % 2 ? 1 : -1) * 0.15);
  });
}
whoosh(storySec(beats.flash) - 0.15, 0.55, 7000, 250, 0.35);
// Heartbeat speeding up while the fear takes over
for (let s = 300, gap = 27; s < 455; s += gap, gap = Math.max(17, gap - 1.5)) {
  heartbeat(storySec(s), 0.42 * Math.min(1, (s - 300) / 36 + 0.4));
}
// Breath: inhale up to the peak of the ring, slow exhale after
{
  const [b0, b1] = beats.breath;
  const mid = (b0 + b1) / 2 + 1.5;
  breathNoise(storySec(b0) + 0.05, storySec(mid), true, 0.16);
  breathNoise(storySec(mid), storySec(b1) + 0.35, false, 0.14);
}
// Practice bubbles, and a small deflate as each attempt shrinks the shadow
for (const f of beats.practice) {
  blip(storySec(f), 520, 720, 0.05, 0.08, 0.3);
  blip(storySec(f) + 0.09, 640, 900, 0.05, 0.06, 0.3);
  whoosh(storySec(f + 22), 0.5, 900, 120, 0.12);
}
// He speaks: bubble pop, then the shadow's final shrink
blip(storySec(beats.speech[0]), 900, 1400, 0.06, 0.14);
whoosh(storySec(beats.speech[0] + 10), 2.2, 1200, 90, 0.1);
// End card: a soft chime under each closing word, a shimmer for the subtitle
const pent = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
timeline.endCard.words.forEach((w, i) => chime((w.frame - 3) / FPS, pent[i % pent.length], 0.035, i / 5 - 0.5));
{
  const last = timeline.endCard.words[timeline.endCard.words.length - 1].frame;
  chime((last + 24) / FPS, 1318.5, 0.03, 0.3);
  chime((last + 24) / FPS + 0.12, 1567.98, 0.025, -0.3);
}

// ================= Mix =================
// Level each stem against the narration: speech RMS -> -18 dBFS, music bed sits ~13 dB under it,
// effects are measured in the loudest fear section.
const speechSpans = timeline.voice.map((v) => v.speech);
const speechRms = Math.sqrt(speechSpans.reduce((a, [t0, t1]) => a + rms(voice, t0, t1) ** 2 * (t1 - t0), 0) / speechSpans.reduce((a, [t0, t1]) => a + t1 - t0, 0));
scale(voice, dbToGain(-18) / speechRms);
scale(music, dbToGain(useSuno ? -27 : -29) / rms(music, 0, N / SR));
scale(sfx, dbToGain(-25) / rms(sfx, storySec(330), storySec(450)));

const L = new Float32Array(N);
const R = new Float32Array(N);
const fade = idx(1.2);
let peak = 0;
for (let i = 0; i < N; i++) {
  const g = Math.min(1, i / idx(0.05), (N - 1 - i) / fade);
  L[i] = Math.tanh((voice[0][i] + music[0][i] + sfx[0][i]) * g * 1.1);
  R[i] = Math.tanh((voice[1][i] + music[1][i] + sfx[1][i]) * g * 1.1);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = dbToGain(-1) / peak;
for (let i = 0; i < N; i++) {
  L[i] *= norm;
  R[i] *= norm;
}
writeWav(new URL("../public/soundtrack.wav", import.meta.url), SR, [L, R]);
console.log(`wrote public/soundtrack.wav (${(N / SR).toFixed(2)}s, music: ${useSuno ? "Suno" : "procedural"}, post gain ${(20 * Math.log10(norm)).toFixed(1)} dB)`);
