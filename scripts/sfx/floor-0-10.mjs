// Sound design for FLOOR 0 — Part 10 "Tied".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, blip, heartbeat, chime } = fx;
  const { sample, thud, clang, slap, staticBurst } = makeKit(ctx, fx);
  const at = storySec;
  const P8 = "floor-0/part08/sfx/";
  const freeze = at(beats.freeze);

  // ---------- the first cut, then the whole room snapping in a wave ----------
  boom(0, 0.9);
  sample(`${P8}snip`, at(beats.firstCut) - 0.15, 0.9, { from: "onset", dur: 0.9, fadeOut: 0.3 });
  sample(`${P8}snap`, at(beats.firstCut), 1, { from: "onset", dur: 1.6, fadeOut: 0.5 });
  boom(at(beats.firstCut), 0.8);
  for (let i = 0; i < 16; i++) {
    const t = at(beats.cascade[0]) + (i / 16) * (at(beats.cascade[1]) - at(beats.cascade[0]));
    sample(`${P8}snap`, t, 0.25 + 0.2 * Math.sin(i * 1.7) ** 2, { from: "onset", dur: 0.9, fadeOut: 0.4 });
    if (i % 3 === 0) whoosh(t + 0.1, 1.2, 140, 900, 0.18);
  }
  for (const s of [30, 90, 170]) boom(at(s), 0.5);

  // ---------- she claps ----------
  for (let s = beats.clap[0]; s < beats.clap[1]; s += 34) slap(at(s), 0.35);

  // ---------- the shears won't cut his cable ----------
  for (let s = beats.walk[0]; s < beats.walk[1]; s += 9) thud(at(s), 0.12, 90);
  beats.bounce.forEach((s, i) => {
    sample(`${P8}snip`, at(s) - 0.1, 0.6 + i * 0.1, { from: "onset", dur: 0.6, fadeOut: 0.2 });
    chime(at(s) + 0.02, 2637, 0.16);
    clang(at(s), 0.2);
  });

  // ---------- following it down, along the floor ----------
  staticBurst(at(beats.follow[0]), 0.2, 0.05);
  for (let s = beats.follow[0]; s < beats.answer; s += 26) heartbeat(at(s), 0.22);
  chime(at(beats.follow[2]), 1245, 0.2);
  boom(at(beats.answer), 0.6);

  // ---------- it pulls ----------
  boom(at(beats.tug), 1);
  thud(at(beats.tug), 0.9, 45);
  clang(at(beats.tug), 0.35);
  whoosh(at(beats.tug), 0.5, 300, 2400, 0.35);
  for (let s = beats.tug; s < beats.freeze; s += 12) heartbeat(at(s), 0.3 + (s - beats.tug) / 300);
  for (let s = beats.choice; s < beats.freeze; s += 30) blip(at(s), 1800, 1800, 0.02, 0.14);

  // ---------- the freeze ----------
  whoosh(freeze - 0.35, 0.4, 400, 3200, 0.4);
  boom(freeze, 0.9);
  blip(at(beats.cards), 600, 900, 0.08, 0.25);
  blip(at(beats.cards) + 0.2, 900, 1300, 0.08, 0.25);

  return { stem: out, levelSpan: [0, freeze], levelDb: -20 };
}
