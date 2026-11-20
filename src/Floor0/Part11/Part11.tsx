import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { Pose, skeleton, StickFigure } from "../../shared/rig";
import { cameraTransform, handheld, impulse, KAI, makeWarp, track } from "../../LastLight/kit";
import { face, worldOf } from "../../LastLight/bridge";
import { Captions, SPEAKERS } from "../../LastLight/Overlays";
import { Defs0, Led, Shaft, Tall } from "../elevator";
import { rand, Shears } from "../attic";
import { Badge0, ChoiceCards, HookText, Lives } from "../ui";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toOut, toStory } = makeWarp(timeline);
const EMPH = timeline.captions.flatMap((c) => c.words.filter((w) => w.emph).map((w) => w.frame));

const SC = 1.45;
const TX = 540;
const TY = 1300;
const TALL = { x: 440, y: -2400, s: 1.4 };
const GRIP = { x: TALL.x + 130 * TALL.s, y: TALL.y - 60 * TALL.s };

type Cam = { fx: number; fy: number; z: number };
const keyed = (s: number, keys: [number, number, number, number][]): Cam => {
  const f = keys.map((k) => k[0]);
  const v = (i: number) => track(s, f, keys.map((k) => k[i]));
  return { fx: v(1), fy: v(2), z: v(3) };
};

const FALL: Pose = { ...KAI.flinch, lUA: 160, lFA: 170, rUA: -150, rFA: -160 };
const DANGLE: Pose = { ...KAI.flinch, lTh: -30, lSh: -10, rTh: 24, rSh: 18, rUA: 70, rFA: 100 };
const KICK: Pose = { ...DANGLE, lTh: 20, lSh: 10, rTh: -20, rSh: -6, tilt: 30, duck: 0.1 };
// the door sits just under his dangling feet: close enough to see, too far to touch
const FEET = TY + Math.max(skeleton(DANGLE).lFoot.y, skeleton(DANGLE).rFoot.y) * SC;
const DOOR = { x: 420, w: 240, top: FEET + 170 };
const BOTTOM = DOOR.top + 420;

export const Part11: React.FC = () => {
  const frame = useCurrentFrame();
  const sLive = toStory(frame);
  const frozen = sLive >= beats.freeze;
  const s = frozen ? beats.freeze : sLive;
  const f = frozen ? Math.round(toOut(beats.freeze)) : frame;
  const hooking = s < beats.hookEnd;
  const falling = s < beats.stop;

  // ---------- the fall: the shaft streams up past him until the cable bites ----------
  const fs = Math.min(s, beats.stop);
  const drop = fs * 60 + fs * fs * 0.35;
  const speed = falling ? 60 + fs * 0.7 : 0;
  const stopT = s - beats.stop;
  const bob = !falling ? Math.exp(-stopT / 18) * Math.sin(stopT * 0.5) * 70 + impulse(s, [beats.tug], 6) * -60 : 0;
  const spin = falling ? (s < beats.dive[1] ? track(s, beats.dive, [0, 160]) : 160 + (s - beats.dive[1]) * 6) : Math.sin(f * 0.04) * 6;
  const kick = s >= beats.kicks[0] && s < beats.kicks[2] + 20;
  const base: Pose = falling ? FALL : kick && Math.sin(f * 0.5) > 0 ? KICK : { ...DANGLE, lean: DANGLE.lean + Math.sin(f * 0.15) * 5 };
  const ty = TY + bob;
  const sk = skeleton(base);
  const centre = { x: TX, y: ty + sk.neck.y * SC * 0.6 };
  const rotPt = (p: { x: number; y: number }) => {
    const a = (spin * Math.PI) / 180;
    const dx = p.x - centre.x;
    const dy = p.y - centre.y;
    return { x: centre.x + dx * Math.cos(a) - dy * Math.sin(a), y: centre.y + dx * Math.sin(a) + dy * Math.cos(a) };
  };
  const neck = rotPt(worldOf(base, "neck", TX, ty, SC, false));
  const hand = rotPt(worldOf(base, "rHand", TX, ty, SC, false));
  const head = rotPt(worldOf(base, "head", TX, ty, SC, false));
  const fa = Math.atan2(sk.rHand.x - sk.rElbow.x, sk.rHand.y - sk.rElbow.y) * (180 / Math.PI);
  const tFace = face(1, 0.9, 0.9);

  // ---------- the thing at the top ----------
  const eyes = track(s, [beats.eyes, beats.eyes + 10], [0, 1]);
  const step = impulse(s, [beats.tug], 6);

  // ---------- camera ----------
  const cy = centre.y;
  const cam: Cam =
    s < beats.dive[1]
      ? keyed(s, [[0, TX, cy, 2.3], [beats.dive[1], TX, cy, 2.0]])
      : s < 100
        ? keyed(s, [[beats.dive[1], TX, cy, 1.6], [100, TX, cy, 1.3]])
        : s < 222
          ? keyed(s, [[100, TX, cy, 1.0], [222, TX, cy, 1.1]])
          : s < beats.stop
            ? keyed(s, [[222, head.x, head.y, 2.0], [beats.stop, head.x, head.y, 2.3]])
            : s < beats.door[0]
              ? keyed(s, [[beats.stop, TX, cy, 1.6], [beats.door[0], TX, cy, 1.5]])
              : s < beats.up[0]
                ? keyed(s, [[beats.door[0], TX, cy, 1.4], [beats.door[1], TX, (cy + BOTTOM) / 2, 1.05], [beats.up[0], TX, (cy + BOTTOM) / 2, 1.1]])
                : s < beats.up[1]
                  ? keyed(s, [[beats.up[0], TX, cy - 100, 1.3], [beats.up[1], TX, -2250, 0.95]])
                  : s < beats.tug
                    ? keyed(s, [[beats.up[1], TALL.x + 40, -2700, 1.1], [beats.eyes, TALL.x + 40, -3300, 1.5], [beats.tug, TALL.x + 40, -3330, 1.8]])
                    : s < beats.choice
                      ? keyed(s, [[beats.tug, TX, cy, 1.7], [beats.choice, TX, cy, 1.5]])
                      : keyed(s, [[beats.choice, TX, (cy + DOOR.top) / 2 + 60, 1.15], [beats.freeze, TX, (cy + DOOR.top) / 2 + 60, 1.05]]);

  const kickT = impulse(f, [toOut(2), toOut(beats.dive[1]), toOut(100), toOut(222), toOut(beats.stop), toOut(beats.door[0]), toOut(beats.up[0]), toOut(beats.eyes), toOut(beats.tug), toOut(beats.choice), ...beats.kicks.map(toOut)], 4) * 22;
  const shake = handheld(f, hooking ? 9 : falling ? 7 : 3, { x: kickT * Math.sin(f * 3), y: kickT * 0.6 });

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
            <Shaft frame={f} drop={drop} cx={TX} top={-4200} bottom={2600} speed={speed} />
            {/* the beam at the top, and what stands on it */}
            <rect x={TX - 700} y={TALL.y} width={1400} height={40} fill="#2b2e35" />
            <Tall x={TALL.x} y={TALL.y} scale={TALL.s} frame={f} eyes={eyes} step={step} />
            {/* the bottom of the shaft: a door marked 0, just out of reach */}
            {!falling ? (
              <g>
                <rect x={TX - 2000} y={BOTTOM} width={4000} height={800} fill="#14110c" />
                <rect x={DOOR.x - 14} y={DOOR.top - 14} width={DOOR.w + 28} height={BOTTOM - DOOR.top + 14} fill="#2a2216" stroke="#8a7a55" strokeWidth={10} />
                <rect x={DOOR.x} y={DOOR.top} width={DOOR.w} height={BOTTOM - DOOR.top} fill="#ffe7a6" opacity={0.18 + 0.08 * Math.sin(f * 0.2)} />
                <line x1={DOOR.x + DOOR.w / 2} y1={DOOR.top} x2={DOOR.x + DOOR.w / 2} y2={BOTTOM} stroke="#8a7a55" strokeWidth={6} />
                <circle cx={DOOR.x + DOOR.w / 2} cy={DOOR.top + 200} r={320} fill="url(#goldGlow0)" opacity={0.4} />
                <rect x={DOOR.x + DOOR.w / 2 - 60} y={DOOR.top - 140} width={120} height={100} rx={12} fill="#060607" stroke="#4a4f57" strokeWidth={5} />
                <Led x={DOOR.x + DOOR.w / 2} y={DOOR.top - 58} text="0" size={92} on={0.6 + 0.4 * Math.abs(Math.sin(f * 0.15))} />
              </g>
            ) : (
              // cut cables and name tags falling with him
              Array.from({ length: 10 }, (_, i) => {
                const x = TX + (rand(i + 40) - 0.5) * 1100;
                const y = ((rand(i + 50) * 2400 - s * (12 + rand(i) * 10)) % 2400 + 2400) % 2400 - 300;
                return (
                  <g key={i} transform={`translate(${x} ${y}) rotate(${s * (3 + i) + i * 40})`}>
                    {i % 2 ? <line x1={0} y1={-140} x2={0} y2={140} stroke="#9aa3ad" strokeWidth={8} /> : <rect x={-40} y={-24} width={80} height={48} rx={6} fill="#efe6cc" />}
                  </g>
                );
              })
            )}
            {/* his cable, from his back all the way up to its hand */}
            <path d={`M ${neck.x} ${neck.y + 20} Q ${TX + Math.sin(f * 0.07) * (falling ? 80 : 30)} ${(neck.y + GRIP.y) / 2} ${GRIP.x} ${GRIP.y}`} stroke="#9aa3ad" strokeWidth={9} fill="none" />
            <circle cx={neck.x} cy={neck.y + 20} r={12} fill="#8a919b" stroke="#ff3b30" strokeWidth={4} />
            <circle cx={centre.x} cy={centre.y} r={380} fill={falling ? "url(#tubeGlow0)" : "url(#goldGlow0)"} opacity={0.45} />
            <g transform={`rotate(${spin} ${centre.x} ${centre.y})`}>
              <StickFigure pose={base} x={TX} y={ty} scale={SC} frame={f} face={tFace} />
            </g>
            <g transform={`translate(${hand.x} ${hand.y}) rotate(${-fa + spin}) scale(0.8)`}>
              <Shears open={0.1} />
            </g>
          </g>
        </g>
        {stopT >= 0 && stopT < 5 ? <rect width={1080} height={1920} fill="#fff" opacity={0.8 * (1 - stopT / 5)} /> : null}
        {s >= beats.eyes && s < beats.eyes + 3 ? <rect width={1080} height={1920} fill="#fff" opacity={0.5} /> : null}
        <rect width={1080} height={1920} fill="url(#vignette0)" />
        {frozen ? <rect width={1080} height={1920} fill="#fff" opacity={Math.max(0, 0.6 - freezeT * 0.12)} /> : null}
      </svg>
      <HookText frame={frame} until={Math.round(toOut(beats.hookEnd - 10))} lines={["I JUMPED 99.", "WHY AM I", "STILL ALIVE?"]} top={1300} />
      {!hooking ? <Badge0 frame={frame - Math.round(toOut(beats.hookEnd))} part={11} title="THE LEASH" until={65} /> : null}
      {!hooking ? <Lives frame={frame} from={Math.round(toOut(beats.hookEnd))} left={2} /> : null}
      <ChoiceCards frame={frame} from={Math.round(toOut(beats.cards))} question="WHAT SHOULD THEO DO?" a="CUT THE CABLE" b="CLIMB UP TO IT" />
      <Captions frame={frame} chunks={timeline.captions} speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>} />
    </AbsoluteFill>
  );
};
