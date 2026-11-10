// Sound design for FLOOR 0 — Part 9 "Let Go".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, blip, heartbeat, chime } = fx;
  const { sample, thud, scrape, clang, staticBurst } = makeKit(ctx, fx);
  const at = storySec;
  const P8 = "floor-0/part08/sfx/";
  const freeze = at(beats.freeze);

  // ---------- he rips the shears out of her hand ----------
  boom(0, 1);
  whoosh(0, 0.4, 600, 3000, 0.4);
  sample(`${P8}snip`, at(12), 0.8, { from: "onset", dur: 0.9, fadeOut: 0.3 });
  clang(at(14), 0.3);
  chime(at(48), 1245, 0.2);
  boom(at(40), 0.5);

  // ---------- she steps back; every cable starts to shake ----------
  for (let s = beats.back[0]; s < beats.back[1]; s += 18) thud(at(s), 0.15, 90);
  sample("thrash", at(beats.shake[0]) - 0.2, 0.9, { from: "onset", dur: at(beats.why + 40) - at(beats.shake[0]), fadeOut: 1.2 });
  boom(at(beats.shake[1]), 0.8);

  // ---------- ear to the cable: down below, a Theo pounding ----------
  staticBurst(at(beats.lean[1]), 0.3, 0.06);
  beats.bangs.forEach((s) => sample("bang", at(s) - 0.05, 0.75, { from: "onset", dur: 0.6, fadeOut: 0.2 }));
  for (let s = beats.below[0]; s < beats.below[1]; s += 22) heartbeat(at(s), 0.25);

  // ---------- why would anyone beg to fall; she speaks ----------
  boom(at(beats.why), 0.5);
  chime(at(beats.girl[0]), 1568, 0.16);
  chime(at(beats.girl[0]) + 1.2, 1397, 0.14);
  for (let s = beats.girl[0]; s < beats.girl[1]; s += 26) heartbeat(at(s), 0.2);

  // ---------- the only way down ----------
  whoosh(at(beats.fall[0]), at(beats.door) - at(beats.fall[0]), 120, 1400, 0.55);
  scrape(at(beats.fall[0]), at(beats.door) - 0.2, 0.1);
  boom(at(beats.door), 1);
  thud(at(beats.door), 0.9, 40);
  chime(at(beats.door) + 0.4, 2093, 0.2);
  chime(at(beats.door) + 0.9, 1568, 0.16);

  // ---------- shears open on his own cable ----------
  sample(`${P8}snip`, at(beats.choice), 0.5, { from: "onset", dur: 0.9, fadeOut: 0.3 });
  for (let s = beats.choice; s < beats.freeze; s += 12) heartbeat(at(s), 0.3 + (s - beats.choice) / 300);
  for (let s = beats.choice; s < beats.freeze; s += 30) blip(at(s), 1800, 1800, 0.02, 0.14);
  sample("thrash", at(beats.wide), 0.5, { from: "onset", dur: freeze - at(beats.wide), fadeOut: 0.3 });

  // ---------- the freeze ----------
  whoosh(freeze - 0.35, 0.4, 400, 3200, 0.4);
  boom(freeze, 0.9);
  blip(at(beats.cards), 600, 900, 0.08, 0.25);
  blip(at(beats.cards) + 0.2, 900, 1300, 0.08, 0.25);
  boom(at(beats.card), 0.45);

  return { stem: out, levelSpan: [0, freeze], levelDb: -20 };
}
