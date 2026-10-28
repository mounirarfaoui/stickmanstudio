// Sound design for LAST LIGHT — Part 7 "The Bridge".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { SR, N, storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, blip, heartbeat } = fx;
  const { sample, thud, slap, loop, scrape } = makeKit(ctx, fx);
  const at = storySec;
  const end = at(beats.cut);

  // ---------- wind on the bridge, the dead between the cars ----------
  loop("wind", 0, end, 0.5);
  loop("moans", at(beats.full) - 0.4, end, 0.32);
  // fast footsteps on the approach
  for (let s = 6; s < beats.climb[0]; s += 13) thud(at(s), 0.08, 95);
  boom(at(beats.reveal), 0.35);
  boom(at(beats.full), 0.55);
  sample("last-light/part01/sfx/growl", at(beats.full + 2), 0.45, { from: "onset", dur: 1.4, fadeOut: 0.4 });

  // ---------- onto the roofs ----------
  scrape(at(beats.climb[0]), at(beats.climb[0] + 14), 0.15);
  sample("roof", at(198), 0.35, { from: "onset", dur: 0.8, fadeOut: 0.2 });
  sample("roof", at(222), 0.3, { from: "onset", dur: 0.8, fadeOut: 0.2 });
  // running on sheet metal, a bang on every landing
  for (let s = 220; s < 345; s += 8) thud(at(s), 0.07, 120);
  for (const s of [258, 300, 345, 495]) sample("roof", at(s), 0.5, { from: "onset", dur: 0.8, fadeOut: 0.2 });
  for (const s of [240, 280, 322, 480]) whoosh(at(s), 0.3, 2400, 500, 0.22);
  // hands slapping up at the cars
  for (const s of [268, 276, 284, 292, 440, 448, 456]) slap(at(s), 0.18);
  sample("last-light/part01/sfx/growl", at(beats.them - 4), 0.5, { from: "onset", dur: 1.2, fadeOut: 0.4 });
  for (let s = 400; s < 470; s += 22) heartbeat(at(s), 0.28);

  // ---------- the truck ----------
  thud(at(beats.hop), 0.4, 80);
  for (let s = 535; s < 720; s += 18) thud(at(s), 0.06, 100);
  sample("glass", at(600), 0.35, { from: "onset", dur: 1.4, fadeOut: 0.4 });
  boom(at(beats.truck), 0.5);
  blip(at(beats.truck), 220, 90, 0.4, 0.25, 0);
  sample("glass", at(705), 0.3, { from: "onset", dur: 1.2, fadeOut: 0.4 });
  // the leash slides out of the bed
  scrape(at(beats.lift[0]), at(beats.lift[1]), 0.08);
  for (let s = beats.gone; s < beats.escape; s += 26) heartbeat(at(s), 0.2);
  sample("last-light/part01/sfx/growl", at(beats.growl), 0.6, { from: "onset", dur: 1.6, fadeOut: 0.4 });
  boom(at(beats.growl + 2), 0.35);

  // ---------- back on the roofs ----------
  for (const s of [948, 975, 995, 1030, 1065]) sample("roof", at(s), 0.45, { from: "onset", dur: 0.8, fadeOut: 0.2 });
  for (let s = 940; s < 1065; s += 8) thud(at(s), 0.06, 120);

  // ---------- the last gap ----------
  for (let s = beats.gapLine; s < beats.jump[0]; s += 18) heartbeat(at(s), 0.3 + (s - beats.gapLine) / 400);
  whoosh(at(beats.miaJump[0]), 0.4, 2600, 500, 0.3);
  sample("roof", at(beats.miaJump[1]), 0.55, { from: "onset", dur: 0.8, fadeOut: 0.2 });
  for (let s = 1172; s < beats.jump[0]; s += 6) thud(at(s), 0.1, 120);
  whoosh(at(beats.jump[0]), 0.5, 3000, 400, 0.45);
  boom(at(beats.jump[1]), 0.7);
  slap(at(beats.jump[1]), 0.6);
  scrape(at(beats.slip - 2), at(beats.slip + 10), 0.35);
  boom(at(beats.slip + 6), 0.45);
  for (let s = beats.slip + 10; s < beats.grab; s += 14) heartbeat(at(s), 0.45);
  for (const s of [1300, 1316, 1350, 1364]) slap(at(s), 0.2);
  // the grab, then nothing
  boom(at(beats.grab), 0.9);
  slap(at(beats.grab), 0.7);
  sample("last-light/part01/sfx/growl", at(beats.grab - 3), 0.8, { from: "onset", dur: at(beats.cut) - at(beats.grab - 3), fadeOut: 0.05 });
  boom(at(beats.card), 0.6);

  // Effects are levelled over the crossing
  return { stem: out, levelSpan: [at(200), at(beats.cut)], levelDb: -22 };
}
