// Sound effects for "Your Brain Is Lying to You": monster rumble and growl, heartbeat, breath,
// caption pops, practice blips, the speech pop and the end-card chimes.
import { TAU } from "../synth.mjs";

export default function sfx(ctx) {
  const { SR, FPS, N, storySec, toStory, stem, noise, track, lpCoef, effects, timeline, beats } = ctx;
  const out = stem();
  const { add, blip, boom, whoosh, breathNoise, heartbeat, chime } = effects(out);

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

  // Effects are levelled on the loudest section, the fear build-up
  return { stem: out, levelSpan: [storySec(330), storySec(450)], levelDb: -25 };
}
