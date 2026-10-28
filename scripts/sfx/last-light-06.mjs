// Sound design for LAST LIGHT — Part 6 "Strangers".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { SR, N, storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, blip, heartbeat } = fx;
  const { sample, thud, slap, loop, scrape } = makeKit(ctx, fx);
  const at = storySec;
  const end = N / SR;

  // ---------- the doorway: the torch, the headlights ----------
  loop("last-light/part05/sfx/store", 0, at(beats.out), 0.4);
  loop("idle", at(beats.headlights) - 0.2, at(beats.road), 0.45);
  for (let s = 6; s < 60; s += 16) heartbeat(at(s), 0.3);
  boom(at(beats.headlights), 0.55);
  blip(at(beats.headlights), 1800, 900, 0.01, 0.2, 0.2);
  sample("last-light/part03/sfx/bark", at(30), 0.2, { from: "onset", dur: 0.6, fadeOut: 0.3 });
  thud(at(beats.rifleDown[1]), 0.15, 160);

  // ---------- outside: the truck ----------
  sample("last-light/part05/sfx/bell", at(beats.out) + 0.05, 0.4, { from: "onset", dur: 1.2, fadeOut: 0.3 });
  for (let s = beats.walkOut[0] + 6; s < beats.walkOut[1] - 10; s += 17) thud(at(s), 0.1, 90);
  sample("last-light/part03/sfx/bark", at(270), 0.25, { from: "onset", dur: 0.6, fadeOut: 0.3 });
  whoosh(at(beats.grab), 0.2, 2500, 500, 0.25);
  slap(at(beats.grab + 2), 0.25);
  whoosh(at(beats.lift[0]), 0.3, 1800, 400, 0.25);
  thud(at(beats.lift[1]), 0.35, 110);
  for (const s of [beats.climb[0] + 20, beats.climb[1]]) thud(at(s), 0.45, 80);
  slap(at(beats.tailgate), 0.5);

  // ---------- the night road ----------
  loop("drive", at(beats.road) - 0.1, at(beats.gas) + 0.4, 0.6);
  whoosh(at(beats.road), 0.4, 3000, 300, 0.35);
  sample("last-light/part01/sfx/growl", at(beats.zombie - 6), 0.5, { from: "onset", dur: 1.6, fadeOut: 0.5 });
  whoosh(at(650), 0.35, 4000, 500, 0.5);
  boom(at(652), 0.5);
  blip(at(beats.mirror[0] + 14), 300, 200, 0.02, 0.5, 0);
  for (let s = beats.mirror[0] + 14; s < beats.mirror[1]; s += 20) heartbeat(at(s), 0.3);

  // ---------- the gas station ----------
  loop("night", at(beats.gas), end, 0.45);
  loop("idle", at(beats.gas), at(868), 0.4);
  scrape(at(beats.gas + 6), at(beats.brake + 4), 0.25);
  thud(at(beats.brake), 0.5, 70);
  for (const s of [beats.hop[0] + 18, beats.hop[1]]) thud(at(s), 0.35, 90);
  for (let s = beats.walkStore[0] + 8; s < beats.enter; s += 17) thud(at(s), 0.08, 90);
  sample("last-light/part05/sfx/creak", at(beats.enter - 8), 0.35, { from: "onset", dur: 1.0, fadeOut: 0.3 });
  thud(at(beats.sneak[1] + 2), 0.25, 140);
  // the betrayal
  sample("peel", at(beats.engine), 0.95, { from: "onset", dur: at(beats.behind + 60) - at(beats.engine), fadeOut: 1.5 });
  boom(at(beats.engine), 0.6);
  sample("last-light/part02/sfx/creak", at(beats.burst - 2), 0.4, { from: "onset", dur: 0.6, fadeOut: 0.2 });
  slap(at(beats.burst), 0.6);
  for (let s = beats.burst + 4; s < beats.behind; s += 9) thud(at(s), 0.12, 100);
  for (let s = beats.burst; s < beats.behind + 80; s += 26) sample("last-light/part03/sfx/bark", at(s), 0.45 * Math.max(0.15, 1 - (s - beats.burst) / 260), { from: "onset", dur: 0.6, fadeOut: 0.3 });
  for (const t of [0, 0.12, 0.3]) thud(at(beats.drop) + t, 0.2, 260);
  thud(at(1166), 0.3, 220);
  // the empty road
  for (let s = beats.behind; s < beats.stop; s += 9) thud(at(s), 0.1, 100);
  boom(at(beats.card), 0.7);

  // Effects are levelled on the betrayal
  return { stem: out, levelSpan: [at(beats.engine), at(beats.behind)], levelDb: -21 };
}
