import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { lerpPose, Pose, POSES, skeleton, StickFigure } from "../../shared/rig";
import { cameraTransform, clamp01, handheld, impulse, KAI, makeWarp, track } from "../../LastLight/kit";
import { face, moving, speedOf } from "../../LastLight/bridge";
import { Captions, SPEAKERS } from "../../LastLight/Overlays";
import { Defs0 } from "../elevator";
import { ControlRoom, CTRL } from "../control";
import { Badge0, ChoiceCards, DoorTimer, EndCard0, HookText, Lives } from "../ui";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toOut, toStory } = makeWarp(timeline);
const EMPH = timeline.captions.flatMap((c) => c.words.filter((w) => w.emph).map((w) => w.frame));

const F = CTRL.floor;
const TX = 560;
const SC = 1.45;
const SCREEN = { x: 380, y: 640, w: 136, h: 114 };
const CENTRE = { x: SCREEN.x + SCREEN.w / 2, y: SCREEN.y + SCREEN.h / 2 };
const HEAD = (() => {
  const sk = skeleton(KAI.watch);
  return { x: TX + sk.head.x * SC, y: F + 34 + sk.head.y * SC };
})();
const HATCH = { x: 210, w: 240, y: 60 };
const LAMPS = [580, 840, 1080];
const BURST = 0;

type Shot0 = { from: number; to: number; keys: [number, number, number, number][] };
const SHOTS: Shot0[] = [
  // the biggest event first: the whole wall of Theos turning to look out at him
  { from: 0, to: 20, keys: [[0, 448, 560, 2.6], [20, 448, 560, 2.2]] },
  { from: 20, to: 60, keys: [[20, 440, 600, 0.72], [60, 440, 640, 0.66]] },
  { from: 60, to: 110, keys: [[60, HEAD.x + 20, HEAD.y, 2.4], [110, HEAD.x + 20, HEAD.y, 2.6]] },
  { from: 110, to: 180, keys: [[110, 560, 1130, 1.5], [180, 560, 1130, 1.7]] },
  { from: 180, to: 260, keys: [[180, HEAD.x + 30, HEAD.y, 2.4], [260, HEAD.x + 30, HEAD.y, 2.8]] },
  { from: 260, to: 372, keys: [[260, CENTRE.x, CENTRE.y + 40, 3.0], [300, CENTRE.x, CENTRE.y, 6.5], [372, CENTRE.x, CENTRE.y, 7.2]] },
  { from: 372, to: 450, keys: [[372, LAMPS[BURST], 320, 1.5], [450, 640, 620, 1.0]] },
  { from: 450, to: 520, keys: [[450, HEAD.x + 20, HEAD.y, 2.2], [520, HEAD.x + 20, HEAD.y, 2.6]] },
  { from: 520, to: 592, keys: [[520, 440, 640, 0.66], [592, 440, 620, 0.72]] },
  { from: 592, to: 705, keys: [[592, HATCH.x + 80, 380, 1.3], [705, HATCH.x + 120, 760, 0.85]] },
  { from: 705, to: 790, keys: [[705, -130, 1130, 1.0], [790, -100, 1130, 1.15]] },
  { from: 790, to: 900, keys: [[790, CENTRE.x, CENTRE.y + 40, 2.5], [900, CENTRE.x, CENTRE.y, 6.8]] },
  { from: 900, to: 9999, keys: [[900, 160, 1050, 0.82], [990, 170, 1060, 0.95]] },
];
const camOf = (s: number) => {
  const shot = SHOTS.find((sh) => s >= sh.from && s < sh.to) ?? SHOTS[SHOTS.length - 1];
  const f = shot.keys.map((k) => k[0]);
  const at = (i: number) => track(s, f, shot.keys.map((k) => k[i]));
  return { fx: at(1), fy: at(2), z: at(3) };
};

const MIC: Pose = { ...KAI.watch, tilt: 10, duck: 0.2, rUA: 118, rFA: 40 };
const PLEAD: Pose = { ...MIC, lean: 12, tilt: 16, lUA: -40, lFA: -90 };
const LISTEN: Pose = { ...KAI.watch, tilt: 12, rUA: 150, rFA: 80 };
const LOOKUP: Pose = { ...POSES.stand, lean: -8, tilt: -34, duck: 0.1, lUA: -30, lFA: -20, rUA: 30, rFA: 20 };
const TORN: Pose = { ...POSES.stand, lean: 4, tilt: 6, duck: 0.3, rUA: 70, rFA: 86, lUA: -62, lFA: -74, lTh: -14, lSh: -6, rTh: 14, rSh: 4 };

// The headset on Theo's head (head centre at 0,0, radius 30), mic light live.
const Headset: React.FC<{ live: number }> = ({ live }) => (
  <g>
    <path d="M -36 -2 A 36 36 0 0 1 36 -2" fill="none" stroke="#c9ced6" strokeWidth={8} />
    <rect x={-46} y={-14} width={20} height={34} rx={8} fill="#c9ced6" />
    <rect x={26} y={-14} width={20} height={34} rx={8} fill="#c9ced6" />
    <line x1={38} y1={14} x2={66} y2={30} stroke="#c9ced6" strokeWidth={4} />
    {live > 0 ? <circle cx={70} cy={32} r={60} fill="url(#redGlow0)" opacity={live} /> : null}
    <circle cx={70} cy={32} r={7} fill="#ff2a1a" opacity={0.25 + 0.75 * live} filter="url(#glow0)" />
  </g>
);

// A ceiling lamp hanging over the wall
const Lamp: React.FC<{ x: number; on: boolean; frame: number }> = ({ x, on, frame }) => (
  <g transform={`rotate(${Math.sin(frame * 0.07 + x) * 2} ${x} ${HATCH.y})`}>
    <line x1={x} y1={HATCH.y} x2={x} y2={170} stroke="#111" strokeWidth={4} />
    {on ? <circle cx={x} cy={214} r={150} fill="url(#goldGlow0)" opacity={0.45} /> : null}
    <path d={`M ${x - 36} 200 L ${x - 20} 168 L ${x + 20} 168 L ${x + 36} 200 Z`} fill="#2b2f36" />
    <circle cx={x} cy={208} r={15} fill={on ? "#FFE08A" : "#2a2c31"} filter={on ? "url(#glow0)" : undefined} />
  </g>
);

export const Part07: React.FC = () => {
  const frame = useCurrentFrame();
  const sLive = toStory(frame);
  const frozen = sLive >= beats.freeze;
  const s = frozen ? beats.freeze : sLive;
  const f = frozen ? Math.round(toOut(beats.freeze)) : frame;
  const cam = camOf(s);
  const hooking = s < beats.hookEnd;

  const kick = impulse(f, [toOut(4), toOut(20), toOut(60), toOut(110), toOut(beats.frown), toOut(beats.bulb), toOut(beats.voice[0]), toOut(beats.hatch[0]), toOut(beats.ladder[1]), toOut(beats.doors[0]), toOut(beats.centre)], 4) * 22;
  const bang = s >= beats.bulb && s < beats.bulb + 20 ? 3 : 1;
  const shake = handheld(f, hooking ? 8 : 3 * bang, { x: kick * Math.sin(f * 3), y: kick * 0.6 });

  // ---------- the wall: every Theo turns to stare; in the dark only their eyes stay lit ----------
  const stare = clamp01((s - beats.turn[0]) / (beats.turn[1] - beats.turn[0]));
  const dark = s >= beats.voice[0] && s < beats.voice[1] ? 1 : 0;
  const girlSmile = track(s, [beats.frown - 6, beats.frown + 6], [1, -1]);
  const live = s >= beats.truth && s < beats.girl ? 0.6 + 0.4 * Math.abs(Math.sin(f * 0.5)) : s < beats.voice[0] ? 0.5 : 0.25;
  const lives = s >= beats.bulb ? 2 : 3;
  const burstT = s - beats.bulb;

  // ---------- the hatch, the ladder, the doors ----------
  const hatch = track(s, beats.hatch, [0, 1]);
  const ladder = track(s, beats.ladder, [0, 1]);
  const open = track(s, beats.doors, [0, 1]);
  const timerSec = 30 - Math.max(0, s - beats.timer) / 30;
  const creep = 0.55 + 0.3 * clamp01((s - beats.centre) / 110);
  const newTheo = s >= beats.centre ? 1 : 0;

  // ---------- Theo ----------
  const walkF = beats.walk;
  const tx = track(s, walkF, [TX, 170]);
  const spd = speedOf(s, walkF, [TX, 170], track);
  const base: Pose =
    s < beats.truth
      ? lerpPose(KAI.flinch, MIC, clamp01((s - 40) / 20))
      : s < beats.girl
        ? lerpPose(MIC, PLEAD, 0.5 + 0.5 * Math.sin(f * 0.15))
        : s < beats.bulb
          ? { ...MIC, tilt: 4 }
          : s < beats.voice[0]
            ? lerpPose(KAI.flinch, MIC, clamp01((s - beats.bulb - 20) / 30))
            : s < beats.hatch[0]
              ? LISTEN
              : s < beats.doors[0]
                ? lerpPose(LISTEN, LOOKUP, clamp01((s - beats.hatch[0]) / 12))
                : s < beats.choice
                  ? lerpPose(LOOKUP, KAI.watch, clamp01((s - beats.doors[0]) / 10))
                  : { ...TORN, lean: TORN.lean + Math.sin(f * 0.2) * 7, rUA: TORN.rUA + Math.sin(f * 0.3) * 8 };
  const flip = s >= beats.doors[0] && s < beats.choice;
  const tPose = spd > 0.2 ? moving(base, tx, spd, flip) : base;
  const tFace = face(1, s < beats.truth || (s >= beats.bulb && s < beats.bulb + 30) ? 0.8 : 0.4, 0.8);
  const sk = skeleton(tPose);
  const headX = tx + (flip ? -sk.head.x : sk.head.x) * SC;

  const punch = 1 + 0.08 * impulse(f, EMPH, 5);
  const freezeT = frozen ? frame - toOut(beats.freeze) : 0;
  const filter = frozen ? `grayscale(${Math.min(0.8, freezeT * 0.1)}) brightness(${Math.max(0.5, 1 - freezeT * 0.06)})` : undefined;
  return (
    <AbsoluteFill style={{ backgroundColor: "#050506" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ filter }}>
        <Defs0 />
        <g transform={`translate(540 960) scale(${punch * (1 + freezeT * 0.0012)}) translate(-540 -960)`}>
          <g transform={cameraTransform(cam, shake)}>
            <ControlRoom frame={f} alarm={0} swing={0.1} talk={0} dead={dark} pressed girl={1} wake={1} headset={false} stare={stare} girlSmile={girlSmile}>
              {/* the ceiling, the hatch swinging open, light and a ladder coming down */}
              <rect x={-2200} y={-1400} width={5500} height={1400 + HATCH.y} fill="#0d1014" />
              <rect x={HATCH.x - HATCH.w / 2} y={HATCH.y - 30} width={HATCH.w} height={30} fill={hatch > 0 ? "#fff6d8" : "#1b1e24"} />
              {hatch > 0 ? <polygon points={`${HATCH.x - HATCH.w / 2},${HATCH.y} ${HATCH.x + HATCH.w / 2},${HATCH.y} ${HATCH.x + 300},${F} ${HATCH.x - 300},${F}`} fill="#fff3c4" opacity={0.16 * hatch} /> : null}
              <rect x={HATCH.x - HATCH.w / 2} y={HATCH.y - 8} width={HATCH.w} height={16} fill="#3a3f47" transform={`rotate(${-80 * hatch} ${HATCH.x - HATCH.w / 2} ${HATCH.y})`} />
              {ladder > 0 ? (
                <g stroke="#8a919b" strokeWidth={10} strokeLinecap="round">
                  <line x1={HATCH.x - 50} y1={HATCH.y} x2={HATCH.x - 50} y2={HATCH.y + ladder * 880} />
                  <line x1={HATCH.x + 50} y1={HATCH.y} x2={HATCH.x + 50} y2={HATCH.y + ladder * 880} />
                  {Array.from({ length: Math.floor(ladder * 14) }, (_, i) => (
                    <line key={i} x1={HATCH.x - 50} y1={HATCH.y + 50 + i * 62} x2={HATCH.x + 50} y2={HATCH.y + 50 + i * 62} strokeWidth={7} />
                  ))}
                </g>
              ) : null}
              {LAMPS.map((x, i) => (
                <Lamp key={i} x={x} frame={f} on={!(i === BURST && s >= beats.bulb)} />
              ))}
              {burstT >= 0 && burstT < 30
                ? Array.from({ length: 22 }, (_, i) => {
                    const a = (i / 22) * Math.PI * 2 + i;
                    const d = burstT * (6 + (i % 5) * 3);
                    return <circle key={i} cx={LAMPS[BURST] + Math.cos(a) * d} cy={208 + Math.sin(a) * d + burstT * burstT * 0.3} r={i % 3 ? 4 : 7} fill={i % 2 ? "#ffcf6b" : "#dff2ff"} opacity={1 - burstT / 30} filter="url(#glow0)" />;
                  })
                : null}
              {/* the elevator doors, sliding open again */}
              <rect x={-322} y={778} width={192 * (1 - open)} height={722} fill="#6d7581" />
              <rect x={62 - 192 * (1 - open)} y={778} width={192 * (1 - open)} height={722} fill="#6d7581" />
              {/* on the centre screen: the new Theo, and the dark closing in on him */}
              {newTheo > 0 ? (
                <g transform={`translate(${SCREEN.x + 24} ${SCREEN.y + 100}) scale(0.26)`}>
                  <StickFigure pose={{ ...KAI.flinch, tilt: -30 + Math.sin(f * 0.4) * 8 }} x={0} y={0} scale={1} frame={f} face={face(1, 0.7, 0.8)} />
                </g>
              ) : null}
              {newTheo > 0 ? (
                <g>
                  <rect x={SCREEN.x + SCREEN.w - SCREEN.w * creep} y={SCREEN.y} width={SCREEN.w * creep} height={SCREEN.h} fill="#07090c" opacity={0.92} />
                  <circle cx={SCREEN.x + SCREEN.w - SCREEN.w * creep + 9} cy={SCREEN.y + 26} r={2.2} fill="#fff" />
                  <circle cx={SCREEN.x + SCREEN.w - SCREEN.w * creep + 16} cy={SCREEN.y + 25} r={2.2} fill="#fff" />
                </g>
              ) : null}
              <StickFigure pose={tPose} x={tx} y={F + 34} scale={SC} frame={f} face={tFace} flip={flip} />
              <g transform={`translate(${headX} ${F + 34 + sk.head.y * SC}) rotate(${flip ? -sk.headAngle : sk.headAngle}) scale(${flip ? -SC : SC} ${SC})`}>
                <Headset live={live} />
              </g>
            </ControlRoom>
          </g>
        </g>
        {burstT >= 0 && burstT < 5 ? <rect width={1080} height={1920} fill="#fff" opacity={0.85 * (1 - burstT / 5)} /> : null}
        {dark > 0 ? <rect width={1080} height={1920} fill="#ff1e12" opacity={0.06 + 0.04 * Math.abs(Math.sin(f * 0.2))} /> : null}
        <rect width={1080} height={1920} fill="url(#vignette0)" />
        {frozen ? <rect width={1080} height={1920} fill="#fff" opacity={Math.max(0, 0.6 - freezeT * 0.12)} /> : null}
      </svg>
      <HookText frame={frame} until={Math.round(toOut(60))} lines={["I TOLD HIM.", "200 OF ME TURNED."]} top={120} />
      {!hooking ? <Badge0 frame={frame - Math.round(toOut(beats.hookEnd))} part={7} title="THE TRUTH" until={65} /> : null}
      {!hooking ? <Lives frame={frame} from={Math.round(toOut(beats.hookEnd))} left={lives} /> : null}
      {s >= beats.timer ? <DoorTimer frame={frame} from={Math.round(toOut(beats.timer))} seconds={timerSec} frozen={frozen} /> : null}
      <ChoiceCards frame={frame} from={Math.round(toOut(beats.cards))} question="WHERE SHOULD THEO GO?" a="CLIMB THE LADDER" b="GO SAVE HIM" />
      <Captions frame={frame} chunks={timeline.captions} speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>} />
      <EndCard0 frame={frame} from={Math.round(toOut(beats.card))} part={7} />
    </AbsoluteFill>
  );
};
