import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { lerpPose, Pose, POSES, StickFigure } from "../../shared/rig";
import { cameraTransform, handheld, impulse, KAI, makeWarp, track } from "../../LastLight/kit";
import { face, worldOf } from "../../LastLight/bridge";
import { Captions, SPEAKERS } from "../../LastLight/Overlays";
import { Defs0, Shaft, Tall, Tallies } from "../elevator";
import { ChoiceCards, HookText, Lives } from "../ui";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toOut, toStory } = makeWarp(timeline);
const EMPH = timeline.captions.flatMap((c) => c.words.filter((w) => w.emph).map((w) => w.frame));

const SC = 1.45;
const TALL = { x: 440, y: 0, s: 1.4 };
const GRIP = { x: TALL.x + 130 * TALL.s, y: TALL.y - 60 * TALL.s };
const HEAD = { x: TALL.x + 30 * TALL.s, y: TALL.y - 668 * TALL.s };
const SHOULDER = { x: TALL.x + 10 * TALL.s, y: TALL.y - 600 * TALL.s };
const LAMPS = Array.from({ length: 12 }, (_, i) => 300 + i * 240);

type Cam = { fx: number; fy: number; z: number };
const keyed = (s: number, keys: [number, number, number, number][]): Cam => {
  const f = keys.map((k) => k[0]);
  const v = (i: number) => track(s, f, keys.map((k) => k[i]));
  return { fx: v(1), fy: v(2), z: v(3) };
};

// hand over hand up the cable, knees pulling up
const CLIMB_A: Pose = { ...POSES.stand, lean: 6, tilt: -22, lUA: 168, lFA: 176, rUA: 128, rFA: 150, lTh: 78, lSh: 4, rTh: -4, rSh: -4 };
const CLIMB_B: Pose = { ...CLIMB_A, lUA: 128, lFA: 150, rUA: 168, rFA: 176, lTh: -4, lSh: -4, rTh: 78, rSh: 4 };
const HANG: Pose = { ...CLIMB_A, tilt: -30, lTh: 10, rTh: -10 };

export const Part12: React.FC = () => {
  const frame = useCurrentFrame();
  const sLive = toStory(frame);
  const frozen = sLive >= beats.freeze;
  const s = frozen ? beats.freeze : sLive;
  const f = frozen ? Math.round(toOut(beats.freeze)) : frame;
  const hooking = s < beats.hookEnd;

  // ---------- Theo climbs the cable towards it ----------
  const ty = track(s, beats.climb, [2150, 980]);
  const climbing = s < beats.climb[1];
  const base: Pose = climbing
    ? lerpPose(CLIMB_A, CLIMB_B, 0.5 + 0.5 * Math.sin(s * 0.35))
    : s < beats.burst + 20 && s >= beats.burst
      ? { ...HANG, ...KAI.flinch, lUA: 168, lFA: 176, rUA: 160, rFA: 170 }
      : { ...HANG, tilt: HANG.tilt + Math.sin(f * 0.08) * 6 };
  const tx = GRIP.x - 120;
  const head = worldOf(base, "head", tx, ty, SC, false);
  const tFace = face(1, 0.8, 0.9);

  // ---------- the shaft below goes dark, floor by floor ----------
  const darkLine = track(s, beats.dark, [3400, ty + 260]);
  const lit = (y: number) => (s < beats.dark[0] ? true : y < Math.min(darkLine, ty + 260));
  const lives = s >= beats.burst ? 1 : 2;
  const burstT = s - beats.burst;

  // ---------- it leans down; its arm is covered in tally marks; its eyes become his ----------
  const lean = track(s, beats.lean, [0, 18]);
  const tilted = (p: { x: number; y: number }) => {
    const a = (lean * Math.PI) / 180;
    const dx = p.x - TALL.x;
    const dy = p.y - TALL.y;
    return { x: TALL.x + dx * Math.cos(a) - dy * Math.sin(a), y: TALL.y + dx * Math.sin(a) + dy * Math.cos(a) };
  };
  const face0 = tilted(HEAD);
  const shoulder = tilted(SHOULDER);
  const reach = track(s, beats.reach, [0, 1]);
  const hand = { x: shoulder.x + (head.x + 60 - shoulder.x) * reach, y: shoulder.y + (head.y - 170 - shoulder.y) * reach };
  const armAngle = (Math.atan2(hand.y - shoulder.y, hand.x - shoulder.x) * 180) / Math.PI;
  const armLen = Math.hypot(hand.x - shoulder.x, hand.y - shoulder.y);
  const his = track(s, [beats.firstTheo - 4, beats.firstTheo + 4], [0, 1]);

  // ---------- camera: a new picture about every second in the first eight ----------
  const cam: Cam =
    s < 22
      ? keyed(s, [[0, HEAD.x, HEAD.y + 20, 1.7], [22, HEAD.x, HEAD.y + 20, 2.0]])
      : s < 45
        ? keyed(s, [[22, head.x + 40, head.y, 2.4], [45, head.x + 40, head.y - 30, 2.1]])
        : s < 75
          ? keyed(s, [[45, 560, 600, 0.56], [75, 560, 640, 0.6]])
          : s < beats.dark[0]
            ? keyed(s, [[75, head.x + 30, head.y - 40, 2.5], [beats.dark[0], head.x + 30, head.y - 40, 2.7]])
            : s < beats.burst
              ? keyed(s, [[beats.dark[0], 560, ty + 120, 1.0], [beats.dark[1], 560, ty + 60, 1.1], [beats.burst, 560, ty - 100, 1.4]])
              : s < beats.lean[0]
                ? keyed(s, [[beats.burst, head.x, head.y, 2.2], [beats.lean[0], head.x, head.y, 2.4]])
                : s < beats.marks[0]
                  ? keyed(s, [[beats.lean[0], 600, 200, 0.75], [beats.reach[1], 620, 250, 0.9], [beats.marks[0], 640, 260, 1.0]])
                  : s < beats.firstTheo - 20
                    ? keyed(s, [[beats.marks[0], (shoulder.x * 2 + hand.x) / 3, (shoulder.y * 2 + hand.y) / 3, 2.2], [beats.marks[1], (shoulder.x + hand.x * 2) / 3, (shoulder.y + hand.y * 2) / 3, 2.4], [beats.firstTheo - 20, face0.x, face0.y, 1.8]])
                    : s < beats.choice
                      ? keyed(s, [[beats.firstTheo - 20, face0.x, face0.y, 1.8], [beats.firstTheo, face0.x, face0.y, 2.6], [beats.choice, face0.x, face0.y, 2.8]])
                      : keyed(s, [[beats.choice, (face0.x + head.x) / 2, (face0.y + head.y) / 2 + 80, 1.0], [beats.freeze, (face0.x + head.x) / 2, (face0.y + head.y) / 2 + 80, 0.9]]);

  const darkKicks = LAMPS.map((y) => (y > ty + 260 ? track(y, [ty + 260, 3400], [beats.dark[1], beats.dark[0]]) : -99)).filter((k) => k > 0);
  const kick = impulse(f, [toOut(2), toOut(22), toOut(45), toOut(75), toOut(beats.dark[0]), toOut(beats.burst), toOut(beats.lean[0]), toOut(beats.marks[0]), toOut(beats.firstTheo), toOut(beats.choice), ...darkKicks.map(toOut)], 4) * 20;
  const shake = handheld(f, hooking ? 7 : 3, { x: kick * Math.sin(f * 3), y: kick * 0.6 });

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
            <Shaft frame={f} drop={0} cx={540} top={-2200} bottom={3600} speed={0} />
            {/* wall lamps, one per floor, going dark below him */}
            {LAMPS.map((y) =>
              [-1, 1].map((sd) => (
                <g key={`${y}${sd}`}>
                  {lit(y) ? <circle cx={540 + sd * 560} cy={y} r={170} fill="url(#goldGlow0)" opacity={0.5} /> : null}
                  <rect x={540 + sd * 560 - 18} y={y - 12} width={36} height={24} rx={6} fill={lit(y) ? "#FFE08A" : "#2a2c31"} filter={lit(y) ? "url(#glow0)" : undefined} />
                </g>
              )),
            )}
            {/* the light from its face pouring down the shaft */}
            <polygon points={`${HEAD.x - 60},${HEAD.y} ${HEAD.x + 60},${HEAD.y} ${HEAD.x + 600},${ty + 200} ${HEAD.x - 600},${ty + 200}`} fill="#dff2ff" opacity={0.08} />
            <rect x={-800} y={TALL.y} width={2700} height={46} fill="#2b2e35" />
            <g transform={`rotate(${lean} ${TALL.x} ${TALL.y})`}>
              <Tall x={TALL.x} y={TALL.y} scale={TALL.s} frame={f} eyes={1 - his * 0.7} step={0} />
              {/* his eyes on its face: worried, human */}
              {his > 0 ? (
                <g opacity={his}>
                  <circle cx={HEAD.x - 22} cy={HEAD.y - 10} r={22} fill="#fff" />
                  <circle cx={HEAD.x + 26} cy={HEAD.y - 10} r={22} fill="#fff" />
                  <circle cx={HEAD.x - 18} cy={HEAD.y - 4} r={9} fill="#111" />
                  <circle cx={HEAD.x + 30} cy={HEAD.y - 4} r={9} fill="#111" />
                  <path d={`M ${HEAD.x - 44} ${HEAD.y - 44} L ${HEAD.x - 6} ${HEAD.y - 34} M ${HEAD.x + 48} ${HEAD.y - 44} L ${HEAD.x + 10} ${HEAD.y - 34}`} stroke="#fff" strokeWidth={6} strokeLinecap="round" />
                  <ellipse cx={HEAD.x + 52} cy={HEAD.y + 18} rx={7} ry={11} fill="#7FE3FF" />
                </g>
              ) : null}
            </g>
            {/* the long arm reaching down, scratched with tallies */}
            {reach > 0 ? (
              <g>
                <line x1={shoulder.x} y1={shoulder.y} x2={hand.x} y2={hand.y} stroke="#2c2e37" strokeWidth={44} strokeLinecap="round" />
                <line x1={shoulder.x} y1={shoulder.y} x2={hand.x} y2={hand.y} stroke="#040405" strokeWidth={36} strokeLinecap="round" />
                <g transform={`translate(${shoulder.x} ${shoulder.y}) rotate(${armAngle}) translate(40 -14)`} opacity={track(s, [beats.reach[1] - 10, beats.reach[1]], [0, 1])}>
                  <Tallies x={0} y={0} cols={Math.max(1, Math.floor((armLen - 80) / 34))} rows={1} dx={34} dy={0} size={26} />
                </g>
                {[-1, 0, 1].map((d) => (
                  <line key={d} x1={hand.x} y1={hand.y} x2={hand.x + d * 18} y2={hand.y + 50} stroke="#040405" strokeWidth={9} strokeLinecap="round" />
                ))}
              </g>
            ) : null}
            {/* his cable, from its fist down past him */}
            <line x1={GRIP.x} y1={GRIP.y} x2={GRIP.x + Math.sin(f * 0.05) * 8} y2={3600} stroke="#9aa3ad" strokeWidth={9} />
            <circle cx={head.x} cy={head.y + 60} r={300} fill="url(#tubeGlow0)" opacity={0.35} />
            <StickFigure pose={base} x={tx} y={ty} scale={SC} frame={f} face={tFace} />
            {burstT >= 0 && burstT < 26
              ? Array.from({ length: 18 }, (_, i) => {
                  const a = (i / 18) * Math.PI * 2 + i;
                  const d = burstT * (6 + (i % 4) * 3);
                  return <circle key={i} cx={head.x + Math.cos(a) * d} cy={head.y - 120 + Math.sin(a) * d + burstT * burstT * 0.4} r={i % 3 ? 4 : 7} fill={i % 2 ? "#ffcf6b" : "#dff2ff"} opacity={1 - burstT / 26} filter="url(#glow0)" />;
                })
              : null}
          </g>
        </g>
        {burstT >= 0 && burstT < 5 ? <rect width={1080} height={1920} fill="#fff" opacity={0.8 * (1 - burstT / 5)} /> : null}
        {s >= beats.firstTheo && s < beats.firstTheo + 3 ? <rect width={1080} height={1920} fill="#fff" opacity={0.5} /> : null}
        <rect width={1080} height={1920} fill="url(#vignette0)" />
        {frozen ? <rect width={1080} height={1920} fill="#fff" opacity={Math.max(0, 0.6 - freezeT * 0.12)} /> : null}
      </svg>
      <HookText frame={frame} until={Math.round(toOut(beats.hookEnd - 10))} lines={["1 SECOND TO", "PULL ME UP.", "WHY WAIT?"]} top={1300} />
      {s >= beats.dark[0] ? <Lives frame={frame} from={Math.round(toOut(beats.dark[0]))} left={lives} /> : null}
      <ChoiceCards frame={frame} from={Math.round(toOut(beats.cards))} question="WHAT SHOULD THEO DO?" a="TAKE HIS PLACE" b="PUSH HIM DOWN" />
      <Captions frame={frame} chunks={timeline.captions} speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>} />
    </AbsoluteFill>
  );
};
