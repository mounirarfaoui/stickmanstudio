// Sound design for LAST LIGHT — Part 8 "The Scratch".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { N, SR, storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, heartbeat } = fx;
  const { sample, thud, slap, loop, scrape } = makeKit(ctx, fx);
  const at = storySec;
  const end = N / SR;

  // ---------- the bus: pulling, kicking, tearing ----------
  loop("last-light/part07/sfx/wind", 0, at(beats.plaza), 0.45);
  loop("last-light/part07/sfx/moans", 0, at(beats.plaza), 0.4);
  sample("last-light/part01/sfx/growl", at(2), 0.55, { from: "onset", dur: 1.6, fadeOut: 0.4 });
  for (let s = 6; s < beats.tore; s += 22) heartbeat(at(s), 0.35);
  scrape(at(beats.pulled - 6), at(beats.pulled + 10), 0.25);
  for (const s of [beats.kicked - 4, beats.kicked + 6, beats.kicked + 16, beats.kicked + 28, 100, 112]) slap(at(s), 0.35);
  sample("last-light/part01/sfx/growl", at(120), 0.5, { from: "onset", dur: 1.4, fadeOut: 0.4 });
  // cloth rips
  scrape(at(beats.tore - 3), at(beats.tore + 5), 0.7);
  boom(at(beats.tore), 0.6);
  sample("last-light/part07/sfx/roof", at(beats.up[1]), 0.55, { from: "onset", dur: 0.8, fadeOut: 0.2 });
  // the run off the bridge
  for (let s = beats.run + 4; s < beats.hopDown[0]; s += 7) thud(at(s), 0.1, 130);
  thud(at(beats.hopDown[1]), 0.45, 80);
  for (let s = beats.hopDown[1] + 6; s < beats.door; s += 8) thud(at(s), 0.1, 100);
  whoosh(at(beats.plaza - 2), 0.35, 2500, 400, 0.25);

  // ---------- the booth ----------
  loop("night", at(beats.plaza), at(beats.dawn[1]), 0.4);
  sample("last-light/part05/sfx/creak", at(beats.door - 6), 0.35, { from: "onset", dur: 1.0, fadeOut: 0.3 });
  slap(at(beats.inside - 2), 0.4);
  sample("lighter", at(beats.lighter - 4), 0.7, { from: "onset", dur: 1.6, fadeOut: 0.4 });
  for (let s = beats.inside + 10; s < 480; s += 26) heartbeat(at(s), 0.25);
  whoosh(at(beats.batUp[0]), 0.3, 1800, 400, 0.2);
  for (let s = 500; s < beats.batDown[0]; s += 24) heartbeat(at(s), 0.3);
  thud(at(700), 0.25, 110);
  // writing, folding, the backpack
  sample("pencil", at(beats.write[0]), 0.6, { from: "onset", dur: at(beats.fold[1]) - at(beats.write[0]), fadeOut: 0.4 });
  scrape(at(beats.slip[0] + 4), at(beats.slip[0] + 12), 0.08);
  sample("lighter", at(beats.lighterOut - 2), 0.3, { from: "onset", dur: 0.4, fadeOut: 0.2 });

  // ---------- dawn ----------
  loop("dawn", at(beats.dawn[0]), end, 0.45);
  boom(at(beats.eyes), 0.25);
  thud(at(beats.hug[0]), 0.3, 90);
  for (let s = beats.bark; s < beats.leap[1] + 30; s += 18) sample("last-light/part03/sfx/bark", at(s), Math.min(0.6, 0.2 + (s - beats.bark) / 250), { from: "onset", dur: 0.6, fadeOut: 0.3 });
  sample("last-light/part05/sfx/creak", at(beats.outside), 0.3, { from: "onset", dur: 0.8, fadeOut: 0.3 });
  for (let s = 1102; s < 1150; s += 8) thud(at(s), 0.1, 100);
  thud(at(1165), 0.35, 80);
  thud(at(beats.leap[1]), 0.4, 90);

  // ---------- the cough ----------
  sample("cough", at(beats.cough - 2), 0.75, { from: "onset", dur: 2.2, fadeOut: 0.5 });
  boom(at(beats.palm[0]), 0.4);
  for (let s = beats.palm[0]; s < beats.cut; s += 20) heartbeat(at(s), 0.4);
  scrape(at(beats.wipe[0]), at(beats.wipe[0] + 10), 0.12);
  boom(at(beats.card), 0.6);

  return { stem: out, levelSpan: [0, at(beats.cut)], levelDb: -22 };
}
