// Sound design for FLOOR 0 — Part 13 "The Monster at the Top".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, blip, heartbeat, chime } = fx;
  const { sample, thud, scrape, staticBurst } = makeKit(ctx, fx);
  const at = storySec;
  const freeze = at(beats.freeze);

  // ---------- the shove and the long fall ----------
  boom(0, 1);
  thud(0.05, 0.8, 70);
  whoosh(at(beats.fall[0]), at(beats.impact) - at(beats.fall[0]), 900, 120, 0.4);
  scrape(at(beats.fall[0]), at(beats.impact) - 0.2, 0.06);
  for (const s of [14, 40]) boom(at(s), 0.5);

  // ---------- the lights come back on, floor by floor ----------
  for (let i = 0; i < 8; i++) sample("hum", at(beats.lightsOn[0] + (i / 8) * (beats.lightsOn[1] - beats.lightsOn[0])), 0.35 + i * 0.05, { from: "onset", dur: 1.0, fadeOut: 0.4 });

  // ---------- he hits the bottom, and laughs ----------
  boom(at(beats.impact), 1);
  thud(at(beats.impact), 1, 40);
  sample("laugh", at(beats.laugh[0]) - 0.1, 0.9, { from: "onset", dur: at(beats.laugh[1]) - at(beats.laugh[0]) + 1, fadeOut: 0.6 });

  // ---------- his arms stretch; his eyes light ----------
  for (let s = beats.stretch[0]; s < beats.stretch[1]; s += 14) thud(at(s), 0.15, 110);
  for (let s = beats.hands; s < beats.eyes[1]; s += 24) heartbeat(at(s), 0.24);
  staticBurst(at(beats.eyes[0]), 0.3, 0.08);
  boom(at(beats.eyes[1]), 0.9);
  chime(at(beats.eyes[1]) + 0.1, 1245, 0.2);
  chime(at(beats.marks), 1568, 0.16);

  // ---------- the choice ----------
  for (let s = beats.choice; s < beats.freeze; s += 12) heartbeat(at(s), 0.3 + (s - beats.choice) / 300);
  for (let s = beats.choice; s < beats.freeze; s += 30) blip(at(s), 1800, 1800, 0.02, 0.14);
  whoosh(freeze - 0.35, 0.4, 400, 3200, 0.4);
  boom(freeze, 0.9);
  blip(at(beats.cards), 600, 900, 0.08, 0.25);
  blip(at(beats.cards) + 0.2, 900, 1300, 0.08, 0.25);

  return { stem: out, levelSpan: [0, freeze], levelDb: -20 };
}
