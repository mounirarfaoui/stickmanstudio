// Sound design for LAST LIGHT — Part 1 "Day One". Sampled textures (Suno sounds) where they exist,
// procedural hits wherever an effect has to land on an exact frame or spoken word.
import fs from "node:fs";
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { SR, FPS, N, storySec, stem, effects, timeline, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, heartbeat } = fx;
  const dur = N / SR;
  const { sampleFile, sample, thud, doorBang, shatter, scrape, staticBurst, alertTone, slap, crackle } = makeKit(ctx, fx);

  // ---------- the scene ----------
  // Night ambience under everything, looped
  const ambFile = sampleFile("ambience");
  if (fs.existsSync(ambFile)) {
    const len = fs.statSync(ambFile).size / (SR * 4);
    for (let t = 0; t < dur; t += len - 1) sample("ambience", t, 0.35, { fadeIn: t === 0 ? 0.3 : 1, fadeOut: 1 });
  }

  // TV switches itself on: static, then the alert beeps, then the anchor
  const tv = storySec(beats.tvOn);
  staticBurst(tv, 0.22, 0.25);
  alertTone(tv + 0.25, 0.16, 0.16);
  alertTone(tv + 0.47, 0.16, 0.16);
  // ...and the broadcast dies
  staticBurst(storySec(beats.tvDead), 0.28, 0.18);

  // Mr. Dawson looks up: a sting and a growl
  const snap = storySec(beats.dawsonSnap);
  boom(snap, 0.5);
  sample("growl", snap + 0.05, 0.9, { from: "onset", dur: 2.2, fadeOut: 0.6 });
  // He charges: fast heavy steps and a rush of air
  for (let s = beats.charge[0]; s < beats.charge[1]; s += 4) thud(storySec(s), 0.35 + 0.4 * ((s - beats.charge[0]) / (beats.charge[1] - beats.charge[0])), 55);
  whoosh(storySec(beats.charge[0]), storySec(beats.charge[1]) - storySec(beats.charge[0]) + 0.3, 400, 3000, 0.3);

  // The mug: slips, falls, shatters
  whoosh(storySec(beats.mugDrop), 0.35, 2500, 600, 0.12);
  shatter(storySec(beats.mugShatter), 0.55);

  // Kai runs for the door and drags the dresser across it
  for (let s = 478; s < 530; s += 7) thud(storySec(s), 0.28, 70);
  scrape(storySec(beats.dresser[0]), storySec(beats.dresser[1]), 0.5);

  // Bangs on the spoken "hit / Again / again", the last one hardest; a muffled growl through the door
  const bangs = timeline.captions.filter((c) => c.line === "hit").flatMap((c) => c.words.map((w) => w.frame / FPS));
  bangs.forEach((t, i) => doorBang(t, 0.55 + i * 0.12));
  if (bangs.length > 1) sample("growl", bangs[1] + 0.25, 0.35, { from: "onset", dur: 1.6, fadeOut: 0.5 });

  // Silence: just a heartbeat, slow then quicker
  const sil = storySec(beats.silence);
  for (let t = sil + 0.3, gap = 0.95; t < storySec(beats.whip) - 0.1; t += gap, gap = Math.max(0.6, gap - 0.04)) heartbeat(t, 0.4);

  // Whip pan to the window: the horde, hands on the glass, the crack
  const whip = storySec(beats.whip);
  whoosh(whip - 0.1, 0.45, 5000, 300, 0.4);
  sample("horde", whip + 0.1, 0.8, { from: "onset", dur: storySec(beats.card) - whip, fadeIn: 0.4, fadeOut: 0.3 });
  [0, 0.15, 0.3, 0.42, 0.55, 0.68, 0.8].forEach((at) => slap(storySec(beats.whip + 6 + at * 70), 0.45));
  crackle(storySec(beats.crack[0]), storySec(beats.crack[1]), 0.3);

  // Cut to the card: one last impact
  boom(storySec(beats.card), 0.75);

  // Effects are levelled on the door-banging section
  return { stem: out, levelSpan: [storySec(572), storySec(666)], levelDb: -21 };
}
