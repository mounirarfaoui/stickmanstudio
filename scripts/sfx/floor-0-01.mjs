// Sound design for FLOOR 0 — Part 1 "Floor Twelve".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, blip, heartbeat, chime } = fx;
  const { sample, thud, loop, scrape, staticBurst } = makeKit(ctx, fx);
  const at = storySec;
  const freeze = at(beats.freeze);

  // ---------- the fall ----------
  sample("fall", 0, 0.9, { from: "onset", dur: at(beats.slam) + 0.05, fadeIn: 0.01, fadeOut: 0.05 });
  whoosh(0, at(beats.slam), 300, 2400, 0.35);
  for (let s = 10; s < beats.slam; s += 16) heartbeat(at(s), 0.2);
  // the brakes bite
  sample("brake", at(beats.slam) - 0.08, 1, { from: "onset", dur: 2.6, fadeOut: 0.6 });
  boom(at(beats.slam), 1);
  thud(at(beats.slam), 0.8, 45);
  scrape(at(beats.slam + 20), at(beats.slam + 50), 0.06);

  // ---------- the panel: a dead click on an empty socket ----------
  for (const s of [beats.noZero, 258, 268, 280]) {
    thud(at(s), 0.25, 220);
    blip(at(s), 1400, 900, 0.03, 0.18);
  }
  boom(at(beats.noZero), 0.35);

  // ---------- the notice, the tally marks ----------
  heartbeat(at(beats.plaque + 40), 0.25);
  heartbeat(at(beats.plaque + 62), 0.25);
  scrape(at(beats.tally + 6), at(beats.tally + 40), 0.07);
  for (let s = 472; s < beats.speaker; s += 20) heartbeat(at(s), 0.3);
  boom(at(472), 0.4);

  // ---------- the Operator ----------
  staticBurst(at(beats.speaker), 0.3, 0.12);
  staticBurst(at(645), 0.2, 0.08);

  // ---------- Floor 12 ----------
  chime(at(beats.ding), 1318.5, 0.5);
  chime(at(beats.ding) + 0.28, 1046.5, 0.45);
  sample("doors", at(beats.open[0]), 0.7, { from: "onset", dur: 2.5, fadeOut: 0.5 });
  loop("hum", at(beats.open[0]), freeze, 0.32);
  loop("kids", at(beats.school), at(beats.her - 5), 0.2);
  boom(at(beats.theo), 0.45);
  // the tubes die for a moment, and she is there
  staticBurst(at(beats.her - 5), 0.18, 0.2);
  boom(at(beats.her), 0.6);
  chime(at(beats.keyGlow), 2093, 0.22);
  chime(at(beats.keyGlow) + 0.12, 2637, 0.18);

  // ---------- something huge ----------
  for (const s of beats.step) {
    sample("steps", at(s) - 0.05, 0.85, { from: "onset", dur: 1.1, fadeOut: 0.4 });
    boom(at(s), 0.65);
    thud(at(s), 0.55, 42);
    staticBurst(at(s) + 0.02, 0.08, 0.12);
  }
  // the clock and his heart race to the freeze
  for (let s = beats.choice; s < beats.freeze; s += 14) heartbeat(at(s), 0.35 + (s - beats.choice) / 400);
  for (let s = beats.choice; s < beats.freeze; s += 30) blip(at(s), 1800, 1800, 0.02, 0.12);

  // ---------- the freeze: everything stops ----------
  whoosh(freeze - 0.35, 0.4, 400, 3200, 0.4);
  boom(freeze, 0.9);
  blip(at(beats.cards), 600, 900, 0.08, 0.25);
  blip(at(beats.cards) + 0.2, 900, 1300, 0.08, 0.25);
  boom(at(beats.card), 0.55);
  chime(at(beats.card) + 0.1, 1318.5, 0.3);

  return { stem: out, levelSpan: [0, freeze], levelDb: -21 };
}
