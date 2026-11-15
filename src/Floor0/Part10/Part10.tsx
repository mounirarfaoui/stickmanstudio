import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { lerpPose, Pose, POSES, skeleton, StickFigure } from "../../shared/rig";
import { cameraTransform, handheld, impulse, KAI, makeWarp, track } from "../../LastLight/kit";
import { face, worldOf } from "../../LastLight/bridge";
import { Captions, SPEAKERS } from "../../LastLight/Overlays";
import { Defs0, Kid } from "../elevator";
import { AF, AtticLamp, Cable, rand, ROOF, Shears, tagY } from "../attic";
import { Badge0, ChoiceCards, HookText, Lives } from "../ui";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toOut, toStory } = makeWarp(timeline);
const EMPH = timeline.captions.flatMap((c) => c.words.filter((w) => w.emph).map((w) => w.frame));

const SC = 1.45;
const KS = 1.3;
const KX = 1370;
const CABLES = Array.from({ length: 14 }, (_, k) => 250 + (k - 5) * 230);
const SNAPX = 250;
const FIRST = 480;
const MINE = 710;
const ROWS = [
  { scale: 0.42, dx: 60, shade: 0.72 },
  { scale: 0.64, dx: 140, shade: 0.5 },
];
const numOf = (x: number) => String(Math.floor(rand(x) * 1200)).padStart(4, "0");
// the wave of cuts spreads out from the first cable
const cutAt = (x: number, row: number) => (x === FIRST && row < 0 ? beats.firstCut : beats.cascade[0] + Math.abs(x - FIRST) * 0.08 + (row + 1) * 20);

type Cam = { fx: number; fy: number; z: number };
const keyed = (s: number, keys: [number, number, number, number][]): Cam => {
  const f = keys.map((k) => k[0]);
  const v = (i: number) => track(s, f, keys.map((k) => k[i]));
  return { fx: v(1), fy: v(2), z: v(3) };
};

const CUT: Pose = { ...POSES.stand, lean: 6, tilt: -6, rUA: 104, rFA: 96, lUA: 60, lFA: 100 };
const RECOIL: Pose = { ...CUT, lean: -12, tilt: -14, rUA: 70, rFA: 60, duck: 0.2 };
const DANGLE: Pose = { ...KAI.flinch, lTh: -30, lSh: -10, rTh: 24, rSh: 18 };

export const Part10: React.FC = () => {
  const frame = useCurrentFrame();
  const sLive = toStory(frame);
  const frozen = sLive >= beats.freeze;
  const s = frozen ? beats.freeze : sLive;
  const f = frozen ? Math.round(toOut(beats.freeze)) : frame;
  const hooking = s < beats.hookEnd;

  // ---------- Theo: cuts the first cable, watches the room fall, walks to his own ----------
  const tx = track(s, [beats.walk[0], beats.walk[1]], [FIRST - 175, MINE - 175]);
  const bounce = impulse(s, beats.bounce, 5);
  const lift = track(s, [beats.tug, beats.tug + 10], [0, 70]) + (s >= beats.tug ? Math.sin(f * 0.25) * 6 : 0);
  const ty = AF - lift;
  const base: Pose =
    s < 20
      ? CUT
      : s < beats.walk[0]
        ? { ...KAI.watch, tilt: 8 + Math.sin(f * 0.08) * 6, rUA: 50, rFA: 110 }
        : s < beats.walk[1]
          ? { ...KAI.watch, rUA: 50, rFA: 110 }
          : s < beats.follow[0]
            ? lerpPose(CUT, RECOIL, Math.min(1, bounce))
            : s < beats.tug
              ? { ...KAI.watch, tilt: 14, duck: 0.3, rUA: 30, rFA: 60 }
              : { ...DANGLE, lean: DANGLE.lean + Math.sin(f * 0.2) * 6 };
  const tFace = face(1, hooking || s >= beats.tug || bounce > 0.4 ? 0.8 : 0.4, 0.8);
  const sk = skeleton(base);
  const hand = worldOf(base, "rHand", tx, ty, SC, false);
  const neck = worldOf(base, "neck", tx, ty, SC, false);
  const back = { x: neck.x - 16, y: neck.y + 40 };
  const headY = ty + sk.head.y * SC;
  const fa = Math.atan2(sk.rHand.x - sk.rElbow.x, sk.rHand.y - sk.rElbow.y) * (180 / Math.PI);
  const open = s < 20 ? track(s, [0, beats.firstCut], [0.8, 0]) : s >= beats.walk[1] && s < beats.follow[0] ? 0.15 + 0.55 * Math.abs(Math.sin((s - beats.walk[1]) * 0.12)) : 0.1;

  // ---------- his cable: up to the roof, and the other way, along the floor to his back ----------
  // hidden in the dark until the camera follows it, then it draws itself in along the floor
  const grow = track(s, [beats.follow[1], beats.follow[2]], [0, 1]);
  const taut = s >= beats.tug ? 1 : 0;
  const sway = (1 - taut) * Math.sin(f * 0.05) * 6 + bounce * Math.sin(f * 2.2) * 18;
  const mineTag = tagY(MINE);

  // ---------- the girl claps every time one drops ----------
  const clapping = s >= beats.clap[0] && s < beats.clap[1];
  const clap = clapping ? Math.abs(Math.sin((s - beats.clap[0]) * 0.35)) : 0.2;

  // ---------- camera ----------
  const cam: Cam =
    s < 30
      ? keyed(s, [[0, FIRST, hand.y, 2.6], [30, FIRST, hand.y, 2.2]])
      : s < 90
        ? keyed(s, [[30, 700, 820, 0.62], [90, 720, 800, 0.55]])
        : s < 170
          ? keyed(s, [[90, 900, 900, 0.78], [170, 950, 900, 0.7]])
          : s < beats.walk[0]
            ? keyed(s, [[170, KX, 1110, 1.6], [beats.walk[0], KX, 1080, 2.2]])
            : s < 300
              ? keyed(s, [[beats.walk[0], 640, 1200, 1.2], [300, 640, 1150, 1.4]])
              : s < beats.follow[0]
                ? keyed(s, [[300, MINE, hand.y, 2.5], [beats.follow[0], MINE, hand.y, 2.9]])
                : s < beats.answer
                  ? keyed(s, [[beats.follow[0], MINE, mineTag, 2.4], [beats.follow[1], MINE, AF - 30, 2.2], [500, 620, AF - 30, 2.2], [beats.follow[2], back.x, back.y + 60, 2.0], [beats.answer, back.x + 60, 1000, 1.0]])
                  : s < beats.tug
                    ? keyed(s, [[beats.answer, tx + 30, headY, 2.4], [beats.tug, tx + 30, headY, 2.8]])
                    : s < beats.choice
                      ? keyed(s, [[beats.tug, 700, 900, 0.95], [beats.choice, 700, 900, 0.78]])
                      : keyed(s, [[beats.choice, 650, 950, 0.78], [beats.freeze, 660, 960, 0.66]]);

  const cutKicks = [beats.firstCut, ...CABLES.filter((x) => x !== MINE && x !== SNAPX && x !== FIRST).map((x) => cutAt(x, -1))];
  const kick = impulse(f, [toOut(2), toOut(30), toOut(90), toOut(170), toOut(beats.follow[0]), toOut(beats.answer), toOut(beats.tug), toOut(beats.choice), ...cutKicks.map(toOut), ...beats.bounce.map(toOut)], 4) * 20;
  const shake = handheld(f, hooking ? 8 : s < beats.cascade[1] ? 5 : 3, { x: kick * Math.sin(f * 3), y: kick * 0.6 });

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
            <rect x={-2600} y={-1400} width={6400} height={5000} fill="#08090c" />
            <rect x={-2600} y={-1400} width={6400} height={1400 + ROOF - 30} fill="#0e1116" />
            {Array.from({ length: 30 }, (_, i) => (
              <rect key={i} x={-2600 + i * 220} y={ROOF - 70} width={40} height={40} fill="#1a1d23" />
            ))}
            {ROWS.map((row, r) => (
              <g key={r} transform={`translate(${540 + row.dx} 760) scale(${row.scale}) translate(-540 -760)`}>
                {Array.from({ length: 22 }, (_, k) => {
                  const x = -1600 + k * 230;
                  const t = s - cutAt(x, r);
                  return <Cable key={k} x={x} frame={f} num={numOf(x + r * 7)} cut={t >= 0 ? t : -1} />;
                })}
                <rect x={-2600} y={AF} width={6400} height={1600} fill="#0d1014" />
                <rect x={-2600} y={-1400} width={6400} height={4000} fill="#08090c" opacity={row.shade} />
              </g>
            ))}
            {[-450, 380, 1340, 2050].map((x) => (
              <AtticLamp key={x} x={x} frame={f} on={0.55 + 0.1 * Math.sin(f * 0.3 + x)} />
            ))}
            {CABLES.filter((x) => x !== MINE).map((x) => {
              const t = x === SNAPX ? 400 : s - cutAt(x, -1);
              return <Cable key={x} x={x} frame={f} num={numOf(x)} cut={t >= 0 ? t : -1} />;
            })}
            {CABLES.filter((x) => x !== MINE && x !== SNAPX).map((x) => {
              const t = s - cutAt(x, -1);
              return t >= 0 && t < 10 ? <circle key={x} cx={x} cy={700} r={140} fill="url(#goldGlow0)" opacity={1 - t / 10} /> : null;
            })}
            {/* his cable: roof pulley, down, along the floor, into his back */}
            <g>
              <circle cx={MINE} cy={ROOF} r={46} fill="#2b2f36" stroke="#4a4f57" strokeWidth={6} transform={`rotate(${f * 3} ${MINE} ${ROOF})`} />
              <path d={`M ${MINE} ${ROOF + 46} Q ${MINE + sway} 800 ${MINE} ${AF - 14}`} stroke="#9aa3ad" strokeWidth={9} fill="none" />
              <path
                d={`M ${MINE} ${AF - 14} Q ${MINE} ${AF - 4} ${MINE - 30} ${AF - 6} L ${back.x - 60} ${AF - 6} Q ${back.x - 90} ${AF - 6} ${back.x - 70} ${(AF + back.y) / 2} L ${back.x} ${back.y}`}
                stroke="#9aa3ad"
                strokeWidth={9}
                fill="none"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - grow}
                strokeLinejoin="round"
              />
              {grow > 0.97 ? (
                <g>
                  <circle cx={back.x} cy={back.y} r={60} fill="url(#redGlow0)" opacity={0.6 + 0.4 * Math.sin(f * 0.3)} />
                  <rect x={back.x - 14} y={back.y - 14} width={28} height={28} rx={5} fill="#8a919b" stroke="#ff3b30" strokeWidth={4} />
                </g>
              ) : null}
              <g transform={`translate(${MINE + sway * 0.6} ${mineTag}) rotate(${Math.sin(f * 0.07) * 5})`}>
                <line x1={0} y1={-16} x2={0} y2={0} stroke="#b9a37a" strokeWidth={3} />
                <rect x={-46} y={0} width={92} height={56} rx={6} fill="#fff1c4" stroke="#ff3b30" strokeWidth={5} />
                <text x={0} y={24} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize={20} fill="#2a2a2a">
                  THEO
                </text>
                <text x={0} y={48} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize={20} fill="#d0201a">
                  #1201
                </text>
              </g>
              {beats.bounce.map((b) => {
                const t = s - b;
                return t >= 0 && t < 12
                  ? Array.from({ length: 10 }, (_, i) => {
                      const a = (i / 10) * Math.PI * 2 + i;
                      return <circle key={`${b}-${i}`} cx={MINE + Math.cos(a) * t * 9} cy={hand.y + Math.sin(a) * t * 9} r={4} fill="#ffcf6b" opacity={1 - t / 12} filter="url(#glow0)" />;
                    })
                  : null;
              })}
            </g>
            <g transform={`translate(${KX} 0) scale(-1 1) translate(${-KX} 0)`}>
              <Kid x={KX} y={AF} scale={KS} frame={f} hold={clap} glow={0.3} smile={1} tilt={Math.sin(f * 0.05) * 4 + clap * 4} />
            </g>
            <StickFigure pose={base} x={tx} y={ty} scale={SC} frame={f} face={tFace} />
            <g transform={`translate(${hand.x} ${hand.y}) rotate(${-fa - (s >= beats.walk[1] && s < beats.follow[0] ? bounce * 30 : 0)}) scale(${KS * 0.9})`}>
              <Shears open={open} />
            </g>
            <rect x={-2600} y={AF} width={6400} height={1800} fill="#0d1115" />
            <rect x={-2600} y={AF} width={6400} height={10} fill="#22272e" />
            <rect x={490} y={AF - 6} width={220} height={20} fill="#bfe3f2" opacity={0.85} />
          </g>
        </g>
        {s >= beats.tug && s < beats.tug + 4 ? <rect width={1080} height={1920} fill="#fff" opacity={0.7} /> : null}
        <rect width={1080} height={1920} fill="url(#vignette0)" />
        {frozen ? <rect width={1080} height={1920} fill="#fff" opacity={Math.max(0, 0.6 - freezeT * 0.12)} /> : null}
      </svg>
      <HookText frame={frame} until={Math.round(toOut(beats.hookEnd - 10))} lines={["I CUT 200.", "WHY WON'T THE", "LAST ONE BREAK?"]} top={1300} />
      {!hooking ? <Badge0 frame={frame - Math.round(toOut(beats.hookEnd))} part={10} title="TIED" until={65} /> : null}
      {!hooking ? <Lives frame={frame} from={Math.round(toOut(beats.hookEnd))} left={2} /> : null}
      <ChoiceCards frame={frame} from={Math.round(toOut(beats.cards))} question="WHERE SHOULD THEO GO?" a="CLIMB THE CABLE" b="JUMP DOWN THE SHAFT" />
      <Captions frame={frame} chunks={timeline.captions} speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>} />
    </AbsoluteFill>
  );
};
