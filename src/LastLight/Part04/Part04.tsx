import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import {
  GAITS,
  lerpPose,
  Pose,
  poseAt,
  POSES,
  skeleton,
  StickFigure,
  walkPose,
} from "../../shared/rig";
import {
  ACTION,
  cameraTransform,
  clamp01,
  handheld,
  impulse,
  KAI,
  makeWarp,
  Shot,
  shotCamera,
  track,
} from "../kit";
import { Captions, FONT, PartCard, SeriesBadge, SPEAKERS } from "../Overlays";
import {
  Alley,
  ALLEY,
  Car,
  DeadRiver,
  Dog,
  Fence,
  FENCE,
  Helicopter,
  NightSky,
  ROOF,
  RooftopView,
  Street,
  STREET,
  Walkie,
} from "../sets";
import { Defs, rand, Zombie } from "../world";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toStory, toOut } = makeWarp(timeline);

// Poses (side view facing +x)
const P4 = {
  ...KAI,
  ...ACTION,
  boost: { ...ACTION.crouch, lean: 20, lUA: 60, lFA: 20, rUA: 70, rFA: 25 },
  climbA: {
    ...POSES.stand,
    lean: 6,
    tilt: -8,
    lUA: 110,
    lFA: 150,
    rUA: 150,
    rFA: 176,
    lTh: 12,
    lSh: 6,
    rTh: 72,
    rSh: -18,
  },
  climbB: {
    ...POSES.stand,
    lean: 6,
    tilt: -8,
    lUA: 150,
    lFA: 176,
    rUA: 110,
    rFA: 150,
    lTh: 72,
    lSh: -18,
    rTh: 12,
    rSh: 6,
  },
  carry: { ...POSES.stand, lUA: 40, lFA: 112, rUA: 50, rFA: 120 },
  liftUp: {
    ...POSES.stand,
    lean: -4,
    tilt: -14,
    lUA: 160,
    lFA: 172,
    rUA: 168,
    rFA: 176,
  },
  reachDown: {
    ...POSES.stand,
    lean: 48,
    tilt: 14,
    duck: 0.3,
    lUA: 40,
    lFA: 20,
    rUA: 52,
    rFA: 28,
    lTh: -14,
    lSh: -10,
    rTh: 18,
    rSh: 4,
  },
  heave: {
    ...POSES.stand,
    lean: -20,
    tilt: -6,
    duck: 0.4,
    lUA: 30,
    lFA: 120,
    rUA: 40,
    rFA: 130,
    lTh: -22,
    lSh: -14,
    rTh: 30,
    rSh: 18,
  },
  pant: {
    ...POSES.stand,
    lean: 22,
    tilt: 12,
    duck: 0.4,
    lUA: 34,
    lFA: 8,
    rUA: 40,
    rFA: 14,
    lTh: 22,
    lSh: -12,
    rTh: 28,
    rSh: -8,
  },
  sitLedge: {
    lean: -2,
    tilt: 6,
    duck: 0.3,
    chest: 0.98,
    lUA: 30,
    lFA: 70,
    rUA: 35,
    rFA: 75,
    lTh: 84,
    lSh: 6,
    rTh: 92,
    rSh: 12,
  },
  pet: {
    lean: 4,
    tilt: 10,
    duck: 0.3,
    chest: 0.98,
    lUA: 30,
    lFA: 70,
    rUA: 72,
    rFA: 40,
    lTh: 84,
    lSh: 6,
    rTh: 92,
    rSh: 12,
  },
  radioUp: {
    lean: 0,
    tilt: -6,
    duck: 0.2,
    chest: 1,
    lUA: 50,
    lFA: 168,
    rUA: 35,
    rFA: 75,
    lTh: 84,
    lSh: 6,
    rTh: 92,
    rSh: 12,
  },
  lookOver: {
    lean: -2,
    tilt: -16,
    duck: 0.1,
    chest: 1,
    lUA: 30,
    lFA: 70,
    rUA: 35,
    rFA: 75,
    lTh: 84,
    lSh: 6,
    rTh: 92,
    rSh: 12,
  },
} satisfies Record<string, Pose>;
type P4Pose = keyof typeof P4;

const face = (worry: number, mouth = 0, smile = 0) => ({
  worry,
  smile,
  mouth,
  sweat: 0,
});
const zPose = (frame: number, k: number): Pose => ({
  ...POSES.stand,
  tilt: 14 + Math.sin(frame * 0.3 + k) * 6,
  lUA: 66,
  lFA: 78,
  rUA: 80,
  rFA: 88,
});
const zReachUp = (frame: number, k: number): Pose => ({
  ...POSES.stand,
  tilt: -10 + Math.sin(frame * 0.4 + k) * 6,
  lUA: -160 + Math.sin(frame * 0.5 + k) * 12,
  lFA: -170,
  rUA: 160 - Math.sin(frame * 0.45 + k) * 12,
  rFA: 172,
});
const speedOf = (s: number, f: number[], v: number[]) =>
  Math.abs(track(s + 1, f, v) - track(s - 1, f, v)) / 2;
const run = (base: Pose, x: number, speed: number, flip: boolean) =>
  lerpPose(
    base,
    walkPose(
      (flip ? -x : x) / (speed > 9 ? 300 : 190),
      speed > 9 ? GAITS.run : GAITS.walk,
      base,
    ),
    clamp01(speed / 3),
  );
// alternating climbing pose, driven by how far up the climber is
const climbing = (y: number): Pose =>
  lerpPose(P4.climbA, P4.climbB, 0.5 + 0.5 * Math.sin(y / 38));
// where to stand a figure so its hip sits at `hipY` (for sitting on a ledge)
const seatY = (pose: Pose, hipY: number, scale = 1) =>
  hipY - skeleton(pose).hip.y * scale;

// ================= Scene 1: the chase down the alley, the fence =================
const HORDE_A = Array.from({ length: 12 }, (_, i) => ({
  k: i,
  start: 1100 + i * 70,
  stop: FENCE.x + FENCE.w + 30 + (i % 4) * 46,
  arrive: 190 + i * 6,
  back: i % 3 === 2,
}));

const AlleyChase: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const G = ALLEY.ground;
  const fenceTop = FENCE.top;
  const BX = {
    f: [0, beats.dogThrough[0], beats.dogThrough[1], 300],
    v: [60, FENCE.x + 40, FENCE.x - 90, FENCE.x - 130],
  };
  const MX = {
    f: [0, 100, beats.boost[0], beats.miaOver[0], beats.miaOver[1], 300],
    v: [560, -120, -150, FENCE.x + 30, FENCE.x - 80, FENCE.x - 170],
  };
  const KX = {
    f: [
      0,
      106,
      beats.boost[0],
      beats.kaiClimb[0],
      beats.kaiClimb[1],
      beats.kaiDrop[1],
      300,
    ],
    v: [
      700,
      -60,
      -110,
      FENCE.x + 70,
      FENCE.x + 50,
      FENCE.x - 130,
      FENCE.x - 130,
    ],
  };
  const bx = track(s, BX.f, BX.v);
  const mx = track(s, MX.f, MX.v);
  const kx = track(s, KX.f, KX.v);
  // Mia goes up Kai's hands and over; Kai climbs with hands grabbing at his legs, then drops
  const my =
    s < beats.boost[0]
      ? G
      : s < beats.miaOver[0]
        ? track(s, [beats.boost[0], beats.miaOver[0]], [G, fenceTop + 30])
        : track(
            s,
            [beats.miaOver[0], beats.miaOver[0] + 6, beats.miaOver[1]],
            [fenceTop + 30, fenceTop - 20, G],
          );
  const ky =
    s < beats.kaiClimb[0]
      ? G
      : s < beats.kaiClimb[1]
        ? track(s, [beats.kaiClimb[0], beats.kaiClimb[1]], [G, fenceTop + 20])
        : track(
            s,
            [beats.kaiClimb[1], beats.kaiDrop[0] + 4, beats.kaiDrop[1]],
            [fenceTop + 20, fenceTop - 20, G],
          );
  const miaPose =
    s < beats.boost[0]
      ? run(POSES.stand, mx, speedOf(s, MX.f, MX.v), true)
      : s < beats.miaOver[1]
        ? climbing(my)
        : lerpPose(ACTION.land, P4.pant, clamp01((s - beats.miaOver[1]) / 20));
  const kaiPose =
    s < beats.boost[0] - 4
      ? run(POSES.stand, kx, speedOf(s, KX.f, KX.v), true)
      : s < beats.kaiClimb[0]
        ? P4.boost
        : s < beats.kaiDrop[0]
          ? {
              ...climbing(ky),
              lTh:
                s > beats.kick - 4 && s < beats.kick + 6
                  ? 70
                  : climbing(ky).lTh,
            }
          : lerpPose(
              ACTION.land,
              P4.pant,
              clamp01((s - beats.kaiDrop[1]) / 20),
            );
  const dogBark =
    s > beats.dogThrough[1] ? Math.max(0, Math.sin(frame * 0.5)) : 0;
  const hits = beats.fenceHits.map(toOut);
  const fenceShake = impulse(frame, hits, 4) + (s > 190 ? 0.15 : 0);

  const leadT = clamp01(s / HORDE_A[0].arrive);
  const leadX =
    HORDE_A[0].start +
    (HORDE_A[0].stop - HORDE_A[0].start) * (1 - (1 - leadT) * (1 - leadT));
  const follow = (
    z: number,
    off: number,
    fy: number,
  ): [number, number, number, number] => [s, (kx + mx) / 2 + off, fy, z];
  const SHOTS: Shot[] = [
    {
      from: 0,
      to: 20,
      keys: [
        [0, 700, 1230, 2.8],
        [20, (kx + mx) / 2 + 60, 1300, 1.9],
      ],
    },
    { from: 20, to: 40, keys: [[s, bx + 90, 1420, 2.3]] },
    { from: 40, to: 70, keys: [follow(0.85, 260, 1180)] },
    { from: 70, to: 96, keys: [[s, leadX - 60, 1270, 1.7]] },
    {
      from: 96,
      to: 130,
      keys: [
        [96, -60, 1250, 1.0],
        [130, -170, 1260, 1.25],
      ],
    },
    {
      from: 130,
      to: 155,
      keys: [
        [130, -200, 1250, 1.6],
        [155, -210, 1200, 1.65],
      ],
    },
    {
      from: 155,
      to: 180,
      keys: [
        [155, -260, 1100, 1.3],
        [180, -280, 1120, 1.35],
      ],
    },
    { from: 180, to: 205, keys: [[s, FENCE.x + 50, ky - 200, 1.7]] },
    {
      from: 205,
      to: 234,
      keys: [
        [205, FENCE.x + 90, 1340, 2.0],
        [234, FENCE.x + 70, 1320, 2.15],
      ],
    },
    {
      from: 234,
      to: 262,
      keys: [
        [234, -320, 1250, 1.2],
        [262, -300, 1250, 1.3],
      ],
    },
    {
      from: 262,
      to: 282,
      keys: [
        [262, FENCE.x + 70, 1250, 2.1],
        [282, FENCE.x + 60, 1240, 2.3],
      ],
    },
    {
      from: 282,
      to: 400,
      keys: [
        [282, FENCE.x - 150, 1310, 1.9],
        [300, FENCE.x - 150, 1300, 2.05],
      ],
    },
  ];
  const cam = shotCamera(s, SHOTS);
  const kick = impulse(frame, [toOut(beats.kick), ...hits], 4) * 12;
  return (
    <g
      transform={cameraTransform(
        cam,
        handheld(frame, 1.6, { x: kick * Math.sin(frame * 3), y: kick * 0.4 }),
      )}
    >
      <Alley
        frame={frame}
        lamp={Math.sin(frame * 1.3) * Math.sin(frame * 0.41) > 0.2 ? 0.1 : 1}
      >
        <Car x={150} y={G} color="#33465c" door={1} />
        <Car x={1180} y={G} color="#3d2a30" door={1} />
        {HORDE_A.map((z) => {
          const t = clamp01(s / z.arrive);
          const x = z.start + (z.stop - z.start) * (1 - (1 - t) * (1 - t));
          const atFence = t >= 1;
          const pose = atFence
            ? s > beats.grab[0] && s < beats.kaiDrop[0] && z.k < 3
              ? zReachUp(frame, z.k)
              : {
                  ...zReachUp(frame, z.k),
                  lUA: 60,
                  lFA: 70 + Math.sin(frame * 0.6 + z.k) * 30,
                }
            : walkPose(frame / 16 + z.k, GAITS.run, zPose(frame, z.k));
          const knocked =
            z.k === 0 && s > beats.kick
              ? clamp01((s - beats.kick) / 8) *
                (1 - clamp01((s - beats.kick - 20) / 20))
              : 0;
          return (
            <Zombie
              key={z.k}
              x={x + knocked * 60}
              y={z.back ? G - 30 : G}
              scale={z.back ? 0.85 : 1}
              pose={{ ...pose, lean: pose.lean - knocked * 30 }}
              frame={frame}
              glow={1}
              color={z.back ? "#2a1a1f" : "#3f4739"}
              flip
            />
          );
        })}
        <Fence shake={fenceShake} frame={frame} />
        <Dog
          x={bx}
          y={G}
          scale={0.85}
          bark={dogBark}
          walk={speedOf(s, BX.f, BX.v) > 0.5 ? frame / 7 : 0}
          flip
        />
        <StickFigure
          pose={miaPose}
          x={mx}
          y={my}
          scale={0.92}
          frame={frame}
          flip={s < beats.miaOver[1]}
          hair="ponytail"
          face={face(1, 0.4)}
        />
        <StickFigure
          pose={kaiPose}
          x={kx}
          y={ky}
          scale={1}
          frame={frame}
          flip={s < beats.kaiDrop[1]}
          face={face(1, 0.5)}
        />
      </Alley>
    </g>
  );
};

// ================= Scene 2: the street, the ladder =================
const StreetScene: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const G = STREET.ground;
  const R = STREET.roof;
  const lx = STREET.ladderX + 27;
  const MX = {
    f: [300, 404, beats.miaUp[1], beats.miaUp[1] + 6],
    v: [-420, 1390, lx, lx + 70],
  };
  const KX = {
    f: [300, 404, beats.kaiUp[1], beats.kaiUp[1] + 6],
    v: [-300, 1330, lx, lx - 40],
  };
  const BX = { f: [300, 400], v: [-360, 1290] };
  const mx = track(s, MX.f, MX.v);
  const kx =
    s < beats.kaiUp[0]
      ? track(s, KX.f.slice(0, 2), KX.v.slice(0, 2))
      : track(s, KX.f, KX.v);
  const my =
    s < beats.miaUp[0] ? G : track(s, [beats.miaUp[0], beats.miaUp[1]], [G, R]);
  const ky =
    s < beats.kaiUp[0] ? G : track(s, [beats.kaiUp[0], beats.kaiUp[1]], [G, R]);
  const miaPose =
    s < beats.miaUp[0]
      ? run(POSES.stand, mx, speedOf(s, MX.f, MX.v), false)
      : s < beats.miaUp[1]
        ? climbing(my)
        : s < beats.pullUp[0]
          ? P4.reachDown
          : P4.heave;
  const kaiPose =
    s < 404
      ? run(POSES.stand, kx, speedOf(s, KX.f, KX.v), false)
      : s < beats.passDog[0]
        ? P4.carry
        : s < beats.kaiUp[0]
          ? lerpPose(P4.carry, P4.liftUp, clamp01((s - beats.passDog[0]) / 14))
          : s < beats.kaiUp[1]
            ? climbing(ky)
            : P4.heave;
  // Biscuit: runs, is carried, lifted up to Mia, then sits on the roof
  const dogUp = clamp01(
    (s - beats.passDog[0]) / (beats.passDog[1] - beats.passDog[0]),
  );
  const dx =
    s < 404 ? track(s, BX.f, BX.v) : s < beats.passDog[1] ? kx + 40 : lx + 140;
  const dy =
    s < 404 ? G : s < beats.passDog[1] ? G - 200 - dogUp * (G - R - 140) : R;
  const ladderBottom = track(
    s,
    [beats.pullUp[0], beats.pullUp[1]],
    [1380, 980],
  );
  const pullKick =
    impulse(
      frame,
      [toOut(beats.pullUp[0] + 8), toOut(beats.pullUp[0] + 24)],
      4,
    ) * 10;
  // the dead close in from both ends of the street
  const left = Array.from({ length: 9 }, (_, i) => ({
    k: i,
    x: track(
      s,
      [300, 430, beats.zArrive[0], beats.pullUp[1]],
      [-1100 - i * 90, 500 + i * 45, 900 + i * 40, 1230 + (i % 3) * 50],
    ),
  }));
  const right = Array.from({ length: 7 }, (_, i) => ({
    k: 20 + i,
    x: track(
      s,
      [300, 430, beats.zArrive[1], beats.pullUp[1]],
      [2900 + i * 80, 2000 + i * 60, 1700 + i * 60, 1560 + (i % 3) * 40],
    ),
  }));
  const atLadder = (x: number) =>
    Math.abs(x - lx) < 260 && s > beats.zArrive[0];
  const SHOTS: Shot[] = [
    { from: 0, to: 404, keys: [[s, (kx + mx) / 2 + 120, 1150, 0.8]] },
    {
      from: 404,
      to: beats.passDog[0],
      keys: [
        [404, lx - 20, 1220, 1.1],
        [beats.passDog[0], lx, Math.min(1200, my - 120), 1.05],
      ],
    },
    {
      from: beats.passDog[0],
      to: beats.kaiUp[0],
      keys: [
        [beats.passDog[0], lx + 30, 1000, 1.2],
        [beats.kaiUp[0], lx + 40, 880, 1.2],
      ],
    },
    {
      from: beats.kaiUp[0],
      to: beats.pullUp[0],
      keys: [[s, lx + 20, Math.min(1180, ky - 160), 1.0]],
    },
    {
      from: beats.pullUp[0],
      to: 700,
      keys: [
        [beats.pullUp[0], lx + 20, 820, 1.35],
        [620, lx + 20, 860, 1.45],
      ],
    },
  ];
  const cam = shotCamera(s, SHOTS);
  return (
    <g
      transform={cameraTransform(
        cam,
        handheld(frame, 1.6, {
          x: pullKick * Math.sin(frame * 3),
          y: pullKick,
        }),
      )}
    >
      <Street frame={frame} ladderBottom={ladderBottom}>
        {[...left, ...right].map((z) => (
          <Zombie
            key={z.k}
            x={z.x}
            y={G - (z.k % 2) * 20}
            scale={z.k % 2 ? 0.88 : 1}
            pose={
              atLadder(z.x)
                ? zReachUp(frame, z.k)
                : walkPose(frame / 18 + z.k, GAITS.run, zPose(frame, z.k))
            }
            frame={frame}
            glow={1}
            color={z.k % 2 ? "#2a1a1f" : "#3f4739"}
            flip={z.k < 20}
          />
        ))}
        <Dog
          x={dx}
          y={dy}
          scale={0.85}
          bark={0}
          walk={s < 404 ? frame / 7 : 0}
        />
        <StickFigure
          pose={miaPose}
          x={mx}
          y={my}
          scale={0.92}
          frame={frame}
          flip={s >= beats.miaUp[1]}
          hair="ponytail"
          face={face(1, 0.4)}
        />
        <StickFigure
          pose={kaiPose}
          x={kx}
          y={ky}
          scale={1}
          frame={frame}
          face={face(1, 0.5)}
        />
      </Street>
    </g>
  );
};

// ================= Scene 3: the rooftop, the river, the radio =================
const LOOKER_X = 640;
const RooftopScene: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  const L = ROOF.ledge;
  const night = track(s, [700, beats.timeLapse[1]], [0, 1]);
  const moonY = track(s, [beats.timeLapse[0], 1240], [980, 360]);
  const kaiKeys: [number, P4Pose][] = [
    [620, "pant"],
    [beats.collapse[1], "sitLedge"],
    [1024, "sitLedge"],
    [1034, "lookOver"],
    [1052, "sitLedge"],
    [beats.stare[0], "sitLedge"],
    [beats.stare[0] + 10, "lookOver"],
  ];
  const miaKeys: [number, P4Pose][] = [
    [620, "pant"],
    [beats.collapse[1], "sitLedge"],
    [beats.pet[0], "sitLedge"],
    [beats.pet[0] + 12, "pet"],
    [beats.pet[1], "pet"],
    [beats.pet[1] + 12, "sitLedge"],
    [beats.grabRadio[0], "sitLedge"],
    [beats.grabRadio[1], "radioUp"],
  ];
  const heave = s < 700 ? Math.sin(frame * 0.5) * 6 : 0;
  const kaiPose = {
    ...poseAt<P4Pose>(s, kaiKeys, P4),
    lean: poseAt<P4Pose>(s, kaiKeys, P4).lean + heave,
  };
  const petting = s > beats.pet[0] + 2 && s < beats.pet[1];
  const miaBase = poseAt<P4Pose>(s, miaKeys, P4);
  const miaPose = petting
    ? {
        ...miaBase,
        rUA: miaBase.rUA + Math.sin(frame * 0.35) * 16,
        rFA: miaBase.rFA + Math.sin(frame * 0.35) * 22,
      }
    : miaBase;
  const sit = clamp01(
    (s - beats.collapse[0]) / (beats.collapse[1] - beats.collapse[0]),
  );
  // standing on the roof, then easing down onto the ledge
  const kyy = L + (seatY(kaiPose, L) - L) * sit;
  const myy = L + (seatY(miaPose, L, 0.92) - L) * sit;
  const heliT = clamp01((s - beats.heli[0]) / (beats.heli[1] - beats.heli[0]));
  const heliX = 1700 - heliT * 2400;
  const beam = clamp01(Math.min(heliT * 4, (1 - heliT) * 4));
  // the searchlight sweeps across the rooftop on its way past, then moves on
  const overUs = s > 918 && s < 946;
  const beamX = overUs ? track(s, [918, 946], [900, 150]) : heliX - 80;
  const beamY = overUs ? L - 60 : 1260;
  const live = s >= beats.radio ? 1 : 0;
  const hold = clamp01(
    (s - beats.grabRadio[0]) / (beats.grabRadio[1] - beats.grabRadio[0]),
  );
  const radioShake = live ? Math.sin(frame * 2.3) * 2 : 0;
  const KX = 430;
  const MX = 570;
  // quiet-stretch events: one of the dead looks up at them, a shooting star, a far explosion
  const looks = clamp01((s - 986) / 6);
  const star = clamp01((s - 1012) / 14);
  const blast = track(s, [1062, 1066, 1096], [0, 1, 0]);
  const SHOTS: Shot[] = [
    {
      from: 0,
      to: 640,
      keys: [
        [620, 560, 1150, 0.8],
        [640, 560, 1170, 0.86],
      ],
    },
    {
      from: 640,
      to: 660,
      keys: [
        [640, 500, 1250, 2.1],
        [660, 500, 1260, 2.25],
      ],
    },
    {
      from: 660,
      to: 700,
      keys: [
        [660, 470, 1290, 2.0],
        [700, 520, 1290, 2.2],
      ],
    },
    {
      from: 700,
      to: 740,
      keys: [
        [700, 100, 1250, 2.2],
        [740, 450, 1250, 2.2],
      ],
    },
    {
      from: 740,
      to: 780,
      keys: [
        [740, 900, 1240, 2.6],
        [780, 1200, 1240, 2.6],
      ],
    },
    {
      from: 780,
      to: 815,
      keys: [
        [780, 560, 950, 0.8],
        [815, 560, 980, 0.86],
      ],
    },
    {
      from: 815,
      to: 850,
      keys: [
        [815, 820, 520, 1.6],
        [850, 820, 470, 1.7],
      ],
    },
    {
      from: 850,
      to: 890,
      keys: [
        [850, 800, 700, 0.85],
        [890, 650, 760, 0.9],
      ],
    },
    { from: 890, to: 918, keys: [[890, heliX - 80, 1240, 1.8]] },
    {
      from: 918,
      to: 950,
      keys: [
        [918, 520, 1290, 2.2],
        [950, 500, 1280, 2.35],
      ],
    },
    {
      from: 950,
      to: 966,
      keys: [
        [950, 640, 1290, 2.2],
        [966, 650, 1290, 2.3],
      ],
    },
    {
      from: 966,
      to: 985,
      keys: [
        [966, MX + 150, 1310, 3.0],
        [985, MX + 160, 1300, 3.2],
      ],
    },
    {
      from: 985,
      to: 1004,
      keys: [
        [985, LOOKER_X, 1250, 3.4],
        [1004, LOOKER_X, 1240, 3.7],
      ],
    },
    {
      from: 1004,
      to: 1030,
      keys: [
        [1004, 600, 700, 0.9],
        [1030, 610, 730, 0.93],
      ],
    },
    {
      from: 1030,
      to: 1050,
      keys: [
        [1030, KX, 1280, 2.6],
        [1050, KX, 1275, 2.8],
      ],
    },
    {
      from: 1050,
      to: 1100,
      keys: [
        [1050, 560, 1180, 1.0],
        [1100, 540, 1220, 1.25],
      ],
    },
    {
      from: 1100,
      to: 1134,
      keys: [
        [1100, MX - 20, 1330, 3.0],
        [1134, MX - 20, 1320, 3.2],
      ],
    },
    {
      from: 1134,
      to: 1170,
      keys: [
        [1134, MX, 1250, 2.4],
        [1170, MX, 1240, 2.6],
      ],
    },
    {
      from: 1170,
      to: beats.stare[0],
      keys: [
        [1170, MX - 60, 1270, 2.0],
        [beats.stare[0], MX - 60, 1265, 2.2],
      ],
    },
    {
      from: beats.stare[0],
      to: 2000,
      keys: [
        [beats.stare[0], 500, 1260, 2.4],
        [beats.card, 500, 1260, 2.6],
      ],
    },
  ];
  const cam = shotCamera(s, SHOTS);
  return (
    <g transform={cameraTransform(cam, handheld(frame, 1.6))}>
      <NightSky
        t={night}
        frame={frame}
        moonY={moonY}
        drift={
          frame * 0.3 +
          14 *
            (Math.min(Math.max(s, beats.timeLapse[0]), beats.timeLapse[1]) -
              beats.timeLapse[0])
        }
      />
      {star > 0 && star < 1 ? (
        <line
          x1={1150 - star * 900}
          y1={180 + star * 340}
          x2={1150 - star * 900 + 160}
          y2={180 + star * 340 - 60}
          stroke="#fff"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={1 - star}
        />
      ) : null}
      <RooftopView frame={frame} night={night}>
        <DeadRiver
          frame={frame}
          flow={
            frame +
            4 *
              (Math.min(Math.max(s, beats.timeLapse[0]), beats.timeLapse[1]) -
                beats.timeLapse[0])
          }
        />
        {s > 970 && s < 1010 ? (
          <g>
            <Zombie
              x={LOOKER_X}
              y={ROOF.street[1] - 14}
              scale={0.32}
              pose={{
                ...POSES.stand,
                tilt: -32 * looks,
                lUA: 20,
                lFA: 10,
                rUA: 30,
                rFA: 20,
              }}
              frame={frame}
              glow={1}
              color="#0d090c"
            />
            <circle
              cx={LOOKER_X + 4}
              cy={ROOF.street[1] - 14 - 108}
              r={26 * looks}
              fill="#B6FF5C"
              opacity={0.35 * looks}
              filter="url(#soft)"
            />
          </g>
        ) : null}
        <ellipse
          cx={-150}
          cy={760}
          rx={520 * (0.6 + blast)}
          ry={420 * (0.6 + blast)}
          fill="#ff8a3d"
          opacity={0.7 * blast}
          filter="url(#soft)"
        />
        {s > beats.heli[0] && s < beats.heli[1] ? (
          <Helicopter
            x={heliX}
            y={420 + Math.sin(frame * 0.1) * 10}
            frame={frame}
            beam={beam}
            beamX={beamX}
            beamY={beamY}
          />
        ) : null}
      </RooftopView>
      <Dog
        x={MX + 130}
        y={L}
        scale={0.75}
        bark={s > 966 && s < 990 ? Math.abs(Math.sin(frame * 0.45)) * 0.8 : 0}
        walk={s > beats.pet[0] && s < beats.pet[1] ? frame / 10 : 0}
      />
      <StickFigure
        pose={kaiPose}
        x={KX}
        y={kyy}
        scale={1}
        frame={frame}
        face={face(
          s > beats.radio ? 0.9 : 0.6,
          0,
          s > beats.pet[0] && s < beats.pet[1] ? 0.4 : 0,
        )}
      />
      <StickFigure
        pose={miaPose}
        x={MX}
        y={myy}
        scale={0.92}
        frame={frame}
        hair="ponytail"
        face={face(
          s > beats.radio ? 0.9 : 0.5,
          0,
          s > beats.pet[0] && s < beats.pet[1] ? 0.6 : 0,
        )}
        prop={(sk) => {
          const hip = { x: sk.hip.x - 18, y: sk.hip.y - 10 };
          const hand = sk.lHand;
          return (
            <Walkie
              x={hip.x + (hand.x - hip.x) * hold + radioShake}
              y={hip.y + (hand.y - hip.y) * hold}
              live={live}
              frame={frame}
              angle={-10 * hold}
            />
          );
        }}
      />
      <rect
        x={-1600}
        y={-1600}
        width={4400}
        height={4400}
        fill="#ff7a2d"
        opacity={0.22 * blast}
      />
    </g>
  );
};

// Radio interference: a few frames of static bands across the picture when the walkie crackles
const GLITCHES = [
  [1100, 1106],
  [1150, 1155],
  [1172, 1176],
  [1210, 1214],
];
const StaticGlitch: React.FC<{ s: number; frame: number }> = ({ s, frame }) => {
  if (!GLITCHES.some(([a, b]) => s >= a && s < b)) return null;
  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", pointerEvents: "none" }}
    >
      {Array.from({ length: 16 }, (_, i) => (
        <rect
          key={i}
          x={0}
          y={rand(frame * 7 + i) * 1920}
          width={1080}
          height={4 + rand(frame * 3 + i) * 40}
          fill={i % 3 ? "#ffffff" : "#7fe3ff"}
          opacity={0.12 + rand(frame + i * 11) * 0.25}
        />
      ))}
    </svg>
  );
};

// The hours passing on the rooftop, as a clock counting up through the night
const NightClock: React.FC<{ s: number }> = ({ s }) => {
  if (s < beats.timeLapse[0] - 10 || s >= beats.radio) return null;
  const minutes = 21 * 60 + 40 + (s - beats.roof) * 0.75;
  const clock = `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(Math.floor(minutes % 60)).padStart(2, "0")}`;
  return (
    <div
      style={{
        position: "absolute",
        top: 170,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 64,
        color: "#cfd8ff",
        letterSpacing: 6,
        opacity:
          clamp01((s - beats.timeLapse[0] + 10) / 10) *
          (1 - clamp01((s - beats.radio + 12) / 12)),
        textShadow: "0 0 18px rgba(120,150,255,0.7)",
      }}
    >
      {clock}
    </div>
  );
};

export const Part04: React.FC = () => {
  const frame = useCurrentFrame();
  const s = toStory(frame);
  const sceneStart =
    s >= beats.roof ? beats.roof : s >= beats.street ? beats.street : 0;
  const dip = sceneStart > 0 ? 1 - clamp01((s - sceneStart) / 4) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#07080c" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Defs />
        {s < beats.street ? (
          <AlleyChase s={s} frame={frame} />
        ) : s < beats.roof ? (
          <StreetScene s={s} frame={frame} />
        ) : (
          <RooftopScene s={s} frame={frame} />
        )}
        <rect width={1080} height={1920} fill="url(#vignette4)" />
        <rect width={1080} height={1920} fill="#000" opacity={dip} />
        <defs>
          <radialGradient id="vignette4" cx="50%" cy="50%" r="72%">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.6} />
          </radialGradient>
        </defs>
      </svg>
      <StaticGlitch s={s} frame={frame} />
      <NightClock s={s} />
      <SeriesBadge
        frame={frame}
        part={4}
        title="THE HORDE"
        until={Math.round(toOut(70))}
      />
      <Captions
        frame={frame}
        chunks={timeline.captions}
        speakers={
          episode.captions.speakers as Record<string, keyof typeof SPEAKERS>
        }
        broadcast={["voice"]}
      />
      <PartCard
        frame={frame}
        from={Math.round(toOut(beats.card))}
        part={4}
        embers
      />
    </AbsoluteFill>
  );
};
