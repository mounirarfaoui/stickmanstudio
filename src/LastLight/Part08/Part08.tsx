import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { GAITS, lerpPose, Pose, POSES, skeleton, StickFigure, walkPose } from "../../shared/rig";
import { cameraTransform, clamp01, handheld, impulse, makeWarp, Shot, shotCamera, track } from "../kit";
import { Captions, PartCard, SeriesBadge, SPEAKERS } from "../Overlays";
import { Darkness, Light } from "../pharmacy";
import { RoadDefs } from "../road";
import { Dog } from "../sets";
import { Defs, rand, Zombie } from "../world";
import {
  Ash,
  Backpack,
  Bat,
  BOOTH,
  BoothInside,
  Bridge,
  BRIDGE,
  BridgeDefs,
  Bus,
  busRoofY,
  face,
  FarLane,
  GraspHand,
  Leash,
  Lighter,
  moving,
  P78,
  TOLL,
  TollPlaza,
  worldOf,
  WreckCar,
} from "../bridge";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toStory, toOut } = makeWarp(timeline);
const EMPH = timeline.captions.flatMap((c) => c.words.filter((w) => w.emph).map((w) => w.frame));

const D = BRIDGE.deck;
const BUS_X = 7930;
const roof = (x: number) => busRoofY(BUS_X, x);
const speedOf = (s: number, f: number[], v: number[]) => Math.abs(track(s + 1, f, v) - track(s - 1, f, v)) / 2;

const P8 = {
  ...P78,
  haul: { lean: -30, tilt: -12, duck: 0.4, chest: 1, lUA: 44, lFA: 30, rUA: 52, rFA: 40, lTh: 70, lSh: -40, rTh: 10, rSh: -20 },
  roll: { ...P78.sit, lean: 34, tilt: 24, lUA: 70, lFA: 100, rUA: 84, rFA: 120 },
  write: { ...P78.sit, lean: 14, tilt: 26, lUA: 60, lFA: 100, rUA: 66, rFA: 116 },
  sleep: { ...P78.sit, lean: -6, tilt: 36, duck: 0.6, lUA: 40, lFA: 150, rUA: 50, rFA: 160 },
  hug: { ...POSES.stand, lean: 10, tilt: 8, duck: 0.2, lUA: 82, lFA: 150, rUA: 88, rFA: 160 },
  kneel: { lean: 12, tilt: -10, duck: 0.3, chest: 1, lUA: 70, lFA: 110, rUA: 76, rFA: 120, lTh: 0, lSh: -90, rTh: 16, rSh: -84 },
  kneelHug: { lean: 18, tilt: 14, duck: 0.4, chest: 1, lUA: 84, lFA: 150, rUA: 90, rFA: 160, lTh: 0, lSh: -90, rTh: 16, rSh: -84 },
  cough: { ...POSES.stand, lean: 30, tilt: 22, duck: 0.5, lUA: 40, lFA: 172, rUA: 10, rFA: 20 },
  palm: { ...POSES.stand, lean: 14, tilt: 34, duck: 0.3, lUA: 40, lFA: 120, rUA: 10, rFA: 20 },
  wipe: { ...POSES.stand, lean: 4, tilt: 4, lUA: 6, lFA: -16, rUA: 10, rFA: 20 },
  crawl: { lean: 40, tilt: -6, duck: 0.4, chest: 1, lUA: 60, lFA: 40, rUA: 80, rFA: 70, lTh: 80, lSh: -40, rTh: 92, rSh: -30 },
} satisfies Record<string, Pose>;

// ================= Scene 1: hanging off the bus =================
const GAP: [number, number] = [7566, 7900];
const BusEdge: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const t = 0.88;
  // Mia, on the roof, hauls on his wrist; she leans back harder as the line goes on
  const mxA = 8070;
  const miaY = roof(mxA);
  const effort = Math.sin(frame * 0.8) * 4;
  const miaHaul: Pose = { ...P8.haul, lean: P8.haul.lean - track(s, [0, 160], [0, 14]) + effort, tilt: P8.haul.tilt + effort };
  const hand = worldOf(miaHaul, "rHand", mxA, miaY, 0.92, true);
  // Kai: hung from her hand, kicking at the dead below
  const kicks = s > 50 && s < 120 ? Math.sin(frame * 1.1) * 36 : Math.sin(frame * 0.6) * 12;
  let kaiPose: Pose = { ...P78.hang, lTh: P78.hang.lTh + kicks, lSh: P78.hang.lSh - Math.abs(kicks) * 0.8, rTh: P78.hang.rTh - kicks * 0.5, tilt: -24 };
  const rh = skeleton(kaiPose).rHand;
  let kx = hand.x - rh.x;
  let ky = hand.y - rh.y + track(s, [0, 160], [40, 0]) + impulse(frame, [toOut(beats.kicked), toOut(beats.tore)], 4) * 10;
  // ...until the cloth tears and she drags him onto the roof
  const up = clamp01((s - beats.up[0]) / (beats.up[1] - beats.up[0]));
  let miaPose: Pose = miaHaul;
  let miaFlip = true;
  if (s >= beats.up[0]) {
    const tx = 8000;
    const ty = roof(tx);
    kx = kx + (tx - kx) * up;
    ky = ky + (ty - ky) * up - Math.sin(Math.PI * up) * 60;
    kaiPose = lerpPose(kaiPose, P78.crouch, up);
    miaPose = lerpPose(miaHaul, P78.crouch, up);
  }
  // running for the end of the bridge
  const KX = { f: [200, 240, 254, 330], v: [8000, 9120, 9300, 10900] };
  let mx = mxA;
  let my = miaY;
  if (s >= beats.run) {
    const x = track(s, KX.f, KX.v);
    const v = speedOf(s, KX.f, KX.v);
    kx = x;
    const hop = clamp01((s - beats.hopDown[0]) / (beats.hopDown[1] - beats.hopDown[0]));
    ky = x < 9150 ? roof(Math.min(x, 9150)) : roof(9150) + (D - roof(9150)) * hop - Math.sin(Math.PI * hop) * 60;
    kaiPose = hop > 0 && hop < 1 ? P78.leap : moving(POSES.stand, x, v, false);
    mx = x + 140;
    const hopM = clamp01((s - beats.hopDown[0] + 6) / (beats.hopDown[1] - beats.hopDown[0]));
    my = mx < 9150 ? roof(Math.min(mx, 9150)) : roof(9150) + (D - roof(9150)) * hopM - Math.sin(Math.PI * hopM) * 60;
    miaPose = hopM > 0 && hopM < 1 ? P78.leap : moving(P78.batDown, mx, v, false);
    miaFlip = false;
  }
  const kai = <StickFigure pose={kaiPose} x={kx} y={ky} scale={1} frame={frame} face={face(1, s < 200 ? 0.8 : 0.5, 0.9)} />;
  const ankle = worldOf(kaiPose, "lFoot", kx, ky, 1, false);
  // the hand: clamped on his ankle, then ripped away with a strip of his jeans
  const fall = clamp01((s - beats.tore) / 22);
  const handX = s < beats.tore ? ankle.x - 4 : ankle.x - 4 - fall * 40;
  const handY = s < beats.tore ? ankle.y + 8 : ankle.y + 8 + fall * fall * 380;
  const foot0 = worldOf(P78.hang, "lFoot", hand.x - skeleton(P78.hang).rHand.x, hand.y - skeleton(P78.hang).rHand.y, 1, false);
  const SHOTS: Shot[] = [
    { from: 0, to: 55, keys: [[0, hand.x - 40, hand.y - 110, 1.55], [55, hand.x - 40, hand.y - 110, 1.72]] },
    { from: 55, to: 110, keys: [[55, foot0.x - 20, foot0.y - 160, 1.7], [110, foot0.x - 20, foot0.y - 160, 1.95]] },
    { from: 110, to: 164, keys: [[110, 7960, 1180, 0.95], [164, 7960, 1170, 1.08]] },
    { from: 164, to: 182, keys: [[164, foot0.x - 30, foot0.y - 80, 2.2], [182, foot0.x - 30, foot0.y - 40, 2.0]] },
    { from: 182, to: 200, keys: [[182, 8030, roof(8030) - 180, 1.3], [200, 8030, roof(8030) - 180, 1.4]] },
    { from: 200, to: 254, keys: [[200, 8250, 1060, 0.85], [254, 9450, 1080, 0.85]] },
    { from: 254, to: 285, keys: [[254, 9500, 1260, 1.0], [285, 10200, 1260, 1.0]] },
    { from: 285, to: 400, keys: [[285, 10450, 1180, 0.55], [330, 10650, 1180, 0.6]] },
  ];
  const cam = shotCamera(s, SHOTS);
  const kick = impulse(frame, [toOut(beats.tore), toOut(beats.up[1])], 4) * 18;
  const run = s > beats.run ? Math.abs(Math.sin(frame * 0.6)) * 6 : 0;
  return (
    <g>
      <g transform={cameraTransform(cam, handheld(frame, 3.6, { x: kick * Math.sin(frame * 3), y: kick * 0.5 + run }))}>
        <Bridge frame={frame} t={t} cx={cam.fx}>
          <FarLane from={6200} to={9600} />
          <WreckCar x={7000} color="#5a6670" seed={14} />
          <WreckCar x={6280} color="#4a3a4a" seed={13} />
          <Bus x={BUS_X} frame={frame} />
          {/* the dead packed into the gap, and more spilling after them */}
          {Array.from({ length: 6 }, (_, i) => {
            const x = GAP[0] + (i + 0.5) * ((GAP[1] - GAP[0]) / 6) + Math.sin(frame * 0.07 + i) * 10;
            const w = 0.8;
            const pose: Pose = { ...POSES.stand, tilt: -14 + Math.sin(frame * 0.3 + i) * 6, lUA: -160 * w + Math.sin(frame * 0.5 + i) * 18, lFA: -170 * w, rUA: 160 * w + Math.sin(frame * 0.45 + i) * 18, rFA: 170 * w };
            return <Zombie key={i} x={x} y={D + 6 + (i % 2) * 8} scale={0.95 + rand(i + 6000) * 0.1} pose={pose} frame={frame} glow={1} flip={i % 2 === 0} />;
          })}
          {s > 200
            ? Array.from({ length: 5 }, (_, i) => {
                const x = 8600 + i * 140 + (s - 200) * 2.2;
                return <Zombie key={i} x={x} y={D + 4} scale={1} pose={walkPose(frame / 24 + i * 0.3, GAITS.shamble, { ...POSES.stand, lUA: 82, lFA: 92, rUA: 88, rFA: 98 })} frame={frame} glow={1} />;
              })
            : null}
          <StickFigure
            pose={miaPose}
            x={mx}
            y={my}
            scale={0.92}
            frame={frame}
            flip={miaFlip}
            hair="ponytail"
            face={face(1, s < 170 ? 0.8 : 0.4, 0.6)}
            prop={(sk) => (s >= beats.run ? <Bat sk={sk} angle={40} /> : null)}
          />
          {kai}
          {s < beats.tore + 24 ? (
            <g>
              <GraspHand x={handX} y={handY} scale={0.5} close={1} angle={55 + fall * 30} arm={380} frame={frame} />
              {s >= beats.tore ? <polygon points={`${handX - 14},${handY - 40} ${handX + 20},${handY - 52} ${handX + 26},${handY - 20} ${handX - 8},${handY - 10}`} fill="#2a3a5a" /> : null}
            </g>
          ) : null}
        </Bridge>
      </g>
      <Ash frame={frame} color="#c9b0a0" n={26} />
    </g>
  );
};

// ================= Scene 2: the toll plaza at night =================
const PlazaNight: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const g = TOLL.ground;
  const KX = { f: [330, 366], v: [-150, 1520] };
  const MX = { f: [330, 362], v: [60, 1540] };
  const kx = track(s, KX.f, KX.v);
  const mx = track(s, MX.f, MX.v);
  const door = track(s, [352, 360, 376, 380], [0, 1, 1, 0.3]);
  const fadeK = 1 - clamp01((s - 366) / 8);
  const fadeM = 1 - clamp01((s - 360) / 8);
  const cam = shotCamera(s, [{ from: 0, to: 1000, keys: [[330, 650, 1150, 0.7], [380, 1150, 1170, 0.82]] }]);
  return (
    <g transform={cameraTransform(cam, handheld(frame, 3.4, { x: 0, y: Math.abs(Math.sin(frame * 0.6)) * 5 }))}>
      <TollPlaza frame={frame} dawn={0.12} door={door} glow={0}>
        <g opacity={fadeM}>
          <StickFigure pose={moving(P78.batDown, mx, speedOf(s, MX.f, MX.v), false)} x={mx} y={g} scale={0.92} frame={frame} hair="ponytail" face={face(1, 0.6)} prop={(sk) => <Bat sk={sk} angle={40} />} />
        </g>
        <g opacity={fadeK}>
          <StickFigure pose={moving(POSES.stand, kx, speedOf(s, KX.f, KX.v), false)} x={kx} y={g} scale={1} frame={frame} face={face(1, 0.6, 0.8)} />
        </g>
      </TollPlaza>
    </g>
  );
};

// ================= Scene 3: inside the booth, night to dawn =================
const KAI_SIT = 300;
const MIA_SPOT = 790;
const PACK_X = 640;
const Booth: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const f = BOOTH.floor;
  const dawn = clamp01((s - beats.dawn[0]) / (beats.dawn[1] - beats.dawn[0]));
  const lit = s >= beats.lighter && s < beats.lighterOut ? 1 : 0;
  const flick = 0.85 + Math.sin(frame * 1.7) * 0.06 + Math.sin(frame * 3.3) * 0.04;
  // ---------- Kai ----------
  let kx = KAI_SIT;
  let kaiPose: Pose = P8.roll;
  let kaiFlip = false;
  if (s >= 440 && s < beats.night) kaiPose = lerpPose(P8.roll, { ...P78.sit, tilt: -6 }, clamp01((s - 440) / 12));
  if (s >= beats.night && s < beats.fold[1]) kaiPose = { ...P8.write, rFA: P8.write.rFA + Math.sin(frame * 1.4) * 8 };
  if (s >= beats.fold[1] && s < 880) {
    kx = track(s, [822, 835, 858, 875], [KAI_SIT, PACK_X - 110, PACK_X - 110, KAI_SIT]);
    kaiPose = s > 835 && s < 858 ? lerpPose(P8.crawl, { ...P8.crawl, rUA: 100, rFA: 80 }, Math.abs(Math.sin((s - 835) * 0.15))) : lerpPose(P8.crawl, walkPose(kx / 120, GAITS.walk, P8.crawl), 0.6);
    kaiFlip = s > 858;
  }
  if (s >= 880 && s < 990) kaiPose = { ...P78.sit, tilt: -4 + Math.sin(frame * 0.05) * 3 };
  if (s >= 990) kaiPose = { ...P78.sit, tilt: -10, lUA: 40, lFA: 70 };
  if (s >= beats.hug[0]) kaiPose = lerpPose(kaiPose, { ...P78.sit, tilt: 4, lUA: 80, lFA: 150, rUA: 86, rFA: 160 }, clamp01((s - beats.hug[0]) / 10));
  const kaiY = f;
  // ---------- Mia ----------
  let mx = MIA_SPOT;
  let miaPose: Pose = { ...P78.slump, tilt: 10 };
  let bat = 8;
  let miaFlip = true;
  const shake = Math.sin(frame * 1.6) * 5 + Math.sin(frame * 2.7) * 3;
  if (s >= beats.batUp[0]) {
    miaPose = lerpPose(P78.slump, { ...P78.batReady, tilt: P78.batReady.tilt + shake * 0.6, lUA: P78.batReady.lUA + shake, rUA: P78.batReady.rUA + shake }, clamp01((s - beats.batUp[0]) / 20));
    bat = track(s, beats.batUp, [8, -150]) + shake * 2;
  }
  if (s >= beats.batDown[0]) {
    const d = clamp01((s - beats.batDown[0]) / 20);
    miaPose = lerpPose(miaPose, P78.slump, d);
    bat = -150 + d * 158;
  }
  if (s >= 690) {
    miaPose = lerpPose(P78.slump, P8.sleep, clamp01((s - 690) / 20));
    bat = 8 + clamp01((s - 690) / 20) * 165;
  }
  if (s >= beats.wake) {
    const w = clamp01((s - beats.wake) / 12);
    mx = track(s, [beats.wake + 12, beats.hug[0]], [MIA_SPOT, KAI_SIT + 100]);
    miaPose = w < 1 ? lerpPose(P8.sleep, POSES.stand, w) : moving(POSES.stand, -mx, speedOf(s, [beats.wake + 12, beats.hug[0]], [MIA_SPOT, KAI_SIT + 100]), true);
    bat = 8;
  }
  if (s >= beats.hug[0]) {
    miaPose = lerpPose(POSES.stand, P8.kneelHug, clamp01((s - beats.hug[0]) / 8));
    if (s > beats.bark + 4) miaPose = { ...miaPose, tilt: miaPose.tilt - 24 * clamp01((s - beats.bark - 4) / 8) };
  }
  // ---------- lights ----------
  const lighterAt = s < beats.night ? worldOf(kaiPose, "lHand", kx, kaiY, 1, kaiFlip) : { x: KAI_SIT + 120, y: f - 34 };
  const w = BOOTH.window;
  const lights: Light[] = [
    { kind: "glow", x: w.x + w.w / 2, y: w.y + w.h / 2, r: 260 + dawn * 700, power: 0.35 + 0.6 * dawn },
    { kind: "glow", x: 540, y: 1300, r: 900 * dawn, power: 0.75 * dawn },
  ];
  if (lit) lights.push({ kind: "glow", x: lighterAt.x, y: lighterAt.y - 30, r: 420 * flick, power: 0.9 });
  if (lit && s >= 470) lights.push({ kind: "glow", x: MIA_SPOT - 20, y: f - (s < 690 ? 200 : 110), r: 300 * flick, power: 0.6 });
  // ---------- camera ----------
  const kHead = worldOf(kaiPose, "head", kx, kaiY, 1, kaiFlip);
  const mHead = worldOf(miaPose, "head", mx, f, 0.92, miaFlip);
  const headK = (pose: Pose, x: number) => worldOf(pose, "head", x, f, 1, false);
  const hk = headK(P78.sit, KAI_SIT);
  const hm = worldOf(P78.batReady, "head", MIA_SPOT, f, 0.92, true);
  const SHOTS: Shot[] = [
    { from: 0, to: 480, keys: [[440, hk.x + 20, hk.y + 30, 3.0], [480, hk.x + 20, hk.y + 30, 3.4]] },
    { from: 480, to: 520, keys: [[480, 560, 1320, 1.15], [520, 560, 1320, 1.3]] },
    { from: 520, to: 565, keys: [[520, hk.x + 20, hk.y + 30, 3.0], [565, hk.x + 20, hk.y + 30, 3.4]] },
    { from: 565, to: 630, keys: [[565, hm.x - 30, hm.y + 60, 2.4], [630, hm.x - 30, hm.y + 60, 2.8]] },
    { from: 630, to: 655, keys: [[630, hm.x - 20, hm.y + 40, 3.0], [655, hm.x - 20, hm.y + 40, 3.3]] },
    { from: 655, to: beats.night, keys: [[655, 560, 1330, 1.1], [beats.night, 560, 1330, 1.22]] },
    { from: beats.night, to: 810, keys: [[beats.night, 540, 1320, 0.98], [810, 540, 1320, 1.1]] },
    { from: 810, to: 862, keys: [[810, PACK_X - 60, 1400, 1.5], [862, PACK_X - 60, 1400, 1.7]] },
    { from: 862, to: 905, keys: [[862, w.x + w.w / 2, w.y + w.h / 2 + 60, 1.4], [905, w.x + w.w / 2, w.y + w.h / 2 + 60, 1.85]] },
    { from: 905, to: beats.eyes, keys: [[905, 540, 1280, 0.95], [beats.eyes, 540, 1290, 1.08]] },
    { from: beats.eyes, to: beats.hug[0], keys: [[beats.eyes, hk.x + 4, hk.y - 2, 6.5], [beats.hug[0], hk.x + 4, hk.y - 2, 7.6]] },
    { from: beats.hug[0], to: 2000, keys: [[beats.hug[0], KAI_SIT + 70, 1380, 1.7], [1095, KAI_SIT + 70, 1380, 1.95]] },
  ];
  const cam = shotCamera(s, SHOTS);
  void kHead;
  void mHead;
  const kick = impulse(frame, [toOut(beats.lighter), toOut(beats.hug[0]), toOut(beats.bark)], 4) * 10;
  const holdingNote = s >= beats.night && s < beats.slip[1];
  return (
    <g transform={cameraTransform(cam, handheld(frame, 2.6, { x: kick * Math.sin(frame * 3), y: kick * 0.5 }))}>
      <BoothInside frame={frame} dawn={dawn}>
        <Backpack x={PACK_X} y={f} open={s > beats.slip[0] && s < beats.slip[1] ? 1 : 0} />
        {s >= beats.night && s < beats.lighterOut ? <Lighter x={KAI_SIT + 120} y={f - 34} on={1} frame={frame} /> : null}
        <StickFigure
          pose={miaPose}
          x={mx}
          y={f}
          scale={0.92}
          frame={frame}
          flip={miaFlip}
          hair="ponytail"
          face={face(s >= 690 && s < beats.wake ? 0 : 1, s >= 630 && s < 650 ? 0.5 : 0, 0, s >= beats.hug[0] ? 0.6 : 0)}
          prop={(sk) => <Bat sk={sk} angle={bat} />}
        />
        <StickFigure
          pose={kaiPose}
          x={kx}
          y={kaiY}
          scale={1}
          frame={frame}
          flip={kaiFlip}
          face={face(s < beats.eyes ? 0.9 : 0.3, s >= 520 && s < 600 ? 0.3 : 0, s < 700 ? 0.5 : 0, s >= 1000 ? 0.8 : 0)}
          prop={(sk) => (
            <g>
              {s >= beats.lighter && s < beats.night ? <Lighter x={sk.lHand.x} y={sk.lHand.y - 10} on={1} frame={frame} scale={1} /> : null}
              {holdingNote ? <rect x={sk.rHand.x - (s < beats.fold[1] ? 34 : 14)} y={sk.rHand.y - 14} width={s < beats.fold[1] ? 68 : 28} height={s < beats.fold[1] ? 48 : 20} fill="#e9dfc4" transform={`rotate(-12 ${sk.rHand.x} ${sk.rHand.y})`} /> : null}
            </g>
          )}
        />
        {s >= beats.night && s < 1000 ? (
          <g opacity={0.6 + 0.4 * Math.sin(frame * 0.1)}>
            <text x={MIA_SPOT - 40} y={f - 260 - ((frame * 0.8) % 40)} fontFamily="Arial, sans-serif" fontWeight={700} fontSize={34} fill="#9aa3b5" opacity={s < beats.dawn[1] ? 0.7 : 0}>
              z
            </text>
          </g>
        ) : null}
      </BoothInside>
      <Darkness id="p8dark" lights={lights} dark={s < beats.lighter ? 0.97 : 0.93 - 0.4 * dawn} />
    </g>
  );
};

// ================= Scene 4: dawn outside — Biscuit =================
const PlazaDawn: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const g = TOLL.ground;
  const DX = { f: [beats.outside, beats.leap[0]], v: [3050, 1890] };
  const leap = clamp01((s - beats.leap[0]) / (beats.leap[1] - beats.leap[0]));
  const MX = { f: [1100, 1150], v: [1540, 1760] };
  const mx = s < 1100 ? 1540 : track(s, MX.f, MX.v);
  const kxs = { f: [1115, 1150, beats.turn, 1262], v: [1540, 1620, 1620, 1540] };
  const kx = s < 1115 ? 1540 : track(s, kxs.f, kxs.v);
  const out = clamp01((s - 1100) / 6);
  const outK = clamp01((s - 1115) / 6);
  // Biscuit runs in, the cut leash flapping, and leaps at her
  let dx = track(s, DX.f, DX.v);
  let dy = g;
  if (s >= beats.leap[0]) {
    dx = 1890 + (mx + 70 - 1890) * leap;
    dy = g - Math.sin(Math.PI * leap) * 140 - leap * 70;
  }
  const dogRun = s < beats.leap[0];
  // Mia: runs out, drops to her knees, catches him
  let miaPose: Pose = s < 1100 ? POSES.stand : moving(P78.batDown, mx, speedOf(s, MX.f, MX.v), false);
  if (s >= 1150) miaPose = lerpPose(POSES.stand, P8.kneel, clamp01((s - 1150) / 15));
  if (s >= beats.leap[1]) miaPose = { ...P8.kneelHug, lean: P8.kneelHug.lean + Math.sin(frame * 0.3) * 4 };
  let miaFlip = false;
  if (s >= beats.glance) miaPose = { ...miaPose, tilt: miaPose.tilt - 30 * clamp01((s - beats.glance) / 8) };
  if (s >= beats.glance + 6) miaFlip = true;
  // Kai: smiles, turns away, coughs, looks at his palm, wipes it
  let kaiPose: Pose = s < 1115 ? POSES.stand : moving(POSES.stand, kx, speedOf(s, kxs.f, kxs.v), s > beats.turn);
  let kaiFlip = s >= beats.turn;
  if (s >= 1262) {
    const c = clamp01((s - 1262) / 8);
    const jerk = impulse(frame, [toOut(beats.cough), toOut(beats.cough + 9), toOut(beats.cough + 17)], 3);
    kaiPose = lerpPose(POSES.stand, { ...P8.cough, lean: P8.cough.lean + jerk * 14, tilt: P8.cough.tilt + jerk * 10 }, c);
  }
  if (s >= 1296) kaiPose = lerpPose(kaiPose, P8.palm, clamp01((s - 1296) / 6));
  if (s >= beats.wipe[0]) kaiPose = lerpPose(P8.palm, { ...P8.wipe, lFA: P8.wipe.lFA + Math.sin((s - beats.wipe[0]) * 0.8) * 20 }, clamp01((s - beats.wipe[0]) / 6));
  if (s >= beats.glance + 4) {
    kaiFlip = false;
    kaiPose = { ...P8.wipe, tilt: 6 };
  }
  const kHead = worldOf(P8.cough, "head", 1540, g, 1, true);
  const SHOTS: Shot[] = [
    { from: 0, to: 1130, keys: [[beats.outside, 2250, 1240, 0.55], [1130, 2350, 1240, 0.6]] },
    { from: 1130, to: 1165, keys: [[1130, track(1130, DX.f, DX.v) - 60, g - 170, 2.0], [1165, track(1165, DX.f, DX.v) - 60, g - 170, 2.1]] },
    { from: 1165, to: beats.turn, keys: [[1165, 1800, 1340, 1.45], [beats.turn, 1790, 1330, 1.7]] },
    { from: beats.turn, to: 1300, keys: [[beats.turn, kHead.x - 20, kHead.y + 60, 2.3], [1300, kHead.x - 20, kHead.y + 60, 2.7]] },
    { from: 1300, to: 2000, keys: [[1300, 1660, 1320, 1.3], [1406, 1660, 1310, 1.5]] },
  ];
  const cam = shotCamera(s, SHOTS);
  const kick = impulse(frame, [toOut(beats.leap[1]), toOut(beats.cough)], 4) * 12;
  const neck = { x: dx + (dogRun ? -1 : 1) * 60 * 0.8, y: dy - 80 * 0.8 };
  return (
    <g transform={cameraTransform(cam, handheld(frame, 3.0, { x: kick * Math.sin(frame * 3), y: kick * 0.5 }))}>
      <TollPlaza frame={frame} dawn={1} door={s > 1095 && s < 1125 ? 1 : 0.4} glow={0}>
        <g opacity={outK}>
          <StickFigure pose={kaiPose} x={kx} y={g} scale={1} frame={frame} flip={kaiFlip} face={face(s > 1262 ? 0.8 : 0.2, s > 1262 && s < 1300 ? 0.6 : 0, 0, s < 1244 || s > beats.glance + 4 ? 0.8 : 0)} />
        </g>
        <g opacity={out}>
          <StickFigure
            pose={miaPose}
            x={mx}
            y={g}
            scale={0.92}
            frame={frame}
            flip={miaFlip}
            hair="ponytail"
            face={face(0.2, s > 1101 && s < 1190 ? 0.6 : 0, 0, s > 1150 ? 1 : 0.3)}
            prop={(sk) => (s < 1150 ? <Bat sk={sk} angle={20} /> : null)}
          />
        </g>
        {s >= beats.outside ? (
          <g>
            <Leash x={neck.x} y={neck.y} scale={0.5} angle={dogRun ? -64 + Math.sin(frame * 0.8) * 12 : 10} sway={Math.sin(frame * 0.5) * 6} />
            <Dog x={dx} y={dy} scale={0.8} bark={dogRun ? Math.abs(Math.sin(frame * 0.7)) * 0.7 : 0.2} walk={dogRun ? frame / 4 : s > beats.leap[1] ? frame / 10 : 0} flip={dogRun} />
          </g>
        ) : null}
        {s >= 1160 ? <line x1={mx - 190} y1={g - 10} x2={mx - 50} y2={g - 14} stroke="#b0844e" strokeWidth={16} strokeLinecap="round" /> : null}
      </TollPlaza>
    </g>
  );
};

// ================= Inserts (screen space) =================
// Kai's shin under the lighter: the rolled-up jeans and three red lines
const ScratchInsert: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const z = 1 + (s - 380) * 0.003;
  const flick = 0.85 + Math.sin(frame * 1.7) * 0.08;
  const roll = clamp01((s - 380) / 14);
  return (
    <g transform={`translate(540 960) scale(${z}) rotate(-8) translate(-540 -960)`}>
      <rect x={-200} y={-200} width={1500} height={2400} fill="#120c0a" />
      <circle cx={760} cy={600} r={900} fill="#ffb24a" opacity={0.22 * flick} filter="url(#soft)" />
      {/* the shin */}
      <path d="M 330 2100 L 420 500 Q 470 420 590 430 L 700 450 L 760 2100 Z" fill="#0b0b0d" />
      <path d="M 700 450 L 760 2100" stroke="#ffb24a" strokeWidth={10} opacity={0.35 * flick} />
      {/* the denim, rolling up */}
      <g transform={`translate(0 ${-roll * 260})`}>
        <path d="M 380 900 Q 560 850 740 900 L 760 960 Q 560 920 370 970 Z" fill="#2a3a5a" />
        <path d="M 360 960 Q 560 910 770 960 L 780 1020 Q 560 980 350 1030 Z" fill="#33476b" />
        <rect x={300} y={1020} width={540} height={1200} fill="#22304a" opacity={1 - roll} />
      </g>
      {/* three lines */}
      {[0, 1, 2].map((i) => {
        const show = clamp01((s - (381 + i * 5)) / 6);
        return (
          <g key={i} opacity={show}>
            <path d={`M ${430 + i * 22} ${780 + i * 70} q 90 30 ${240} ${-10 + i * 8}`} stroke="#d0302a" strokeWidth={14} fill="none" strokeLinecap="round" />
            <path d={`M ${430 + i * 22} ${780 + i * 70} q 90 30 ${240} ${-10 + i * 8}`} stroke="#ff6a4a" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.8} />
          </g>
        );
      })}
      <circle cx={560} cy={850} r={260} fill="#ff2a1e" opacity={0.06 + 0.04 * Math.sin(frame * 0.2)} filter="url(#soft)" />
    </g>
  );
};

// The back of the road map: "Mia —" and lines of handwriting, a pencil moving along them
const NoteInsert: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const p = clamp01((s - beats.write[0]) / (beats.write[1] - beats.write[0] - 4));
  const lines = 6;
  const cur = Math.min(lines - 1, Math.floor(p * lines));
  const within = p * lines - cur;
  const penX = 230 + within * 600;
  const penY = 760 + cur * 120;
  const z = 1 + (s - beats.write[0]) * 0.002;
  return (
    <g transform={`translate(540 960) scale(${z}) rotate(3) translate(-540 -960)`}>
      <rect x={-200} y={-200} width={1500} height={2400} fill="#140e0a" />
      <rect x={120} y={420} width={860} height={1180} fill="#e9dfc4" />
      {/* the map printed on the other side shows through */}
      <path d="M 880 1500 C 840 1380 930 1290 840 1180 S 700 1010 740 880 S 660 650 560 540" stroke="#c8352f" strokeWidth={8} fill="none" opacity={0.12} strokeDasharray="26 18" />
      <path d="M 120 1180 L 980 1300 M 860 420 L 700 1600" stroke="#d07a4a" strokeWidth={8} opacity={0.1} />
      <text x={210} y={650} fontFamily="'Segoe Print', 'Comic Sans MS', cursive" fontSize={72} fill="#2a2420">
        Mia —
      </text>
      {Array.from({ length: lines }, (_, i) => {
        const len = i < cur ? 1 : i === cur ? within : 0;
        if (len <= 0) return null;
        let d = `M 230 ${760 + i * 120}`;
        for (let k = 0; k < 30; k++) d += ` q 10 ${-30 + rand(i * 40 + k) * 20} 20 0`;
        return <path key={i} d={d} stroke="#2a2420" strokeWidth={6} fill="none" strokeDasharray={`${len * (i === lines - 1 ? 380 : 900)} 2000`} strokeLinecap="round" />;
      })}
      {/* the pencil in his hand */}
      <g transform={`translate(${penX} ${penY + Math.sin(frame * 2.2) * 6}) rotate(35)`}>
        <rect x={-10} y={-260} width={20} height={250} fill="#e0b040" />
        <polygon points="-10,-10 10,-10 0,14" fill="#2a2420" />
        <ellipse cx={20} cy={-160} rx={90} ry={60} fill="#0b0b0d" />
      </g>
      <circle cx={980} cy={1500} r={500} fill="#ffb24a" opacity={0.18 + Math.sin(frame * 1.7) * 0.03} filter="url(#soft)" />
    </g>
  );
};

// His palm in the dawn light, dark green in the middle
const PalmInsert: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const z = 1 + (s - beats.palm[0]) * 0.004;
  const tremble = Math.sin(frame * 1.9) * 4;
  return (
    <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
      <rect x={-200} y={-200} width={1500} height={2400} fill="#3a2a40" />
      <circle cx={300} cy={300} r={900} fill="#ffcf8a" opacity={0.35} filter="url(#soft)" />
      <g transform={`translate(${540 + tremble} ${1150}) rotate(-6)`}>
        <rect x={-110} y={160} width={220} height={700} rx={90} fill="#0b0b0d" />
        <ellipse cx={0} cy={60} rx={230} ry={250} fill="#0b0b0d" />
        {[-150, -55, 45, 140].map((fx, i) => (
          <rect key={i} x={fx - 34} y={-430 + Math.abs(fx) * 0.5} width={68} height={300} rx={34} fill="#0b0b0d" />
        ))}
        <rect x={150} y={-40} width={68} height={240} rx={34} fill="#0b0b0d" transform="rotate(-40 184 80)" />
        <path d="M -230 60 A 230 250 0 0 1 0 -190" stroke="#ffcf8a" strokeWidth={6} fill="none" opacity={0.35} />
        {/* what came up */}
        <path d="M -90 20 Q -40 -60 50 -10 Q 120 40 60 110 Q -10 160 -80 100 Q -130 60 -90 20 Z" fill="#2f5a1a" />
        <path d="M -40 30 Q 0 -10 40 20" stroke="#7fbf3a" strokeWidth={8} fill="none" opacity={0.7} strokeLinecap="round" />
        <circle cx={70} cy={140} r={14} fill="#2f5a1a" />
        <path d="M 60 110 q 6 60 -4 110" stroke="#2f5a1a" strokeWidth={10} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
};

export const Part08: React.FC = () => {
  const frame = useCurrentFrame();
  const s = toStory(frame);
  const cuts = [beats.plaza, beats.inside, beats.outside];
  const scene = cuts.filter((c) => s >= c).length;
  const cut = scene > 0 ? cuts[scene - 1] : 0;
  const dip = cut > 0 ? 1 - clamp01((s - cut) / 4) : 0;
  const black = s >= beats.cut;
  const insert = s >= beats.inside && s < 440 ? "scratch" : s >= beats.write[0] && s < beats.write[1] ? "note" : s >= beats.palm[0] && s < beats.palm[1] ? "palm" : null;
  return (
    <AbsoluteFill style={{ backgroundColor: "#05060a" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Defs />
        <RoadDefs />
        <BridgeDefs />
        <g transform={`translate(540 960) scale(${1 + 0.07 * impulse(frame, EMPH, 5)}) translate(-540 -960)`}>
          {insert === "scratch" ? (
            <ScratchInsert s={s} frame={frame} />
          ) : insert === "note" ? (
            <NoteInsert s={s} frame={frame} />
          ) : insert === "palm" ? (
            <PalmInsert s={s} frame={frame} />
          ) : scene === 0 ? (
            <BusEdge s={s} frame={frame} />
          ) : scene === 1 ? (
            <PlazaNight s={s} frame={frame} />
          ) : scene === 2 ? (
            <Booth s={s} frame={frame} />
          ) : (
            <PlazaDawn s={s} frame={frame} />
          )}
        </g>
        <rect width={1080} height={1920} fill="url(#vignette8)" />
        <rect width={1080} height={1920} fill="#000" opacity={black ? 1 : dip} />
        <defs>
          <radialGradient id="vignette8" cx="50%" cy="50%" r="72%">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.6} />
          </radialGradient>
        </defs>
      </svg>
      <SeriesBadge frame={frame} part={8} title="THE SCRATCH" until={Math.round(toOut(80))} />
      <Captions frame={frame} chunks={timeline.captions} speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>} />
      <PartCard frame={frame} from={Math.round(toOut(beats.card))} part={8} embers />
    </AbsoluteFill>
  );
};
