// Sound design for FLOOR 0 — Part 12 "The First Theo".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, blip, heartbeat, chime } = fx;
  const { sample, thud, clang, shatter, staticBurst } = makeKit(ctx, fx);
  const at = storySec;
  const freeze = at(beats.freeze);

  // ---------- its face, then the climb: a cut every second ----------
  boom(0, 1);
  chime(0.05, 1245, 0.22);
  for (const s of [22, 45, 75]) boom(at(s), 0.5);
  for (let s = beats.climb[0] + 6; s < beats.climb[1]; s += 12) clang(at(s), 0.08);
  for (let s = 0; s < beats.dark[0]; s += 20) heartbeat(at(s), 0.22);

  // ---------- a floor below goes dark with every rung ----------
  for (let i = 0; i < 8; i++) sample("clunk", at(beats.dark[0] + (i / 8) * (beats.dark[1] - beats.dark[0])), 0.45 + i * 0.05, { from: "onset", dur: 0.9, fadeOut: 0.3 });

  // ---------- one of his lights goes out ----------
  shatter(at(beats.burst), 0.7);
  boom(at(beats.burst), 1);
  thud(at(beats.burst), 0.8, 45);

  // ---------- it leans down; the arm ----------
  whoosh(at(beats.lean[0]), 1.6, 120, 700, 0.3);
  staticBurst(at(beats.reach[1]) - 0.1, 0.25, 0.08);
  boom(at(beats.reach[1]), 0.7);
  for (let s = beats.marks[0]; s < beats.firstTheo; s += 26) heartbeat(at(s), 0.24);

  // ---------- it was the first Theo ----------
  boom(at(beats.firstTheo), 1);
  chime(at(beats.firstTheo) + 0.1, 1568, 0.2);
  chime(at(beats.firstTheo) + 0.6, 1175, 0.16);
  for (let s = beats.choice; s < beats.freeze; s += 12) heartbeat(at(s), 0.3 + (s - beats.choice) / 300);
  for (let s = beats.choice; s < beats.freeze; s += 30) blip(at(s), 1800, 1800, 0.02, 0.14);

  // ---------- the freeze ----------
  whoosh(freeze - 0.35, 0.4, 400, 3200, 0.4);
  boom(freeze, 0.9);
  blip(at(beats.cards), 600, 900, 0.08, 0.25);
  blip(at(beats.cards) + 0.2, 900, 1300, 0.08, 0.25);

  return { stem: out, levelSpan: [0, freeze], levelDb: -20 };
}
