// Sound design for FLOOR 0 — Part 3 "The Other Theo".
import { makeKit } from "./last-light-kit.mjs";

export default function sfx(ctx) {
  const { storySec, stem, effects, beats } = ctx;
  const out = stem();
  const fx = effects(out);
  const { boom, whoosh, blip, heartbeat, chime } = fx;
  const { sample, thud, loop, scrape, staticBurst } = makeKit(ctx, fx);
  const at = storySec;
  const P1 = "floor-0/part01/sfx/";
  const P2 = "floor-0/part02/sfx/";
  const freeze = at(beats.freeze);

  // ---------- what B would have done: the flatline ----------
  loop(`${P2}ward`, 0, at(beats.close[0]), 0.3);
  for (let t = 0; t < at(beats.flat); t += 0.5) blip(t, 1050, 1050, 0.08, 0.14, 0.2);
  thud(at(beats.pull), 0.5, 160);
  blip(at(beats.flat), 1050, 1050, at(beats.flashEnd) - at(beats.flat), 0.28, 0.2);
  boom(at(beats.fallDown[1]), 0.9);
  boom(at(beats.flashEnd), 0.8);

  // ---------- waking him ----------
  for (let s = 95; s < beats.eyesOpen; s += 12) blip(at(s), 1200, 1200, 0.06, 0.16, 0.2);
  for (let s = beats.shake; s < beats.eyesOpen; s += 7) thud(at(s), 0.12, 130);
  boom(at(beats.eyesOpen), 0.85);
  for (let s = beats.eyesOpen; s < beats.walk; s += 40) blip(at(s), 1050, 1050, 0.08, 0.12, 0.2);
  scrape(at(beats.sitUp[0]), at(beats.sitUp[1]), 0.05);
  scrape(at(beats.tally[0] + 6), at(beats.tally[0] + 36), 0.07);

  // ---------- they walk ----------
  sample(`${P2}sheets`, at(beats.walk) - 0.1, 0.8, { from: "onset", dur: 4, fadeOut: 0.5 });
  boom(at(beats.walk), 0.7);
  for (let s = beats.drag[0]; s < beats.drag[1]; s += 8) thud(at(s), 0.16, 110);
  scrape(at(beats.drag[0]), at(beats.drag[1]), 0.1);
  for (let s = beats.drag[0]; s < beats.close[1]; s += 12) heartbeat(at(s), 0.35);
  for (let s = beats.resume; s < beats.close[1]; s += 30) blip(at(s), 1800, 1800, 0.02, 0.14);
  sample(`${P1}doors`, at(beats.close[0]) - 0.1, 0.8, { from: "onset", dur: 1.2, fadeOut: 0.3 });
  boom(at(beats.close[1]), 1);
  thud(at(beats.close[1]), 0.7, 50);

  // ---------- the bulb ----------
  scrape(at(beats.bulbOn - 18), at(beats.bulbOn), 0.05);
  chime(at(beats.bulbOn), 1760, 0.3);
  chime(at(beats.bulbOn) + 0.1, 2349, 0.25);
  sample(`${P2}lift`, at(beats.panel99), 0.2, { from: "onset", dur: 2.5, fadeOut: 0.8 });
  thud(at(beats.panel99 + 15), 0.2, 220);

  // ---------- the Operator ----------
  staticBurst(at(beats.op), 0.3, 0.12);
  boom(at(beats.turn), 0.5);
  for (let s = beats.turn; s < beats.freeze; s += 18) heartbeat(at(s), 0.3 + (s - beats.turn) / 500);

  // ---------- the freeze ----------
  whoosh(freeze - 0.35, 0.4, 400, 3200, 0.4);
  boom(freeze, 0.9);
  blip(at(beats.cards), 600, 900, 0.08, 0.25);
  blip(at(beats.cards) + 0.2, 900, 1300, 0.08, 0.25);
  boom(at(beats.card), 0.55);
  chime(at(beats.card) + 0.1, 1318.5, 0.3);

  return { stem: out, levelSpan: [0, freeze], levelDb: -21 };
}
