// Shared building blocks for the soundtrack mixer and the per-episode sound-effect modules:
// stereo stems, the story<->output time-warp, a seeded noise source, and procedural effects.
import { readWav } from "./audio-utils.mjs";

export const TAU = Math.PI * 2;

export const createContext = ({ timeline, beats, SR = 48000 }) => {
  const FPS = timeline.fps;
  const N = Math.round((timeline.duration / FPS) * SR);
  const idx = (t) => Math.round(t * SR);

  // Story frame -> output seconds, matching toStory() in the compositions (piecewise linear, extended at the end).
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

  // Seeded PRNG so every run produces identical noise
  let seed = 20261026;
  const noise = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  // Same shape as the compositions' interpolate(..., Easing.inOut(Easing.cubic)) tracks
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

  // ---------- Procedural effects, written into a given stem ----------
  const effects = (target) => {
    const add = (i, v, pan) => addTo(target, i, v, pan);
    return {
      add,
      blip: (t0, f0, f1, dur, level, pan = 0) => {
        let ph = 0;
        for (let j = 0; j < SR * dur * 3; j++) {
          const t = j / SR;
          ph += (f1 + (f0 - f1) * Math.exp(-t / (dur * 0.5))) / SR;
          add(idx(t0) + j, Math.sin(TAU * ph) * Math.exp(-t / (dur * 0.6)) * Math.min(1, t * 2000) * level, pan);
        }
      },
      boom: (t0, level) => {
        let ph = 0;
        let lp = 0;
        const a = lpCoef(260);
        for (let j = 0; j < SR * 1.4; j++) {
          const t = j / SR;
          ph += (38 + 52 * Math.exp(-t * 9)) / SR;
          lp += a * (noise() - lp);
          add(idx(t0) + j, (Math.sin(TAU * ph) * 0.9 + lp * 1.6 * Math.exp(-t * 10)) * Math.exp(-t * 3.2) * Math.min(1, t * 800) * level, 0);
        }
      },
      whoosh: (t0, dur, fFrom, fTo, level) => {
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
      },
      breathNoise: (t0, t1, inhale, level) => {
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
      },
      heartbeat: (t0, level) => {
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
      },
      chime: (t0, f, level, pan = 0) => {
        for (let j = 0; j < SR * 1.6; j++) {
          const t = j / SR;
          const v = Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * f * 2.01 * t) * Math.exp(-t * 6) + 0.15 * Math.sin(TAU * f * 3.98 * t) * Math.exp(-t * 10);
          add(idx(t0) + j, v * Math.exp(-t * 3) * Math.min(1, t * 1500) * level, pan);
        }
      },
      // Place a WAV sample (e.g. a generated sound effect) with optional trim, fades and pan.
      // from: "onset" skips any lead-in until the sound first gets within 18 dB of its peak.
      sample: (file, t0, level, { from = 0, dur = Infinity, fadeIn = 0.01, fadeOut = 0.2, pan = 0 } = {}) => {
        const { sampleRate, channels } = readWav(file);
        if (sampleRate !== SR) throw new Error(`${file}: expected ${SR} Hz`);
        const [l, r] = channels.length > 1 ? channels : [channels[0], channels[0]];
        if (from === "onset") {
          const hop = Math.round(SR * 0.01);
          const env = [];
          for (let i = 0; i + hop <= l.length; i += hop) {
            let e = 0;
            for (let j = i; j < i + hop; j++) e += l[j] * l[j];
            env.push(e / hop);
          }
          const peak = Math.max(...env);
          from = Math.max(0, env.findIndex((e) => e > peak * 10 ** (-18 / 10)) - 2) * 0.01;
        }
        const s0 = Math.round(from * SR);
        const n = Math.min(l.length - s0, Math.round(dur * SR));
        for (let j = 0; j < n; j++) {
          const t = j / SR;
          const g = level * Math.min(1, t / fadeIn, (n - j) / SR / fadeOut);
          const i = idx(t0) + j;
          if (i < 0 || i >= N) continue;
          target[0][i] += l[s0 + j] * g * (1 - Math.max(0, pan));
          target[1][i] += r[s0 + j] * g * (1 + Math.min(0, pan));
        }
      },
    };
  };

  return { SR, FPS, N, idx, storySec, toStory, stem, addTo, noise, track, lpCoef, effects, timeline, beats };
};
