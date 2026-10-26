import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { GAITS, lerpPose, Pose, poseAt, POSES, skeleton, StickFigure, walkPose } from "../../shared/rig";
import { cameraTransform, clamp01, impulse, KAI, makeWarp, Shot, shotCamera, track } from "../kit";
import { Captions, PartCard, SeriesBadge } from "../Overlays";
import { Alley, ALLEY, BATH, BathDoor, Bathroom, Car, ESC, FireEscape, STAIR_RUNS } from "../sets";
import { Defs, Door, Dresser, Horde, Outside, rand, Room, SET, TVScreen, WindowFrame, Zombie } from "../world";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toStory, toOut } = makeWarp(timeline);
const SCENES = { bath: beats.slam + 2, exterior: beats.exterior, alley: beats.alley };

// Part 2 poses on top of Kai's base set
const P2 = {
  ...KAI,
  crouch: { lean: 26, tilt: 4, duck: 0.5, chest: 1, lUA: 40, lFA: 80, rUA: 50, rFA: 90, lTh: 72, lSh: -38, rTh: 84, rSh: -28 },
  lock: { ...POSES.stand, lean: 8, tilt: -4, lUA: 34, lFA: 64, rUA: 82, rFA: 74 },
  climbUp: { ...POSES.stand, lean: 8, rTh: 88, rSh: 4, rUA: 40, rFA: 120, lUA: -20, lFA: 10 },
  reachUp: { ...POSES.stand, lean: -4, tilt: -10, lUA: -172, lFA: -176, rUA: 172, rFA: 176 },
  strain: { ...POSES.stand, lean: -9, tilt: -16, duck: 0.35, lUA: -168, lFA: -172, rUA: 166, rFA: 172 },
  squeeze: { lean: 0, tilt: -6, duck: 0.6, chest: 1, lUA: -172, lFA: -176, rUA: 172, rFA: 176, lTh: -4, lSh: -2, rTh: 4, rSh: 2 },
  pull: { lean: -18, tilt: -6, duck: 0.3, chest: 1, lUA: 120, lFA: 150, rUA: 128, rFA: 160, lTh: -24, lSh: -10, rTh: 20, rSh: 26 },
  climbOver: { lean: 10, tilt: 0, duck: 0.2, chest: 1, lUA: 20, lFA: 40, rUA: 30, rFA: 50, lTh: -10, lSh: -4, rTh: 95, rSh: 20 },
  hang: { lean: 0, tilt: -8, duck: 0.4, chest: 1, lUA: -176, lFA: -178, rUA: 176, rFA: 178, lTh: -10, lSh: -18, rTh: 8, rSh: -6 },
  fall: { lean: -6, tilt: -12, duck: 0.2, chest: 1, lUA: -150, lFA: -120, rUA: 150, rFA: 120, lTh: 20, lSh: -20, rTh: 40, rSh: -10 },
  land: { lean: 34, tilt: 8, duck: 0.6, chest: 0.95, lUA: 60, lFA: 30, rUA: 70, rFA: 40, lTh: 92, lSh: -48, rTh: 100, rSh: -40 },
  recoil: { lean: -24, tilt: -14, duck: 0.4, chest: 1, lUA: 30, lFA: 160, rUA: 50, rFA: 165, lTh: 112, lSh: 14, rTh: 124, rSh: 26 },
} satisfies Record<string, Pose>;
type P2Pose = keyof typeof P2;

// Crouched sneaking: bent knees with a small, careful step
const sneakPose = (phase: number): Pose => {
  const a = phase * Math.PI * 2;
  return { ...P2.crouch, lTh: P2.crouch.lTh + 14 * Math.sin(a), lSh: P2.crouch.lSh - 8 * Math.max(0, Math.cos(a)), rTh: P2.crouch.rTh - 14 * Math.sin(a), rSh: P2.crouch.rSh - 8 * Math.max(0, -Math.cos(a)) };
};
// Blend a standing pose into a walk or run when Kai is moving
const moving = (base: Pose, x: number, speed: number, flip: boolean) => {
  const gait = speed > 9 ? GAITS.run : GAITS.walk;
  return lerpPose(base, walkPose((flip ? -x : x) / (speed > 9 ? 300 : 190), gait, base), clamp01(speed / 3));
};
const speedOf = (s: number, frames: number[], values: number[]) => Math.abs(track(s + 1, frames, values) - track(s - 1, frames, values)) / 2;

const face = (worry: number, mouth = 0) => ({ worry, smile: 0, mouth, sweat: worry > 0.7 ? 0.8 : 0 });
const zPose = (frame: number, k: number): Pose => ({ ...POSES.stand, tilt: 14 + Math.sin(frame * 0.3 + k) * 6, lUA: 66, lFA: 78, rUA: 80, rFA: 88 });

// ================= Scene 1: the living room =================
const LIVING_SHOTS: Shot[] = [
  { from: 0, to: 70, keys: [[0, 455, 940, 1.85], [70, 455, 930, 2.0]] },
  { from: 70, to: 150, keys: [[70, 1790, 1340, 2.0], [150, 1790, 1250, 1.7]] },
  { from: 150, to: 192, keys: [[150, 455, 950, 1.45], [192, 455, 950, 1.6]] },
  { from: 192, to: 218, keys: [[192, 455, 950, 1.6], [218, 520, 1000, 1.3]] },
  { from: 218, to: 262, keys: [[218, 1810, 1260, 1.6], [262, 2060, 1250, 1.3]] },
  { from: 262, to: 300, keys: [[262, 560, 1220, 1.25], [300, 660, 1260, 1.2]] },
  { from: 300, to: 400, keys: [[300, 2250, 1250, 1.4], [342, 2320, 1250, 1.5]] },
];
const BATHROOM_DOOR_X = 2240;

const LivingRoom: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const shatter = s - beats.shatter;
  const cam = shotCamera(s, LIVING_SHOTS);
  const kick = shatter >= 0 ? Math.exp(-shatter / 6) * 18 : 0;
  // Kai: sitting against the dresser, stands, flinches at the shatter, sprints for the bathroom
  const KX = { f: [0, 222, 236, 300, 340], v: [1792, 1792, 1810, 2300, 2335] };
  const kx = track(s, KX.f, KX.v);
  const flip = s < 224;
  const base = poseAt<P2Pose>(s, [[0, "sit"], [78, "sit"], [118, "stand"], [196, "stand"], [204, "flinch"], [222, "flinch"], [236, "stand"]], P2);
  const kaiPose = moving(base, kx, speedOf(s, KX.f, KX.v), flip);
  // the first one through the window
  const climb = clamp01((s - beats.climbIn[0]) / (beats.climbIn[1] - beats.climbIn[0]));
  const zx = track(s, [beats.climbIn[0], beats.climbIn[1], 342], [430, 640, 980]);
  const zy = track(s, [beats.climbIn[0], beats.climbIn[0] + 14, beats.climbIn[1]], [1262, 1220, SET.floor]);
  const zp = climb < 1 ? { ...zPose(frame, 1), lean: 50 - climb * 40, lUA: 120, lFA: 100, rUA: 130, rFA: 110 } : walkPose(frame / 30, GAITS.shamble, zPose(frame, 1));
  const doorOpen = clamp01((s - 300) / 12) * (1 - clamp01((s - 328) / 10));
  return (
    <g transform={cameraTransform(cam, { x: kick * Math.sin(frame * 3.1), y: kick * Math.cos(frame * 2.3) })}>
      <Room />
      <Outside frame={frame}>
        <Horde frame={frame} reveal={1} />
      </Outside>
      {/* before it breaks: the crack keeps spreading; after: arms pour through the hole */}
      {shatter < 0 ? <CrackGrow progress={clamp01(s / 200)} /> : null}
      <WindowFrame />
      {shatter >= 0
        ? Array.from({ length: 6 }, (_, i) => {
            const reach = clamp01((shatter - i * 4) / 18);
            const sx = SET.window.x + 70 + i * 90;
            const sy = SET.window.y + 160 + rand(i) * 340;
            const a = 0.35 + Math.sin(frame * 0.25 + i) * 0.25;
            const len = 60 + reach * (110 + rand(i + 4) * 80);
            const ex = sx + Math.cos(a) * len;
            const ey = sy + Math.sin(a) * len;
            return reach > 0 ? (
              <g key={i} stroke="#170e11" strokeLinecap="round">
                <line x1={sx} y1={sy} x2={ex} y2={ey} strokeWidth={16} />
                {[-0.5, 0, 0.5].map((d) => (
                  <line key={d} x1={ex} y1={ey} x2={ex + Math.cos(a + d) * 22} y2={ey + Math.sin(a + d) * 22} strokeWidth={6} />
                ))}
              </g>
            ) : null;
          })
        : null}
      {shatter >= 0 && shatter < 40
        ? Array.from({ length: 46 }, (_, i) => {
            const t = shatter;
            const x0 = SET.window.x + rand(i) * SET.window.w;
            const y0 = SET.window.y + rand(i + 50) * SET.window.h;
            return (
              <polygon
                key={i}
                points="0,-12 9,6 -8,8"
                fill="#dfe8f5"
                opacity={0.85 * (1 - t / 40)}
                transform={`translate(${x0 + (rand(i + 9) - 0.3) * t * 16} ${y0 + t * t * 0.5 + (rand(i + 3) - 0.6) * t * 6}) rotate(${t * 25 * (rand(i + 5) - 0.5)}) scale(${1 + t * 0.06})`}
              />
            );
          })
        : null}
      <TVScreen frame={frame} since={9999} dead={0} />
      <ellipse cx={SET.lamp.x} cy={SET.lamp.top + 60} rx={620} ry={560} fill="url(#lampGlow)" opacity={shatter >= 0 && shatter < 30 ? 0.4 : 1} />
      <Door shake={0} />
      <Dresser x={1852} />
      {/* the bathroom door at the end of the room */}
      <rect x={BATHROOM_DOOR_X - 16} y={SET.door.y - 16} width={212} height={SET.floor - SET.door.y + 16} fill="#10131b" />
      <rect x={BATHROOM_DOOR_X} y={SET.door.y} width={180} height={SET.floor - SET.door.y} fill="#05060a" />
      {s >= beats.climbIn[0] ? <Zombie x={zx} y={zy} scale={1} pose={zp} frame={frame} glow={1} color="#4d5646" /> : null}
      <StickFigure pose={kaiPose} x={kx} y={SET.floor} scale={1} frame={frame} flip={flip} face={face(1, 0.3 + 0.2 * Math.sin(frame * 0.5))} />
      <g transform={`translate(${BATHROOM_DOOR_X + 180} 0) scale(${1 - doorOpen * 0.8} 1) translate(${-180} 0)`}>
        <rect x={0} y={SET.door.y} width={180} height={SET.floor - SET.door.y} fill="#d9d2c6" />
        <circle cx={22} cy={SET.door.y + 330} r={9} fill="#a98d55" />
      </g>
      {shatter >= 0 && shatter < 5 ? <rect x={-2000} y={-2000} width={6000} height={6000} fill="#fff" opacity={0.5 - shatter * 0.1} /> : null}
    </g>
  );
};

// The crack keeps growing on its way to giving out
const CrackGrow: React.FC<{ progress: number }> = ({ progress }) => {
  const cx = 470;
  const cy = 930;
  return (
    <g clipPath="url(#windowClip)">
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 + rand(i) * 0.4;
        const len = (180 + rand(i + 20) * 280) * (0.55 + progress * 0.45);
        let px = cx;
        let py = cy;
        const pts = [`${cx},${cy}`];
        for (let k = 1; k <= 5; k++) {
          const aa = a + (rand(i * 9 + k) - 0.5) * 0.7;
          px += Math.cos(aa) * (len / 5);
          py += Math.sin(aa) * (len / 5);
          pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
        }
        return <path key={i} d={`M ${pts.join(" L ")}`} stroke="#F2F6FF" strokeWidth={3} fill="none" opacity={0.9} />;
      })}
    </g>
  );
};

// ================= Scene 2: the bathroom =================
const BATH_SHOTS: Shot[] = [
  { from: 0, to: 404, keys: [[342, 720, 1150, 1.15], [404, 740, 1150, 1.25]] },
  { from: 404, to: 470, keys: [[404, 620, 1100, 1.05], [470, 420, 1040, 1.25]] },
  { from: 470, to: 532, keys: [[470, 380, 900, 1.7], [532, 380, 880, 1.85]] },
  { from: 532, to: 700, keys: [[532, 540, 1100, 1.0], [600, 540, 1080, 1.02]] },
];

const BathroomScene: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const bangs = beats.bathBangs.map(toOut);
  const bang = impulse(frame, bangs);
  const cam = shotCamera(s, BATH_SHOTS);
  const KX = { f: [342, 352, 368, 402, 410, 432, 470, 600], v: [990, 900, 860, 760, 760, 470, 375, 375] };
  const kx = track(s, KX.f, KX.v);
  const flip = s < 352 || (s >= 404 && s < 470);
  const base = poseAt<P2Pose>(
    s,
    [[342, "stand"], [352, "lock"], [366, "lock"], [376, "stand"], [404, "flinch"], [418, "stand"], [432, "climbUp"], [468, "reachUp"], [478, "strain"], [490, "reachUp"], [500, "strain"], [512, "strain"], [522, "reachUp"], [540, "squeeze"]],
    P2,
  );
  let pose = s < 432 ? moving(base, kx, speedOf(s, KX.f, KX.v), flip) : base;
  if (s >= 470 && s < 522) pose = { ...pose, lean: pose.lean + Math.sin(frame * 1.9) * 4 };
  // standing height: floor, then the tub rim, then up and out of the window
  const ky = track(s, [432, 468, beats.squeeze[0], beats.squeeze[1]], [BATH.floor, BATH.tub.rim - 12, BATH.tub.rim - 12, BATH.window.y - 40]);
  const sashT = clamp01((s - beats.sash[0]) / (beats.sash[1] - beats.sash[0]));
  const sash = s < 512 ? 0.06 + 0.06 * Math.abs(Math.sin(frame * 1.3)) * Math.min(1, sashT * 4) : track(s, [512, 522], [0.12, 1]);
  const splinter = bangs.filter((b) => frame >= b).length;
  const burst = clamp01((s - beats.doorBurst) / 8);
  return (
    <g transform={cameraTransform(cam, { x: bang * 8 * Math.sin(frame * 3), y: 0 })}>
      <Bathroom frame={frame} sash={sash} light={1 - bang * 0.6}>
        <defs>
          <clipPath id="bathKai">
            <rect x={-600} y={BATH.window.y} width={2400} height={3000} />
          </clipPath>
        </defs>
        <BathDoor splinter={splinter} open={burst} shake={bang} frame={frame}>
          {burst > 0
            ? [0, 1].map((k) => (
                <Zombie key={k} x={BATH.door.x + 50 + k * 70} y={BATH.floor + 30} scale={0.95 - k * 0.1} pose={{ ...zPose(frame, k), lUA: -120, lFA: -100, rUA: -110, rFA: -90 }} frame={frame} glow={1} color="#3d4538" flip />
              ))
            : null}
        </BathDoor>
        <g clipPath="url(#bathKai)">
          <StickFigure pose={pose} x={kx} y={ky} scale={1} frame={frame} flip={flip} face={face(s > 404 ? 1 : 0.85, 0.3 + 0.2 * Math.sin(frame * 0.6))} />
        </g>
      </Bathroom>
    </g>
  );
};

// ================= Scene 3: the fire escape =================
const ExteriorScene: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const [L1, , L3] = ESC.landings;
  // Kai's route: out of the window, along the landing, down two flights, the ladder, over the rail, hang, drop
  let kx = 385;
  let ky = L1;
  let flip = false;
  let pose: Pose = POSES.stand;
  const run = (r: readonly number[], t: number) => [r[0] + (r[2] - r[0]) * t, r[1] + (r[3] - r[1]) * t];
  if (s < beats.emerge[1]) {
    const t = clamp01((s - beats.emerge[0]) / (beats.emerge[1] - beats.emerge[0]));
    ky = track(s, beats.emerge, [ESC.window.y + ESC.window.h + 10, L1]);
    pose = lerpPose(P2.crouch, POSES.stand, t);
  } else if (s < 656) {
    kx = track(s, [beats.emerge[1], 656], [385, 760]);
    pose = moving(POSES.stand, kx, speedOf(s, [beats.emerge[1], 656], [385, 760]), false);
  } else if (s < 706) {
    const t = (s - 656) / 50;
    [kx, ky] = run(STAIR_RUNS[0], t);
    flip = true;
    pose = walkPose(t * 4, GAITS.run, POSES.stand);
  } else if (s < 716) {
    [kx, ky] = [190, ESC.landings[1]];
  } else if (s < 756) {
    const t = (s - 716) / 40;
    [kx, ky] = run(STAIR_RUNS[1], t);
    pose = walkPose(t * 3.5, GAITS.run, POSES.stand);
  } else if (s < beats.climbOver[0]) {
    [kx, ky] = [690, L3];
    pose = s < beats.ladder[1] ? { ...P2.pull, lean: P2.pull.lean - Math.abs(Math.sin(frame * 0.7)) * 10 } : POSES.stand;
  } else if (s < beats.hang[0]) {
    const t = clamp01((s - beats.climbOver[0]) / (beats.climbOver[1] - beats.climbOver[0]));
    kx = 690 + t * 150;
    ky = L3 - Math.sin(t * Math.PI) * 60;
    pose = lerpPose(P2.climbOver, P2.hang, clamp01(t * 1.6 - 0.6));
  } else {
    // hanging from the landing's edge, then the drop and the landing
    const hangFeet = L3 - skeleton(P2.hang).lHand.y;
    kx = 840;
    if (s < beats.drop[0]) {
      ky = hangFeet + Math.sin(frame * 0.4) * 3;
      pose = { ...P2.hang, lTh: P2.hang.lTh + Math.sin(frame * 0.3) * 8 };
    } else if (s < beats.drop[1]) {
      const t = (s - beats.drop[0]) / (beats.drop[1] - beats.drop[0]);
      ky = hangFeet + (ESC.ground - hangFeet) * t * t;
      pose = lerpPose(P2.hang, P2.fall, t);
    } else {
      ky = ESC.ground;
      const t = clamp01((s - beats.roll[0]) / 30);
      kx = track(s, [beats.roll[1], beats.hide[1]], [840, 430]);
      flip = s >= beats.roll[1];
      pose = s < beats.roll[1] ? lerpPose(P2.land, P2.crouch, t) : P2.crouch;
    }
  }
  const landKick = s >= beats.drop[1] ? Math.exp(-(s - beats.drop[1]) / 5) * 22 : 0;
  const ladderJiggle = s >= beats.ladder[0] && s < beats.ladder[1] ? 1 : 0;
  const follow = { fx: 480, fy: ky - 160, z: 1.12 };
  const SHOTS: Shot[] = [
    { from: 0, to: 656, keys: [[600, 470, 760, 1.35], [656, 560, 840, 1.2]] },
    { from: 656, to: 756, keys: [[656, follow.fx, follow.fy, follow.z]] },
    { from: 756, to: 846, keys: [[756, 680, 1960, 1.5], [846, 760, 2000, 1.5]] },
    { from: 846, to: 888, keys: [[846, 800, 2160, 1.7], [888, 790, 2240, 1.6]] },
    { from: 888, to: 2000, keys: [[888, 720, 2380, 1.15], [906, 660, 2470, 1.22], [962, 520, 2500, 1.3]] },
  ];
  const cam = shotCamera(s, SHOTS);
  // arms reaching out of the bathroom window above him
  const armsOut = clamp01((s - 642) / 20);
  return (
    <g transform={cameraTransform(cam, { x: landKick * Math.sin(frame * 3.3), y: landKick })}>
      <FireEscape
        frame={frame}
        ladderJiggle={ladderJiggle}
        sash={1}
        front={
          <>
            <StickFigure pose={pose} x={kx} y={ky} scale={1} frame={frame} flip={flip} face={face(1, 0.35 + 0.2 * Math.sin(frame * 0.6))} />
            {s >= beats.drop[1] && s < beats.drop[1] + 26
              ? Array.from({ length: 12 }, (_, i) => {
                  const t = s - beats.drop[1];
                  return <circle key={i} cx={840 + (i - 6) * t * 2.4} cy={ESC.ground - t * (1 + (i % 3)) + t * t * 0.08} r={6 + (i % 3) * 3} fill="#5a4a50" opacity={0.6 * (1 - t / 26)} />;
                })
              : null}
          </>
        }
      >
        {armsOut > 0
          ? Array.from({ length: 4 }, (_, i) => {
              const sx = ESC.window.x + 30 + i * 38;
              const sy = ESC.window.y + ESC.window.h - 10;
              const a = Math.PI / 2 + (i - 1.5) * 0.35 + Math.sin(frame * 0.3 + i) * 0.2;
              const len = armsOut * (90 + rand(i) * 70);
              return <line key={i} x1={sx} y1={sy - 40} x2={sx + Math.cos(a) * len} y2={sy + Math.sin(a) * len} stroke="#170e11" strokeWidth={14} strokeLinecap="round" />;
            })
          : null}
        {armsOut > 0 ? <Zombie x={ESC.window.x + 85} y={ESC.window.y + ESC.window.h + 150} scale={0.8} pose={{ ...zPose(frame, 3), lUA: 150, lFA: 160, rUA: -150, rFA: -160 }} frame={frame} glow={1} color="#2a2026" /> : null}
      </FireEscape>
    </g>
  );
};

// ================= Scene 4: the alley =================
const AlleyScene: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const g = ALLEY.ground;
  // sneak along the cars, freeze while the walker crosses the gap, creep up to the last car's door
  const KX = { f: [962, beats.sneak[0], 1028, 1064, beats.sneak[1], beats.carDoor[0]], v: [80, 80, 720, 720, 1120, 1300] };
  const kx = track(s, KX.f, KX.v);
  const speed = speedOf(s, KX.f, KX.v);
  const eyes = clamp01((s - beats.eyes[0]) / 6);
  let pose = speed > 0.3 ? lerpPose(P2.crouch, sneakPose(kx / 140), clamp01(speed * 2)) : P2.crouch;
  if (s >= beats.eyes[0]) pose = lerpPose(P2.crouch, P2.recoil, clamp01((s - beats.eyes[0]) / 8));
  const walkerT = clamp01((s - beats.walker[0]) / (beats.walker[1] - beats.walker[0]));
  const door = clamp01((s - beats.carDoor[0]) / (beats.carDoor[1] - beats.carDoor[0]));
  const doorE = door < 0.3 ? door * 0.4 : 0.12 + (door - 0.3) * 1.25;
  const blink = s > 1188 && s < 1192 ? 0.1 : 1;
  const lamp = Math.sin(frame * 0.8) * Math.sin(frame * 0.27) > 0.5 ? 0.25 : 1;
  const SHOTS: Shot[] = [
    { from: 0, to: 1000, keys: [[962, 340, 1240, 1.3], [1000, 420, 1250, 1.25]] },
    { from: 1000, to: 1028, keys: [[1000, kx + 250, 1250, 1.2]] },
    { from: 1028, to: 1064, keys: [[1028, 1240, 1150, 0.72], [1064, 1260, 1150, 0.74]] },
    { from: 1064, to: beats.carDoor[0], keys: [[1064, kx + 230, 1260, 1.2]] },
    { from: beats.carDoor[0], to: beats.eyes[0], keys: [[beats.carDoor[0], 1400, 1300, 1.45], [beats.eyes[0], 1470, 1320, 1.9]] },
    { from: beats.eyes[0], to: 2000, keys: [[beats.eyes[0], 1500, 1330, 2.5], [beats.card, 1505, 1330, 2.9]] },
  ];
  const cam = shotCamera(s, SHOTS);
  return (
    <g transform={cameraTransform(cam)}>
      <Alley frame={frame} lamp={lamp}>
        {walkerT > 0 && walkerT < 1 ? (
          <Zombie x={ALLEY.gap.x - 40 + walkerT * (ALLEY.gap.w + 80)} y={1330} scale={0.55} pose={walkPose(frame / 34, GAITS.shamble, zPose(frame, 5))} frame={frame} glow={1} color="#24161b" />
        ) : null}
        <Car x={150} y={g} color="#33465c" door={1} />
        <Car x={1180} y={g} color="#3d2a30" door={doorE}>
          {eyes > 0 ? (
            <g opacity={eyes}>
              {[1478, 1522].map((ex) => (
                <g key={ex} transform={`translate(${ex} 1322) scale(1 ${blink})`}>
                  <ellipse rx={11} ry={8} fill="#f4f1ea" />
                  <circle cx={2} r={4.5} fill="#111" />
                </g>
              ))}
            </g>
          ) : null}
        </Car>
        <Car x={2050} y={g} color="#3c4a3a" door={1} />
        <StickFigure pose={pose} x={kx} y={g} scale={1} frame={frame} flip={false} face={face(s >= beats.eyes[0] ? 1 : 0.8, s >= beats.eyes[0] ? 0.6 : 0)} />
      </Alley>
    </g>
  );
};

export const Part02: React.FC = () => {
  const frame = useCurrentFrame();
  const s = toStory(frame);
  const sceneStart = s >= SCENES.alley ? SCENES.alley : s >= SCENES.exterior ? SCENES.exterior : s >= SCENES.bath ? SCENES.bath : 0;
  // a few frames of black on every location change
  const dip = sceneStart > 0 ? 1 - clamp01((s - sceneStart) / 5) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#07080c" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Defs />
        {s < SCENES.bath ? <LivingRoom s={s} frame={frame} /> : s < SCENES.exterior ? <BathroomScene s={s} frame={frame} /> : s < SCENES.alley ? <ExteriorScene s={s} frame={frame} /> : <AlleyScene s={s} frame={frame} />}
        <rect width={1080} height={1920} fill="url(#vignette2)" />
        <rect width={1080} height={1920} fill="#000" opacity={dip} />
        <defs>
          <radialGradient id="vignette2" cx="50%" cy="50%" r="72%">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.6} />
          </radialGradient>
        </defs>
      </svg>
      <SeriesBadge frame={frame} part={2} title="THE WINDOW" until={Math.round(toOut(96))} />
      <Captions frame={frame} chunks={timeline.captions} />
      <PartCard frame={frame} from={Math.round(toOut(beats.card))} part={2} />
    </AbsoluteFill>
  );
};
