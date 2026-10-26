import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { GAITS, lerpPose, Pose, poseAt, POSES, Skeleton, StickFigure, walkPose } from "../../shared/rig";
import { ACTION, cameraTransform, clamp01, impulse, KAI, makeWarp, Shot, shotCamera, track } from "../kit";
import { Captions, PartCard, SeriesBadge, SPEAKERS } from "../Overlays";
import { Alley, ALLEY, Car, Dog } from "../sets";
import { Defs, Zombie } from "../world";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toStory, toOut } = makeWarp(timeline);
const G = ALLEY.ground;
const MIA_CAR = 1180;

// Poses (side view facing +x)
const P3 = {
  ...KAI,
  ...ACTION,
  handsUpSit: { ...ACTION.recoil, lUA: -140, lFA: -170, rUA: 140, rFA: 170 },
  handsUp: { ...POSES.stand, tilt: -4, lUA: -140, lFA: -170, rUA: 140, rFA: 170 },
  shrug: { ...POSES.stand, tilt: 10, lUA: -30, lFA: -100, rUA: 30, rFA: 100 },
  holdPipe: { ...POSES.stand, rUA: 20, rFA: 40 },
  // Mia with her bat (the bat angle is separate, see BAT)
  batReady: { ...POSES.stand, lean: 4, tilt: -4, duck: 0.2, lUA: -105, lFA: 55, rUA: -112, rFA: 62 },
  batSwing: { ...POSES.stand, lean: 16, tilt: 4, duck: 0.2, lUA: 75, lFA: 82, rUA: 82, rFA: 88, lTh: -24, lSh: -20, rTh: 26, rSh: 6 },
  batDown: { ...POSES.stand, lUA: 12, lFA: 24, rUA: 14, rFA: 26 },
  phoneUp: { ...POSES.stand, tilt: 8, lUA: 58, lFA: 162, rUA: 12, rFA: 24 },
  sad: { ...POSES.stand, tilt: 22, duck: 0.5, lUA: 22, lFA: 60, rUA: 12, rFA: 22 },
  point: { ...POSES.stand, lean: 6, rUA: 84, rFA: 90, lUA: -10, lFA: 0 },
  lunge: { ...POSES.stand, lean: 24, tilt: 10, lUA: 80, lFA: 88, rUA: 90, rFA: 96, lTh: -26, lSh: -24, rTh: 30, rSh: 8 },
} satisfies Record<string, Pose>;
type P3Pose = keyof typeof P3;

// Where Mia's bat points (degrees, rig convention) for each of her poses
const BAT: Partial<Record<P3Pose, number>> = { batReady: -150, batSwing: 95, batDown: 8, phoneUp: 8, sad: 4, point: 92, crouch: 40, stand: 10 };

const face = (worry: number, mouth = 0) => ({ worry, smile: 0, mouth, sweat: 0 });
const zPose = (frame: number, k: number): Pose => ({ ...POSES.stand, tilt: 14 + Math.sin(frame * 0.3 + k) * 6, lUA: 66, lFA: 78, rUA: 80, rFA: 88 });
const speedOf = (s: number, f: number[], v: number[]) => Math.abs(track(s + 1, f, v) - track(s - 1, f, v)) / 2;
const moving = (base: Pose, x: number, speed: number, flip: boolean) =>
  lerpPose(base, walkPose((flip ? -x : x) / (speed > 9 ? 300 : 190), speed > 9 ? GAITS.run : GAITS.walk, base), clamp01(speed / 3));

// Interpolated pose plus the bat angle that goes with it
const keyed = (s: number, keys: [number, P3Pose][]) => {
  const pose = poseAt<P3Pose>(s, keys, P3);
  let i = keys.findIndex(([f]) => f > s);
  if (i === -1) i = keys.length;
  const [f0, k0] = keys[Math.max(0, i - 1)];
  const [f1, k1] = keys[Math.min(keys.length - 1, i)];
  const t = f1 === f0 ? 1 : clamp01((s - f0) / (f1 - f0));
  const bat = (BAT[k0] ?? 10) + ((BAT[k1] ?? 10) - (BAT[k0] ?? 10)) * (t * t * (3 - 2 * t));
  return { pose, bat };
};

const Bat: React.FC<{ sk: Skeleton; angle: number }> = ({ sk, angle }) => {
  const r = (angle * Math.PI) / 180;
  const h = sk.rHand;
  const tip = { x: h.x + Math.sin(r) * 150, y: h.y + Math.cos(r) * 150 };
  return (
    <g>
      <line x1={h.x - Math.sin(r) * 14} y1={h.y - Math.cos(r) * 14} x2={tip.x} y2={tip.y} stroke="#b0844e" strokeWidth={13} strokeLinecap="round" />
      <line x1={h.x + Math.sin(r) * 60} y1={h.y + Math.cos(r) * 60} x2={tip.x} y2={tip.y} stroke="#b0844e" strokeWidth={20} strokeLinecap="round" />
    </g>
  );
};

const Phone: React.FC<{ sk: Skeleton; frame: number; show: number }> = ({ sk, frame, show }) => (
  <g transform={`translate(${sk.lHand.x} ${sk.lHand.y - 10})`}>
    <rect x={-13} y={-24} width={26} height={44} rx={5} fill="#0b0c10" stroke="#3a3f4a" strokeWidth={3} />
    {show > 0 && Math.floor(frame / 12) % 2 === 0 ? (
      <g opacity={show}>
        <rect x={-8} y={-6} width={14} height={8} fill="none" stroke="#FF3B30" strokeWidth={2} />
        <rect x={6} y={-4} width={2} height={4} fill="#FF3B30" />
      </g>
    ) : null}
  </g>
);

const SHOTS: Shot[] = [
  { from: 0, to: 88, keys: [[0, 1440, 1320, 2.2], [88, 1420, 1320, 2.0]] },
  { from: 88, to: 124, keys: [[88, 1320, 1300, 1.35], [124, 1300, 1300, 1.3]] },
  { from: 124, to: 222, keys: [[124, 1290, 1300, 1.2], [222, 1290, 1290, 1.25]] },
  { from: 222, to: 300, keys: [[222, 1300, 1250, 1.4], [300, 1320, 1250, 1.45]] },
  { from: 300, to: 400, keys: [[300, 1380, 1230, 1.9], [400, 1380, 1240, 2.1]] },
  { from: 400, to: 452, keys: [[400, 1560, 1250, 1.0], [452, 1480, 1250, 1.08]] },
  { from: 452, to: 520, keys: [[452, 1420, 1250, 1.15], [520, 1500, 1250, 1.2]] },
  { from: 520, to: 560, keys: [[520, 1480, 1250, 1.3], [560, 1480, 1250, 1.35]] },
  { from: 560, to: 800, keys: [[560, 1160, 1340, 1.6], [800, 1160, 1330, 1.7]] },
  { from: 800, to: 950, keys: [[800, 1120, 1250, 1.1], [950, 820, 1250, 1.05]] },
  { from: 950, to: 1000, keys: [[950, 140, 1380, 1.8], [1000, 150, 1380, 1.95]] },
  { from: 1000, to: 1080, keys: [[1000, 1810, 1270, 1.5], [1080, 1810, 1270, 1.75]] },
  { from: 1080, to: 1150, keys: [[1080, 1260, 1200, 0.72], [1150, 1160, 1200, 0.8]] },
  { from: 1150, to: 2000, keys: [[1150, 780, 1300, 1.6], [beats.card, 740, 1300, 1.75]] },
];

// The street crowd that turns at the bark and pours in through the gap
const CROWD = Array.from({ length: 9 }, (_, i) => ({ k: i, start: beats.pour[0] + i * 9, tx: 1000 + ((i * 137) % 600), sx: ALLEY.gap.x + 20 + ((i * 53) % 220) }));

export const Part03: React.FC = () => {
  const frame = useCurrentFrame();
  const s = toStory(frame);
  const cam = shotCamera(s, SHOTS);
  const hits = [beats.batSwing[1], beats.shove[1], beats.batHit].map(toOut);
  const kick = impulse(frame, hits, 4) * 14;

  // ---------- Kai ----------
  const KX = { f: [0, beats.yank[0], beats.shove[0], beats.shove[1], beats.hide - 1, beats.hide, beats.move[0], beats.move[1], 1100, beats.run, beats.card], v: [1180, 1180, 1300, 1380, 1380, 1000, 1000, 700, 700, 700, 470] };
  const kx = track(s, KX.f, KX.v);
  const kFlip = (s >= beats.move[0] && s < 1100) || s >= beats.run + 4;
  const kai = keyed(s, [
    [0, "recoil"],
    [100, "recoil"],
    [114, "handsUpSit"],
    [beats.standUp[0], "handsUpSit"],
    [beats.standUp[1], "handsUp"],
    [300, "stand"],
    [beats.yank[0], "stand"],
    [beats.yank[1], "pull"],
    [beats.shove[0] + 4, "push"],
    [beats.shove[1] + 6, "push"],
    [beats.pant[0], "stand"],
    [beats.hide - 1, "stand"],
    [beats.hide, "crouch"],
    [beats.shrug - 10, "crouch"],
    [beats.shrug, "shrug"],
    [beats.move[0] - 10, "shrug"],
    [beats.move[0], "stand"],
    [beats.pipe[1], "holdPipe"],
  ]);
  const kaiPose = moving(kai.pose, kx, speedOf(s, KX.f, KX.v), kFlip);
  const hasPipe = s >= beats.pipe[1];

  // ---------- Mia ----------
  const MX = { f: [beats.doorBurst[0], beats.batSwing[1], beats.yank[0], beats.yank[1], beats.batHit - 12, beats.batHit, beats.hide - 1, beats.hide, beats.move[0], beats.move[1], 1100, beats.run, beats.card], v: [1505, 1390, 1400, 1250, 1250, 1600, 1600, 1310, 1310, 820, 820, 820, 560] };
  const mx = track(s, MX.f, MX.v);
  const mFlip = s < 1100 || s >= beats.run + 4;
  const mia = keyed(s, [
    [0, "crouch"],
    [beats.doorBurst[0], "crouch"],
    [beats.batSwing[0], "batReady"],
    [beats.batSwing[1], "batSwing"],
    [beats.batSwing[1] + 16, "batReady"],
    [beats.phone[0] - 20, "batReady"],
    [beats.phone[0], "phoneUp"],
    [beats.sad[0], "phoneUp"],
    [beats.sad[1], "sad"],
    [beats.yank[0], "sad"],
    [beats.yank[1], "batReady"],
    [beats.batHit - 6, "batReady"],
    [beats.batHit, "batSwing"],
    [beats.pant[1], "batDown"],
    [beats.hide, "crouch"],
    [beats.dealPoint[0], "crouch"],
    [beats.dealPoint[0] + 10, "point"],
    [beats.dealPoint[1], "point"],
    [beats.dealPoint[1] + 14, "crouch"],
    [beats.move[0], "batDown"],
  ]);
  const miaPose = s < beats.hide ? mia.pose : moving(mia.pose, mx, speedOf(s, MX.f, MX.v), mFlip);
  const miaInCar = s < beats.doorBurst[1];

  // ---------- the lurker ----------
  const lzx = track(s, [beats.lurker[0], beats.lurker[1], beats.shove[1], beats.zFall[1]], [2150, 1480, 1580, 1660]);
  const lzFall = clamp01((s - beats.shove[1]) / (beats.zFall[1] - beats.shove[1]));
  const lurkerPose = s < beats.lurker[1] - 8 ? walkPose(frame / 30, GAITS.shamble, zPose(frame, 2)) : P3.lunge;

  // ---------- dog & crowd ----------
  const dogX = track(s, [930, 972], [-160, 60]);
  const barkAt = (b: number) => clamp01(1 - Math.abs(s - b - 3) / 5);
  const bark = Math.max(...beats.bark.map(barkAt));
  const turned = clamp01((s - beats.turn[0]) / (beats.turn[1] - beats.turn[0]));
  const lamp = Math.sin(frame * 0.8) * Math.sin(frame * 0.27) > 0.5 ? 0.3 : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: "#07080c" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Defs />
        <g transform={cameraTransform(cam, { x: kick * Math.sin(frame * 3.1), y: kick * 0.5 })}>
          <Alley frame={frame} lamp={lamp}>
            {/* the crowd in the street beyond the gap; at the bark they stop, turn, and come in */}
            {CROWD.map((c) => {
              const t = clamp01((s - c.start) / (beats.card - c.start));
              const inGap = s < c.start;
              const x = inGap ? c.sx + ((frame * 0.6 + c.k * 40) % 120) * (1 - turned) : c.sx + (c.tx - c.sx) * t;
              const y = inGap ? 1330 : 1330 + (G - 1330) * t;
              const sc = inGap ? 0.5 : 0.5 + 0.5 * t;
              const p = inGap && turned < 1 ? walkPose(frame / 34 + c.k, GAITS.shamble, zPose(frame, c.k)) : inGap ? { ...zPose(frame, c.k), tilt: 4 } : walkPose(frame / 28 + c.k, GAITS.shamble, zPose(frame, c.k));
              return <Zombie key={c.k} x={x} y={y} scale={sc} pose={p} frame={frame} glow={0.4 + 0.6 * turned} color="#24161b" flip={turned > 0.5} />;
            })}
            <Car x={150} y={G} color="#33465c" door={1} />
            <Car x={MIA_CAR} y={G} color="#3d2a30" door={s < beats.doorBurst[0] ? 0.62 : 1}>
              {miaInCar ? (
                <g>
                  {s < beats.doorBurst[0]
                    ? [1478, 1522].map((ex) => (
                        <g key={ex} transform={`translate(${ex} 1322) scale(1 ${s > 40 && s < 44 ? 0.1 : 1})`}>
                          <ellipse rx={11} ry={8} fill="#f4f1ea" />
                          <circle cx={2} r={4.5} fill="#111" />
                        </g>
                      ))
                    : null}
                </g>
              ) : null}
            </Car>
            <Car x={2050} y={G} color="#3c4a3a" door={1} />
            {!hasPipe && s > beats.move[0] - 40 ? <line x1={880} y1={G - 4} x2={1010} y2={G - 10} stroke="#6a6e76" strokeWidth={10} strokeLinecap="round" /> : null}
            {s > 920 ? <Dog x={dogX} y={G} scale={1} bark={bark} walk={s < 972 ? frame / 12 : 0} /> : null}
            {s >= beats.lurker[0] ? (
              <g transform={`rotate(${lzFall * 84} ${lzx} ${G})`}>
                <Zombie x={lzx} y={G} scale={1} pose={lurkerPose} frame={frame} glow={1 - lzFall * 0.7} color="#4d5646" flip />
              </g>
            ) : null}
            {!miaInCar ? (
              <StickFigure
                pose={miaPose}
                x={mx}
                y={G}
                scale={0.92}
                frame={frame}
                flip={mFlip}
                hair="ponytail"
                face={face(s > beats.sad[0] && s < beats.yank[0] ? 0.9 : 0.6, 0)}
                prop={(sk) => (
                  <>
                    <Bat sk={sk} angle={mia.bat} />
                    {s >= beats.phone[0] - 20 && s < beats.yank[0] ? <Phone sk={sk} frame={frame} show={clamp01((s - beats.phone[0]) / 10)} /> : null}
                  </>
                )}
              />
            ) : null}
            <StickFigure
              pose={kaiPose}
              x={kx}
              y={G}
              scale={1}
              frame={frame}
              flip={kFlip}
              face={face(s > beats.turn[0] ? 1 : s < beats.standUp[1] ? 1 : 0.6, s > beats.turn[1] ? 0.5 : 0)}
              prop={hasPipe ? (sk) => <line x1={sk.rHand.x} y1={sk.rHand.y} x2={sk.rHand.x + 30} y2={sk.rHand.y + 120} stroke="#6a6e76" strokeWidth={10} strokeLinecap="round" /> : undefined}
            />
          </Alley>
        </g>
        <rect width={1080} height={1920} fill="url(#vignette3)" />
        <defs>
          <radialGradient id="vignette3" cx="50%" cy="50%" r="72%">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.6} />
          </radialGradient>
        </defs>
      </svg>
      <SeriesBadge frame={frame} part={3} title="MIA" until={Math.round(toOut(80))} />
      <Captions frame={frame} chunks={timeline.captions} speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>} />
      <PartCard frame={frame} from={Math.round(toOut(beats.card))} part={3} />
    </AbsoluteFill>
  );
};
