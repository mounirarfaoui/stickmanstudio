// Sound design for FLOOR 0 — Part 4 "Floor Ninety-Nine".
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

  // ---------- the hook: an alarm, a fight, a hit on every cut ----------
  boom(0, 1);
  for (let t = 0; t < at(110); t += 0.5) blip(t, 880, 620, 0.32, 0.24);
  for (let s = 4; s < 80; s += 7) thud(at(s), 0.2, 120);
  for (const s of [...beats.slam, 80]) {
    boom(at(s), 0.75);
    thud(at(s), 0.5, 60);
  }

  // ---------- the button, the ride, the doors he shut ----------
  thud(at(beats.press), 0.5, 220);
  blip(at(beats.press), 1400, 1000, 0.04, 0.3);
  sample(`${P2}lift`, at(beats.press + 8), 0.5, { from: "onset", dur: at(beats.ding) - at(beats.press + 8), fadeOut: 0.4 });
  sample(`${P1}doors`, at(312), 0.7, { from: "onset", dur: 1.6, fadeOut: 0.3 });
  boom(at(beats.shut), 0.9);
  chime(at(beats.ding) + 0.1, 1318.5, 0.5);
  chime(at(beats.ding) + 0.38, 1046.5, 0.45);
  sample(`${P1}doors`, at(beats.open[0]), 0.7, { from: "onset", dur: 2.5, fadeOut: 0.5 });

  // ---------- Floor 99 ----------
  loop("screens", at(beats.open[0]), freeze, 0.42);
  boom(at(beats.reveal), 0.85);
  whoosh(at(beats.reveal) - 0.3, 0.5, 400, 2600, 0.3);
  staticBurst(at(636), 0.3, 0.12);
  scrape(at(beats.chair), at(beats.chair + 50), 0.03);
  boom(at(beats.button), 0.7);
  for (let s = beats.lunge; s < beats.choice; s += 13) thud(at(s), 0.15, 100);
  staticBurst(at(992), 0.3, 0.12);
  boom(at(beats.alarm), 0.85);
  for (let t = at(beats.alarm); t < freeze; t += 0.8) blip(t, 880, 620, 0.32, 0.14);
  for (let s = beats.alarm; s < beats.freeze; s += 15) heartbeat(at(s), 0.3 + (s - beats.alarm) / 500);

  // ---------- the freeze ----------
  whoosh(freeze - 0.35, 0.4, 400, 3200, 0.4);
  boom(freeze, 0.9);
  blip(at(beats.cards), 600, 900, 0.08, 0.25);
  blip(at(beats.cards) + 0.2, 900, 1300, 0.08, 0.25);
  boom(at(beats.card), 0.45);

  return { stem: out, levelSpan: [0, freeze], levelDb: -20 };
}
