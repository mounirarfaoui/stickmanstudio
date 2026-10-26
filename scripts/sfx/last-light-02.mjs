// Sound design for LAST LIGHT — Part 2 "The Window".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { SR, N, storySec, stem, noise, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, blip } = fx;
  const { sample, thud, doorBang, shatter, scrape, crackle, clang, loop, buzz } = makeKit(ctx, fx);
  const at = storySec;

  const bath = at(beats.slam + 2);
  const ext = at(beats.exterior);
  const alley = at(beats.alley);

  // ---------- living room ----------
  loop("last-light/part01/sfx/ambience", 0, bath, 0.3);
  sample("last-light/part01/sfx/horde", 0, 0.75, { from: "onset", dur: bath, fadeIn: 0.3, fadeOut: 0.4 });
  crackle(at(20), at(beats.shatter) - 0.05, 0.22);
  sample("glass", at(beats.shatter) - 0.03, 1.0, { from: "onset", dur: 2.5, fadeOut: 0.6 });
  boom(at(beats.shatter), 0.6);
  sample("intruders", at(beats.climbIn[0]), 0.7, { from: "onset", dur: bath - at(beats.climbIn[0]), fadeOut: 0.3 });
  thud(at(beats.climbIn[1]) - 0.1, 0.6, 50);
  for (let s = 238; s < 300; s += 8) thud(at(s), 0.3, 70);
  doorBang(at(beats.slam), 0.5);

  // ---------- bathroom ----------
  sample("last-light/part01/sfx/horde", bath, 0.3, { from: "onset", dur: ext - bath, fadeIn: 0.2, fadeOut: 0.3 });
  blip(at(beats.lock), 2400, 1800, 0.012, 0.3, 0.3);
  blip(at(beats.lock) + 0.05, 1500, 1100, 0.015, 0.25, 0.3);
  beats.bathBangs.forEach((s, i) => {
    doorBang(at(s), 0.6 + i * 0.1);
    if (i >= 2) shatter(at(s) + 0.02, 0.15);
  });
  thud(at(452), 0.4, 70);
  for (let s = beats.sash[0]; s < 512; s += 7) scrape(at(s), at(s + 4), 0.25);
  scrape(at(512), at(beats.sash[1]), 0.6);
  thud(at(beats.sash[1]), 0.5, 120);
  whoosh(at(beats.squeeze[0]), at(beats.squeeze[1]) - at(beats.squeeze[0]), 900, 300, 0.15);
  doorBang(at(beats.doorBurst), 0.9);
  shatter(at(beats.doorBurst) + 0.03, 0.3);
  sample("intruders", at(beats.doorBurst), 0.9, { from: "onset", dur: ext - at(beats.doorBurst), fadeOut: 0.2 });

  // ---------- fire escape ----------
  loop("alley", ext, N / SR, 0.45);
  sample("intruders", ext + 0.6, 0.35, { from: "onset", dur: 4, fadeIn: 0.3, fadeOut: 1 });
  for (let s = beats.emerge[1]; s < 656; s += 9) clang(at(s), 0.35);
  for (let s = 656; s < 706; s += 6) clang(at(s), 0.45);
  for (let s = 716; s < 756; s += 6) clang(at(s), 0.45);
  for (let s = beats.ladder[0]; s < beats.ladder[1]; s += 5) clang(at(s), 0.22 + 0.1 * Math.abs(noise()));
  clang(at(beats.climbOver[0] + 10), 0.4);
  whoosh(at(beats.drop[0]), at(beats.drop[1]) - at(beats.drop[0]) + 0.2, 600, 2500, 0.35);
  boom(at(beats.drop[1]), 0.7);
  thud(at(beats.drop[1]), 0.9, 45);
  for (let s = beats.roll[1]; s < beats.hide[1]; s += 7) thud(at(s), 0.15, 90);

  // ---------- the alley ----------
  buzz(alley, N / SR, 0.02);
  for (let s = beats.sneak[0]; s < beats.sneak[1]; s += 14) if (s < 1028 || s > 1064) thud(at(s), 0.06, 110);
  sample("last-light/part01/sfx/growl", at(beats.walker[0]) + 0.4, 0.25, { from: "onset", dur: 2, fadeOut: 0.8 });
  sample("creak", at(beats.carDoor[0]), 0.8, { from: "onset", dur: at(beats.carDoor[1]) - at(beats.carDoor[0]) + 0.6, fadeOut: 0.4 });
  boom(at(beats.eyes[0]), 0.5);
  boom(at(beats.card), 0.75);

  // Effects are levelled on the bathroom bangs
  return { stem: out, levelSpan: [at(beats.bathBangs[0]), at(beats.doorBurst)], levelDb: -21 };
}
