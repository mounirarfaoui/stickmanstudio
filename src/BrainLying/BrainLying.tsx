import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Captions, EndCard, FONT, TitleCard } from "./Captions";
import beats from "./beats.json";
import { poseAt, PoseName, ShadowMonster, StickFigure } from "./rig";

export const DURATION = beats.duration;

const ease = Easing.inOut(Easing.cubic);
const track = (frame: number, frames: number[], values: number[]) =>
  interpolate(frame, frames, values, { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const window01 = (frame: number, a: number, b: number, fade = 6) =>
  interpolate(frame, [a, a + fade, b - fade, b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Story beats (30 fps):
// 0-150 hook | 150-300 setup | 300-450 fear grows | 450-575 freeze + breathe
// 575-700 practice | 700-800 speaks, shadow shrinks | 800-900 end card
const POSE_KEYS: [number, PoseName][] = [
  [0, "nervous"],
  [45, "nervous"],
  [90, "cower"],
  [135, "cower"],
  [158, "nervous"],
  [300, "nervous"],
  [360, "cower"],
  [450, "cower"],
  [480, "freeze"],
  [512, "freeze"],
  [545, "breatheIn"],
  [575, "breatheOut"],
  [588, "gestureA"],
  [600, "gestureB"],
  [612, "gestureA"],
  [622, "stand"],
  [630, "gestureA"],
  [642, "gestureB"],
  [654, "gestureA"],
  [662, "stand"],
  [668, "gestureA"],
  [680, "gestureB"],
  [692, "gestureA"],
  [702, "stand"],
  [714, "speak"],
  [792, "speak"],
  [818, "proud"],
];

const PRACTICE = beats.practice;
const GROUND = 1500;
const WALL = 1425;

export const BrainLying: React.FC = () => {
  const frame = useCurrentFrame();

  const z = track(frame, [0, 40, 105, 138, 158, 300, 420, 450, 500, 575, 700, 800, 840, 900], [1.45, 1.45, 0.9, 0.9, 1.0, 1.12, 0.9, 0.9, 1.4, 1.38, 1.15, 1.0, 0.75, 0.72]);
  const fy = track(frame, [0, 40, 105, 138, 158, 300, 420, 450, 500, 575, 700, 800, 840, 900], [1260, 1260, 1000, 1000, 960, 1100, 1000, 1000, 1250, 1250, 1150, 1050, 760, 760]);
  const m = track(frame, beats.monster.frames, beats.monster.values);
  const dark = track(frame, [0, 40, 100, 135, 152, 300, 420, 575, 700, 790], [0, 0, 0.55, 0.55, 0, 0, 0.78, 0.62, 0.35, 0]);
  const shake = track(frame, [0, 70, 100, 130, 140, 330, 400, 440, 470], [0, 0, 6, 6, 0, 0, 9, 9, 0]);
  const warm = track(frame, [700, 790, 900], [0, 1, 0.8]);
  const size = track(frame, [0, 40, 100, 138, 158, 300, 420, 575, 700, 790], [1, 1, 0.85, 0.85, 1, 1, 0.82, 0.86, 0.95, 1.06]);
  const tremble = track(frame, [0, 60, 100, 135, 155, 300, 380, 480, 512, 560], [0.3, 0.3, 1, 1, 0.35, 0.35, 1, 0.8, 0.4, 0]);
  const worry = track(frame, [0, 40, 100, 138, 158, 300, 400, 512, 575, 700, 760, 800], [0.5, 0.5, 1, 1, 0.55, 0.6, 1, 0.9, 0.6, 0.45, 0.1, 0]);
  const smile = track(frame, [700, 760, 800], [0, 0.3, 0.8]);

  const talkPractice = PRACTICE.reduce((acc, f) => Math.max(acc, window01(frame, f, f + 27)), 0);
  const talkSpeech = window01(frame, 714, 790);
  const mouth = Math.max(talkPractice * 0.5, talkSpeech) * Math.abs(Math.sin(frame * 0.55));

  const base = poseAt(frame, POSE_KEYS);
  const jitter = tremble * 3.2;
  const pose = {
    ...base,
    lUA: base.lUA + Math.sin(frame * 2.3) * jitter,
    rUA: base.rUA + Math.sin(frame * 2.1 + 1) * jitter,
    lFA: base.lFA + Math.sin(frame * 0.35) * 10 * tremble,
    rFA: base.rFA - Math.sin(frame * 0.35) * 10 * tremble,
    lTh: base.lTh + Math.sin(frame * 2.7) * jitter * 0.4,
  };

  const shx = shake * (Math.sin(frame * 1.9) * 0.6 + Math.sin(frame * 3.3 + 1) * 0.4);
  const shy = shake * (Math.cos(frame * 2.3) * 0.6 + Math.sin(frame * 4.1) * 0.4);
  const camera = `translate(${540 - 540 * z + shx} ${960 - fy * z + shy}) scale(${z})`;

  const flicker = 1 - dark * 0.08 * (Math.sin(frame * 0.9) * Math.sin(frame * 0.37) > 0.6 ? 1 : 0);
  const breath = interpolate(frame, beats.breath, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breathOn = breath > 0 && breath < 1;
  const bubble = interpolate(frame, [706, 716, 784, 792], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const flash = interpolate(frame, [beats.flash, beats.flash + 5, beats.flash + 18], [0, 0.7, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#EDE8DF" }}>
      {/* Generated from beats.json by `npm run audio` */}
      <Audio src={staticFile("soundtrack.wav")} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <radialGradient id="dark" gradientUnits="userSpaceOnUse" cx={540} cy={1300} r={1100}>
            <stop offset="0" stopColor="#0a0a10" stopOpacity={0.25} />
            <stop offset="0.3" stopColor="#0a0a10" stopOpacity={0.55} />
            <stop offset="1" stopColor="#0a0a10" stopOpacity={0.95} />
          </radialGradient>
          <radialGradient id="red" gradientUnits="userSpaceOnUse" cx={560} cy={500} r={800}>
            <stop offset="0" stopColor="#C4142C" stopOpacity={0.55} />
            <stop offset="1" stopColor="#C4142C" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="warm" gradientUnits="userSpaceOnUse" cx={540} cy={1250} r={900}>
            <stop offset="0" stopColor="#FFD27A" stopOpacity={0.5} />
            <stop offset="1" stopColor="#FFD27A" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="1" stopColor="#fff" stopOpacity={0.45} />
          </linearGradient>
          <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.35} />
          </radialGradient>
          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={3.5 * (1 - m) + 0.5} />
          </filter>
          <filter id="glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation={3} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={camera}>
          <rect x={-1200} y={-1500} width={3480} height={WALL + 1500} fill="#EDE8DF" />
          <rect x={-1200} y={WALL} width={3480} height={2000} fill="#DCD4C7" />
          <line x1={-1200} y1={WALL} x2={2280} y2={WALL} stroke="#C9C0B1" strokeWidth={4} />

          <rect x={-1200} y={-1500} width={3480} height={4000} fill="url(#warm)" opacity={warm} />
          <rect x={-1200} y={-1500} width={3480} height={4000} fill="url(#dark)" opacity={dark * flicker} />
          <rect x={-1200} y={-1500} width={3480} height={4000} fill="url(#red)" opacity={dark * m} />
          <polygon points={`420,-600 660,-600 800,${GROUND + 10} 280,${GROUND + 10}`} fill="url(#cone)" opacity={0.1 + dark * 0.9} />
          <ellipse cx={540} cy={GROUND + 4} rx={230} ry={44} fill="#fff" opacity={0.15 + dark * 0.45} />

          <ShadowMonster pose={pose} m={m} frame={frame} x={565} y={WALL} scale={1.12 + 2.9 * m} />

          {breathOn ? (
            <circle
              cx={540}
              cy={GROUND - 205 * size}
              r={70 + 90 * Math.sin(breath * Math.PI)}
              fill="none"
              stroke="#4DA3FF"
              strokeWidth={8}
              opacity={0.7 * Math.sin(breath * Math.PI)}
            />
          ) : null}

          <ellipse cx={540} cy={GROUND + 2} rx={70 * size} ry={12} fill="#000" opacity={0.18} />
          <StickFigure pose={pose} x={540} y={GROUND} scale={size} frame={frame} face={{ worry, smile, mouth, sweat: Math.max(0, worry - 0.6) * 2.5 }} />

          {PRACTICE.map((f) => {
            const o = window01(frame, f, f + 27, 5);
            if (o <= 0) return null;
            return (
              <g key={f} opacity={o} transform={`translate(690 1150) scale(${0.6 + 0.4 * o})`}>
                <rect x={-78} y={-42} width={156} height={84} rx={40} fill="#fff" stroke="#111" strokeWidth={6} />
                <polygon points="-60,30 -40,36 -86,64" fill="#fff" stroke="#111" strokeWidth={6} strokeLinejoin="round" />
                <rect x={-58} y={24} width={40} height={14} fill="#fff" />
                {[0, 1, 2].map((d) => (
                  <circle key={d} cx={-36 + d * 36} cy={0} r={10} fill="#111" opacity={0.3 + 0.7 * Math.max(0, Math.sin(frame * 0.4 - d))} />
                ))}
              </g>
            );
          })}

          {bubble > 0 ? (
            <g transform={`translate(540 1022) scale(${bubble})`}>
              <rect x={-290} y={-80} width={580} height={150} rx={46} fill="#fff" stroke="#111" strokeWidth={7} />
              <polygon points="-24,66 26,66 6,118" fill="#fff" stroke="#111" strokeWidth={7} strokeLinejoin="round" />
              <rect x={-20} y={58} width={42} height={14} fill="#fff" />
              <text x={0} y={-16} textAnchor="middle" fontFamily={FONT} fontSize={46} fill="#111">
                Hi everyone,
              </text>
              <text x={0} y={44} textAnchor="middle" fontFamily={FONT} fontSize={46} fill="#111">
                I have an idea.
              </text>
            </g>
          ) : null}

          {[200, 540, 880].map((x, i) => {
            const nod = frame > 772 && frame < 800 ? Math.sin((frame - 772) * 0.45) * 6 : 0;
            const bob = Math.sin(frame * 0.05 + i * 2) * 3 + (i === 2 ? nod : 0);
            return (
              <g key={x} fill="#3A3C46">
                <circle cx={x} cy={1735 + bob} r={52} />
                <path d={`M ${x - 120} 2000 L ${x - 120} 1860 Q ${x - 120} 1795 ${x - 55} 1795 L ${x + 55} 1795 Q ${x + 120} 1795 ${x + 120} 1860 L ${x + 120} 2000 Z`} />
              </g>
            );
          })}
        </g>

        <rect width={1080} height={1920} fill="url(#vignette)" />
        <rect width={1080} height={1920} fill="#fff" opacity={flash} />
      </svg>

      <Sequence durationInFrames={110} name="Title">
        <TitleCard />
      </Sequence>
      <Sequence durationInFrames={800} name="Captions">
        <Captions />
      </Sequence>
      {frame >= beats.endCard.from ? <EndCard /> : null}
    </AbsoluteFill>
  );
};
