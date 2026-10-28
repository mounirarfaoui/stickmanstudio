import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { GAITS, lerpPose, Pose, POSES, skeleton, StickFigure, walkPose } from "../../shared/rig";
import { cameraTransform, clamp01, handheld, impulse, makeWarp, Shot, shotCamera, track } from "../kit";
import { Captions, PartCard, SeriesBadge, SPEAKERS } from "../Overlays";
import { RoadDefs, Truck } from "../road";
import { Defs, rand, Zombie } from "../world";
import {
  Ash,
  Bat,
  Bridge,
  BRIDGE,
  BridgeDefs,
  Bus,
  busRoofY,
  carTop,
  face,
  FarLane,
  GraspHand,
  HighwaySign,
  Leash,
  LostHat,
  moving,
  P78,
  Shards,
  worldOf,
  WreckCar,
} from "../bridge";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toOut } = makeWarp(timeline);
const toStory = makeWarp(timeline).toStory;
// output frames of the emphasised words: the camera punches in on each
const EMPH = timeline.captions.flatMap((c) => c.words.filter((w) => w.emph).map((w) => w.frame));

const D = BRIDGE.deck;
// The near lane Kai and Mia cross on, all jammed nose to tail heading north
const CARS = [
  { x: 900, c: "#4a5a6a" },
  { x: 1610, c: "#6a3a34" },
  { x: 2330, c: "#3e5a48" },
  { x: 3060, c: "#5a5048" },
  { x: 3800, c: "#3a4458" },
  { x: 5560, c: "#6a5a3a" },
  { x: 6280, c: "#4a3a4a" },
  { x: 7000, c: "#5a6670" },
];
const TRUCK_X = 4700;
const BUS_X = 7930;
// where Kai's hands catch the bus roof
const EDGE = { x: BUS_X + 34, y: busRoofY(BUS_X, BUS_X + 34) };

// Surfaces a runner can stand on; between two of them is a jump
type Surf = { a: number; b: number; y: (x: number) => number };
const SURF: Surf[] = [
  { a: -3000, b: 850, y: () => D },
  ...CARS.slice(0, 5).map((c) => ({ a: c.x + 10, b: c.x + 556, y: (x: number) => D + carTop(x - c.x) })),
  { a: 4430, b: 5160, y: () => D },
  { a: TRUCK_X + 600, b: TRUCK_X + 690, y: () => D - 246 },
  ...CARS.slice(5).map((c) => ({ a: c.x + 10, b: c.x + 556, y: (x: number) => D + carTop(x - c.x) })),
  { a: BUS_X + 28, b: BUS_X + 1200, y: (x: number) => busRoofY(BUS_X, x) },
];
// Height of the path at x, and how far through a jump (0 = on a surface)
const pathAt = (x: number) => {
  for (let i = 0; i < SURF.length; i++) {
    const s = SURF[i];
    if (x >= s.a && x <= s.b) return { y: s.y(x), air: 0 };
    const n = SURF[i + 1];
    if (n && x > s.b && x < n.a) {
      const t = (x - s.b) / (n.a - s.b);
      const y0 = s.y(s.b);
      const y1 = n.y(n.a);
      const h = 40 + 0.22 * (n.a - s.b);
      return { y: y0 + (y1 - y0) * t - Math.sin(Math.PI * t) * h, air: Math.sin(Math.PI * t) };
    }
  }
  return { y: D, air: 0 };
};

// Kai's route (story frame -> x)
const KX = {
  f: [0, 175, 178, 198, 215, 258, 300, 345, 400, 455, 465, 495, 515, 530, 640, 720, 900, 935, 948, 960, 975, 995, 1030, 1065, 1080, 1145, 1170, 1200],
  v: [120, 820, 840, 960, 1000, 1880, 2600, 3330, 3400, 3440, 3500, 4050, 4280, 4470, 4600, 5030, 5030, 5180, 5300, 5390, 5640, 5840, 6560, 7280, 7330, 7340, 7250, 7545],
};
// Mia's route: she trails him over the first roofs, takes the bed of the truck, then leads the escape
const MX = {
  f: [0, 175, 202, 222, 236, 276, 318, 363, 418, 473, 483, 513, 533, 548, 640, 720, 905, 925, 940, 955, 985, 1020, 1055, 1080, 1105, 1112, 1140],
  v: [0, 700, 840, 960, 1000, 1880, 2600, 3330, 3400, 3440, 3500, 4050, 4280, 4470, 4560, 4880, 4880, 5240, 5340, 5640, 5840, 6560, 7280, 7400, 7420, 7540, 8020],
};
const speedOf = (s: number, f: number[], v: number[]) => Math.abs(track(s + 1, f, v) - track(s - 1, f, v)) / 2;

// Kai hanging from the bus roof: his right hand pinned to the edge
const hangPose = (s: number, frame: number): Pose => {
  const slip = clamp01((s - beats.slip) / 6);
  const base = lerpPose(P78.brace, P78.hang, slip);
  // scrabbling feet after the slip, kicking at the hands below
  const kick = s > beats.slip ? Math.sin(frame * 0.9) * 18 * (1 - clamp01((s - 1330) / 30)) : Math.sin(frame * 0.4) * 4;
  const jerk = s > beats.grab ? 1 : 0;
  return { ...base, lTh: base.lTh + kick, rTh: base.rTh - kick, lSh: base.lSh - kick * 0.6, tilt: base.tilt + (s > 1330 ? 30 : 0) * clamp01((s - 1330) / 10) - jerk * 6 };
};
const hangAt = (pose: Pose, scale: number) => {
  const h = skeleton(pose).rHand;
  return { x: EDGE.x - h.x * scale, y: EDGE.y - h.y * scale };
};

// Zombies standing in the gaps between the near-lane cars, reaching up at the roofs
const GAPS: [number, number][] = [
  [1466, 1610],
  [2176, 2330],
  [2896, 3060],
  [3616, 3800],
  [6126, 6280],
  [6846, 7000],
  [7566, 7900],
];
const reachPose = (frame: number, k: number, want: number): Pose => ({
  ...POSES.stand,
  lean: -4 + Math.sin(frame * 0.1 + k) * 4,
  tilt: -14 + Math.sin(frame * 0.3 + k) * 6,
  duck: 0.2,
  lUA: lerp(80, -165, want) + Math.sin(frame * 0.45 + k) * 16,
  lFA: lerp(92, -175, want) + Math.sin(frame * 0.6 + k) * 20,
  rUA: lerp(86, 160, want) + Math.sin(frame * 0.5 + k * 2) * 16,
  rFA: lerp(98, 170, want) + Math.sin(frame * 0.7 + k) * 20,
});
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const GapCrowd: React.FC<{ frame: number; kx: number; extra?: number }> = ({ frame, kx, extra = 0 }) => (
  <g>
    {GAPS.map(([a, b], gi) => {
      const n = Math.max(1, Math.floor((b - a) / 80)) + (gi === GAPS.length - 1 ? extra : 0);
      return Array.from({ length: n }, (_, i) => {
        const k = gi * 7 + i;
        const x = a + ((i + 0.5) / n) * (b - a) + (rand(k + 5000) - 0.5) * 30 + Math.sin(frame * 0.05 + k) * 8;
        // they strain harder the closer the runners come
        const want = clamp01(1 - Math.abs(kx - x) / 900) * 0.7 + 0.3;
        const flip = rand(k + 5010) > 0.5;
        return <Zombie key={k} x={x} y={D + 6 + (i % 2) * 8} scale={0.92 + rand(k + 5020) * 0.12} pose={reachPose(frame, k, want)} frame={frame} glow={1} flip={flip} />;
      });
    })}
  </g>
);

// The dead shuffling along the far lane, heads and arms above the car roofs
const FarDead: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    {Array.from({ length: 26 }, (_, i) => {
      const x0 = 1100 + i * 290 + rand(i + 5100) * 120;
      if (x0 > TRUCK_X - 150 && x0 < TRUCK_X + 900) return null;
      const x = x0 + Math.sin(frame * 0.02 + i) * 40;
      const p = walkPose(frame / 70 + i * 0.37, GAITS.shamble, { ...POSES.stand, lUA: 80, lFA: 92, rUA: 86, rFA: 98 });
      return <Zombie key={i} x={x} y={D - 40} scale={0.86} pose={p} frame={frame} glow={1} color="#434b3f" flip={rand(i + 5110) > 0.5} />;
    })}
  </g>
);

// The ones that come for them at the truck
const Closing: React.FC<{ frame: number; s: number }> = ({ frame, s }) => {
  if (s < 860) return null;
  return (
    <g>
      {Array.from({ length: 6 }, (_, i) => {
        const x = track(s, [860, 1000], [3900 + i * 90, 4500 + i * 110]) + Math.sin(frame * 0.1 + i) * 10;
        const p = walkPose(frame / 26 + i * 0.4, GAITS.shamble, { ...POSES.stand, lUA: 82, lFA: 92, rUA: 88, rFA: 98 });
        return <Zombie key={i} x={x} y={D + 4 + (i % 2) * 6} scale={1} pose={p} frame={frame} glow={1} />;
      })}
    </g>
  );
};

// The strangers' truck, crashed into the rail: doors open, glass out, nobody inside
const Crash: React.FC<{ frame: number; t: number; children?: React.ReactNode }> = ({ frame, t, children }) => {
  const x = TRUCK_X;
  return (
    <g>
      <Truck id="p7truck" x={x} y={D} frame={frame} headlights={0} brake={0} exhaust={0} mirrorEyes={-3} driver={null}>
        {children}
      </Truck>
      {/* the driver's door hangs open: dark cab, a bloody handprint on the glass */}
      <polygon points={`${x + 372},${D - 366} ${x + 528},${D - 366} ${x + 580},${D - 262} ${x + 580},${D - 96} ${x + 372},${D - 96}`} fill="#08090c" />
      <rect x={x + 400} y={D - 230} width={80} height={110} rx={10} fill="#1a1416" />
      <g transform={`translate(${x + 450} ${D - 320}) rotate(-12)`} opacity={0.85}>
        <ellipse rx={18} ry={22} fill="#4a0d0d" />
        {[-14, -5, 5, 14].map((fx, i) => (
          <rect key={i} x={fx - 4} y={-52 + Math.abs(fx)} width={8} height={32} rx={4} fill="#4a0d0d" />
        ))}
        <path d="M -10 20 q 4 40 -2 70" stroke="#4a0d0d" strokeWidth={6} fill="none" />
      </g>
      <polygon points={`${x + 580},${D - 372} ${x + 650},${D - 340} ${x + 650},${D - 120} ${x + 580},${D - 96}`} fill="#4e3226" />
      <polygon points={`${x + 588},${D - 360} ${x + 642},${D - 334} ${x + 642},${D - 270} ${x + 588},${D - 262}`} fill="#0d1017" opacity={0.7} />
      {/* crumpled front end */}
      <path d={`M ${x + 640} ${D - 250} l 30 30 l -14 26 l 36 20 l -20 34 l 40 26 l -10 40 l 30 0 l 0 -150 Z`} fill="#2c1b14" />
      <path d={`M ${x + 606} ${D - 246} l 20 -18 l 26 14 l 22 -16 l 30 20`} stroke="#8a8d94" strokeWidth={6} fill="none" />
      {/* steam still rising from the hood */}
      {Array.from({ length: 7 }, (_, i) => {
        const p = (frame * 0.012 + i / 7) % 1;
        return <circle key={i} cx={x + 660 + Math.sin(frame * 0.05 + i) * 20 + p * 40} cy={D - 260 - p * 360} r={20 + p * 60} fill="#b9b4ad" opacity={0.22 * (1 - p)} />;
      })}
      {/* the dark stain and the glass */}
      <ellipse cx={x + 450} cy={D + 6} rx={160} ry={12} fill="#2a0606" opacity={0.9} />
      <path d={`M ${x + 380} ${D + 10} q 4 30 -2 50 M ${x + 480} ${D + 12} q 3 20 0 34`} stroke="#2a0606" strokeWidth={8} fill="none" />
      <Shards x={x + 300} w={500} y={D} t={t} />
      <LostHat x={x + 140} y={D} angle={14} />
    </g>
  );
};

export const Part07: React.FC = () => {
  const frame = useCurrentFrame();
  const s = toStory(frame);
  const t = track(s, [0, beats.cut], [0.05, 0.85]);

  // ---------- Kai ----------
  let kx = track(s, KX.f, KX.v);
  const kv = speedOf(s, KX.f, KX.v);
  const kp = pathAt(kx);
  let ky = kp.y;
  let kaiPose: Pose = moving(POSES.stand, kx, kv, false);
  if (kp.air > 0) kaiPose = lerpPose(kaiPose, P78.leap, clamp01(kp.air * 2.5));
  let kaiFlip = false;
  let kaiScale = 1;
  if (s >= beats.climb[0] && s < 198) kaiPose = lerpPose(P78.climbUp, P78.crouch, clamp01((s - 178) / 20));
  if (s >= 198 && s < 215) {
    kaiPose = P78.reachDown;
    kaiFlip = true;
  }
  // balancing on the roof while Mia talks
  if (s >= 345 && s < 465) kaiPose = lerpPose(kaiPose, { ...P78.balance, tilt: P78.balance.tilt + Math.sin(frame * 0.15) * 6, lean: Math.sin(frame * 0.12) * 6 }, clamp01((s - 345) / 10) * (1 - clamp01((s - 455) / 10)));
  // the cautious walk to the truck, then looking into the cab
  if (s >= 530 && s < 640) kaiPose = moving({ ...POSES.stand, duck: 0.3, tilt: 6 }, kx, kv, false);
  if (s >= 720 && s < 840) kaiPose = lerpPose(kaiPose, P78.look, clamp01((s - 720) / 12));
  if (s >= 840 && s < 935) {
    kaiPose = P78.comfort;
    kaiFlip = true;
  }
  if (s >= 905 && s < 935) kaiPose = lerpPose(P78.comfort, P78.backUp, clamp01((s - 905) / 8));
  // the last roof: watch Mia go, back up, run, jump
  if (s >= 1080 && s < 1145) kaiPose = { ...POSES.stand, tilt: 8 + Math.sin(frame * 0.2) * 3, duck: 0.2 };
  if (s >= 1145 && s < 1170) kaiPose = moving(P78.backUp, -kx, kv, true);
  let hanging = false;
  if (s >= beats.jump[0]) {
    const hp = hangPose(s, frame);
    const hang = hangAt(hp, kaiScale);
    const a = clamp01((s - beats.jump[0]) / (beats.jump[1] - beats.jump[0]));
    if (a < 1) {
      const sy = pathAt(7545).y;
      kx = 7545 + (hang.x - 7545) * a;
      ky = sy + (hang.y - sy) * a - Math.sin(Math.PI * a) * 170;
      kaiPose = lerpPose(P78.leap, P78.brace, a * a);
    } else {
      hanging = true;
      kx = hang.x;
      ky = hang.y + impulse(frame, [toOut(beats.slip), toOut(beats.grab)], 4) * 14;
      kaiPose = hp;
    }
  }
  const kaiWorry = s < 175 ? 0.5 : s < 640 ? 0.6 : s < 760 ? 0.9 : s < 935 ? 0.8 : 1;
  const kaiFace = face(kaiWorry, s > 1288 ? 0.7 : kp.air > 0.3 ? 0.4 : 0, s > 1150 ? 0.8 : 0.2);

  // ---------- Mia ----------
  let mx = track(s, MX.f, MX.v);
  const mv = speedOf(s, MX.f, MX.v);
  const mp = pathAt(mx);
  let my = mp.y;
  let miaPose: Pose = moving(P78.batDown, mx, mv, false);
  let bat = mv > 7 ? 40 : 10;
  if (mp.air > 0) {
    miaPose = lerpPose(miaPose, P78.leap, clamp01(mp.air * 2.5));
    bat = 120;
  }
  let miaFlip = false;
  if (s >= 202 && s < 222) {
    miaPose = lerpPose(P78.climbUp, P78.crouch, clamp01((s - 202) / 20));
    my = D + (track(s, [202, 222], [0, -176]));
  }
  if (s >= 363 && s < 483) {
    miaPose = lerpPose(miaPose, { ...P78.balance, tilt: 14 + Math.sin(frame * 0.18) * 6, lean: Math.sin(frame * 0.14 + 1) * 6 }, clamp01((s - 363) / 10) * (1 - clamp01((s - 473) / 10)));
    bat = 90;
  }
  if (s >= 548 && s < 640) miaPose = moving({ ...P78.batReady, duck: 0.3 }, mx, mv, false);
  if (s >= 548 && s < 640) bat = -150;
  const lifting = s >= beats.lift[0];
  if (s >= 740 && s < 905) {
    const up = clamp01((s - beats.lift[0]) / (beats.lift[1] - beats.lift[0]));
    const down = clamp01((s - 830) / 20);
    miaPose = lerpPose(lerpPose(P78.look, P78.lift, up), P78.holdUp, down);
    // her shoulders shake
    if (s > 830) miaPose = { ...miaPose, tilt: miaPose.tilt + Math.sin(frame * 1.1) * 3, duck: 0.5 + Math.sin(frame * 0.9) * 0.08 };
    bat = 6;
  }
  // she lands on the bus, turns, and reaches back for him
  if (s >= beats.miaJump[1]) {
    mx = 8020;
    my = busRoofY(BUS_X, 8020);
    const crouch = clamp01((s - beats.miaJump[1]) / 6);
    miaPose = lerpPose(P78.land, P78.reachDown, clamp01((s - 1150) / 14));
    if (crouch < 1) miaPose = lerpPose(P78.land, miaPose, crouch);
    miaFlip = s >= 1150;
    bat = 60;
  }
  const miaFace = face(s > 640 ? 1 : 0.8, s > 1288 ? 0.7 : 0, 0.3);
  const leashOn = lifting && s < 1000;

  // ---------- camera ----------
  const kxAt = (f: number) => track(f, KX.f, KX.v);
  const miaHand = worldOf(P78.lift, "lHand", 4880, D, 0.92, false);
  const kaiHead = (f: number) => {
    const p = hangPose(f, f);
    const h = hangAt(p, 1);
    return worldOf(p, "head", h.x, h.y, 1, false);
  };
  const foot = (() => {
    const p = hangPose(1390, 1390);
    const h = hangAt(p, 1);
    return worldOf(p, "lFoot", h.x, h.y, 1, false);
  })();
  const SHOTS: Shot[] = [
    { from: 0, to: 62, keys: [[0, 240, 880, 1.25], [62, 420, 875, 1.32]] },
    { from: 62, to: 140, keys: [[62, 1500, 1300, 0.5], [140, 1850, 1290, 0.56]] },
    { from: 140, to: 175, keys: [[140, 1540, 1330, 1.45], [175, 1560, 1320, 1.65]] },
    { from: 175, to: 215, keys: [[175, 900, 1160, 1.25], [215, 960, 1120, 1.35]] },
    { from: 215, to: 258, keys: [[215, kxAt(215) + 160, 1000, 0.85], [258, kxAt(258) + 160, 1000, 0.9]] },
    { from: 258, to: 300, keys: [[258, 2250, 1360, 1.3], [300, 2330, 1330, 1.5]] },
    { from: 300, to: 345, keys: [[300, kxAt(300) + 160, 1000, 0.9], [345, kxAt(345) + 100, 1000, 0.95]] },
    { from: 345, to: 400, keys: [[345, 3420, 1120, 1.25], [400, 3430, 1110, 1.4]] },
    { from: 400, to: 430, keys: [[400, 3400, 1060, 2.2], [430, 3405, 1060, 2.45]] },
    { from: 430, to: 452, keys: [[430, 3700, 1480, 1.5], [452, 3705, 1470, 1.7]] },
    { from: 452, to: 470, keys: [[452, 3700, D - 270, 3.6], [470, 3700, D - 270, 4.0]] },
    { from: 470, to: 530, keys: [[470, 3800, 1120, 0.8], [530, 4250, 1160, 0.85]] },
    { from: 530, to: 600, keys: [[530, 4500, 1260, 1.3], [600, 4560, 1260, 1.4]] },
    { from: 600, to: 648, keys: [[600, kxAt(620) + 10, D - 250, 3.0], [648, kxAt(640) + 10, D - 250, 3.3]] },
    { from: 648, to: 700, keys: [[648, 5000, 1220, 0.72], [700, 5030, 1230, 0.84]] },
    { from: 700, to: 760, keys: [[700, 4980, 1260, 1.1], [760, 5000, 1260, 1.22]] },
    { from: 760, to: 790, keys: [[760, 4880, 1200, 1.8], [790, 4880, 1180, 2.0]] },
    { from: 790, to: 830, keys: [[790, miaHand.x, miaHand.y + 90, 3.6], [830, miaHand.x, miaHand.y + 90, 4.1]] },
    { from: 830, to: 881, keys: [[830, TRUCK_X + 470, D - 260, 2.4], [881, TRUCK_X + 470, D - 270, 2.75]] },
    { from: 881, to: 903, keys: [[881, TRUCK_X + 160, D - 40, 3.4], [903, TRUCK_X + 180, D - 40, 3.8]] },
    { from: 903, to: 935, keys: [[903, 4980, 1250, 1.3], [935, 4900, 1250, 1.45]] },
    { from: 935, to: 1000, keys: [[935, 5250, 1150, 0.75], [1000, 5900, 1100, 0.8]] },
    { from: 1000, to: 1065, keys: [[1000, kxAt(1000) + 200, 1000, 0.9], [1065, kxAt(1065) + 200, 1000, 0.9]] },
    { from: 1065, to: 1105, keys: [[1065, 7640, 1150, 0.68], [1105, 7690, 1150, 0.74]] },
    { from: 1105, to: 1145, keys: [[1105, 7740, 1150, 0.8], [1145, 7840, 1110, 0.86]] },
    { from: 1145, to: 1170, keys: [[1145, 7330, D - 470, 2.4], [1170, 7300, D - 470, 2.7]] },
    { from: 1170, to: 1200, keys: [[1170, 7330, 1240, 1.0], [1200, 7580, 1200, 1.0]] },
    { from: 1200, to: 1230, keys: [[1200, 7760, 1150, 0.8], [1230, 7860, 1150, 0.86]] },
    { from: 1230, to: 1288, keys: [[1230, EDGE.x - 30, EDGE.y + 40, 2.3], [1288, EDGE.x - 30, EDGE.y + 50, 2.7]] },
    { from: 1288, to: 1340, keys: [[1288, 7930, 1230, 1.05], [1340, 7930, 1250, 1.18]] },
    { from: 1340, to: 1372, keys: [[1340, kaiHead(1340).x + 30, kaiHead(1340).y + 20, 3.0], [1372, kaiHead(1372).x + 30, kaiHead(1372).y + 20, 3.4]] },
    { from: 1372, to: 2000, keys: [[1372, foot.x - 40, foot.y - 260, 1.65], [1424, foot.x - 30, foot.y - 250, 1.95]] },
  ];
  const cam = shotCamera(s, SHOTS);
  const kick = impulse(frame, [toOut(beats.full), toOut(beats.truck), toOut(beats.jump[1]), toOut(beats.slip), toOut(beats.grab)], 4) * 18;
  const landKick = kp.air > 0 ? 0 : impulse(frame, [toOut(258), toOut(300), toOut(345), toOut(495), toOut(975), toOut(1030), toOut(1065)], 3) * 8;
  const run = kv > 7 ? Math.abs(Math.sin(frame * 0.6)) * 6 : 0;
  const shake = handheld(frame, s > 1200 ? 4.2 : 3.2, { x: kick * Math.sin(frame * 3), y: kick * 0.5 + landKick + run });

  // ---------- the grab ----------
  const rise = clamp01((s - 1380) / 16);
  const close = clamp01((s - (beats.grab - 3)) / 4);
  const kaiNow = { pose: kaiPose, x: kx, y: ky };
  const ankle = worldOf(kaiNow.pose, "lFoot", kaiNow.x, kaiNow.y, kaiScale, kaiFlip);

  const kai = (
    <StickFigure pose={kaiPose} x={kx} y={ky} scale={kaiScale} frame={frame} flip={kaiFlip} face={kaiFace} />
  );
  const mia = (
    <StickFigure
      pose={miaPose}
      x={mx}
      y={my}
      scale={0.92}
      frame={frame}
      flip={miaFlip}
      hair="ponytail"
      face={miaFace}
      prop={(sk) => (
        <g>
          <Bat sk={sk} angle={bat} />
          {leashOn ? <Leash x={sk.lHand.x} y={sk.lHand.y + 20} scale={0.9} sway={Math.sin(frame * 0.2) * 5} /> : null}
        </g>
      )}
    />
  );
  // during the leash lift Mia stands between the truck bed and the camera
  const black = s >= beats.cut;
  return (
    <AbsoluteFill style={{ backgroundColor: "#05060a" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Defs />
        <RoadDefs />
        <BridgeDefs />
        <g transform={`translate(540 960) scale(${1 + 0.07 * impulse(frame, EMPH, 5)}) translate(-540 -960)`}>
          <g transform={cameraTransform(cam, shake)}>
            <Bridge frame={frame} t={t} cx={cam.fx} broken={[TRUCK_X + 560, TRUCK_X + 760]}>
              <HighwaySign x={0} frame={frame} top={D - 760} />
              <FarDead frame={frame} />
              <FarLane from={900} to={9600} skip={[TRUCK_X - 100, TRUCK_X + 820]} />
              <Closing frame={frame} s={s} />
              <Crash frame={frame} t={t} />
              {CARS.map((c, i) => (
                <WreckCar key={c.x} x={c.x} color={c.c} seed={i + 7} dent={Math.abs(kx - (c.x + 310)) < 120 && kp.air === 0 && s < 1200 ? 1 : 0} />
              ))}
              <Bus x={BUS_X} frame={frame} />
              <GapCrowd frame={frame} kx={kx} extra={2} />
              {s < 1424 ? mia : null}
              {kai}
              {/* the hand that finds his ankle */}
              {hanging && rise > 0 ? (
                <GraspHand x={ankle.x - 6 - (1 - rise) * 160} y={ankle.y + 10 + (1 - rise) * 120} scale={0.5} close={close} angle={55} arm={380} frame={frame} />
              ) : null}
            </Bridge>
          </g>
          <Ash frame={frame} color={t > 0.4 ? "#c9b0a0" : "#ffb07a"} />
        </g>
        <rect width={1080} height={1920} fill="url(#vignette7)" />
        <rect width={1080} height={1920} fill="#000" opacity={black ? 1 : 0} />
        <defs>
          <radialGradient id="vignette7" cx="50%" cy="50%" r="72%">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.6} />
          </radialGradient>
        </defs>
      </svg>
      <SeriesBadge frame={frame} part={7} title="THE BRIDGE" until={Math.round(toOut(90))} />
      <Captions frame={frame} chunks={timeline.captions} speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>} />
      <PartCard frame={frame} from={Math.round(toOut(beats.card))} part={7} embers />
    </AbsoluteFill>
  );
};
