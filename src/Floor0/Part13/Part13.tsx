import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { Pose, POSES, skeleton, StickFigure } from "../../shared/rig";
import { cameraTransform, clamp01, handheld, impulse, KAI, makeWarp, track } from "../../LastLight/kit";
import { face, worldOf } from "../../LastLight/bridge";
import { Captions, FONT, SPEAKERS } from "../../LastLight/Overlays";
import { Defs0, Led, Shaft, Tall, Tallies } from "../elevator";
import { ChoiceCards, HookText, Lives } from "../ui";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toOut, toStory } = makeWarp(timeline);
const EMPH = timeline.captions.flatMap((c) => c.words.filter((w) => w.emph).map((w) => w.frame));

const SC = 1.45;
const TX = 560;
const TALL = { x: 780, s: 1.4 };
const BOT = 3600;
const LAMPS = Array.from({ length: 13 }, (_, i) => 300 + i * 240);

type Cam = { fx: number; fy: number; z: number };
const keyed = (s: number, keys: [number, number, number, number][]): Cam => {
  const f = keys.map((k) => k[0]);
  const v = (i: number) => track(s, f, keys.map((k) => k[i]));
  return { fx: v(1), fy: v(2), z: v(3) };
};

const SHOVE: Pose = { ...KAI.push, lUA: 82, lFA: 88, rUA: 92, rFA: 96 };
const LOOKDOWN: Pose = { ...KAI.watch, lean: 14, tilt: 34, duck: 0.3, rUA: 40, rFA: 60, lUA: 20, lFA: 40 };
const HANDS: Pose = { ...POSES.stand, tilt: 26, duck: 0.2, lUA: 40, lFA: 110, rUA: 60, rFA: 120 };
const LONG: Pose = { ...POSES.stand, lean: 4, tilt: 6, lUA: -28, lFA: -20, rUA: 30, rFA: 22 };

export const Part13: React.FC = () => {
  const frame = useCurrentFrame();
  const sLive = toStory(frame);
  const frozen = sLive >= beats.freeze;
  const s = frozen ? beats.freeze : sLive;
  const f = frozen ? Math.round(toOut(beats.freeze)) : frame;
  const hooking = s < beats.hookEnd;

  // ---------- the monster goes over the edge and falls the whole shaft ----------
  const ft = clamp01((s - beats.fall[0]) / (beats.impact - beats.fall[0]));
  const landed = s >= beats.impact;
  const tallY = landed ? BOT : BOT * ft * ft;
  const tallX = TALL.x + (landed ? 120 : ft * 120);
  const tallRot = landed ? -90 : -ft * 70;
  const laughing = s >= beats.laugh[0];

  // ---------- the lights come back on, from the bottom up ----------
  const lightLine = track(s, beats.lightsOn, [BOT, 150]);
  const lit = (y: number) => y > lightLine;

  // ---------- Theo on the beam: shoves, looks down, his arms stretch, his eyes light ----------
  const base: Pose =
    s < 14 ? SHOVE : s < beats.hands ? LOOKDOWN : s < beats.answer ? HANDS : LONG;
  const sk = skeleton(base);
  const stretch = track(s, beats.stretch, [0, 300]);
  const eyes = track(s, beats.eyes, [0, 1]);
  const marks = track(s, [beats.marks, beats.marks + 12], [0, 1]);
  const arm = (side: "l" | "r") => {
    const hand = worldOf(base, side === "l" ? "lHand" : "rHand", TX, 0, SC, false);
    const el = side === "l" ? sk.lElbow : sk.rElbow;
    const hd = side === "l" ? sk.lHand : sk.rHand;
    const a = Math.atan2(hd.y - el.y, hd.x - el.x);
    return { hand, a, end: { x: hand.x + Math.cos(a) * stretch, y: hand.y + Math.sin(a) * stretch } };
  };
  const L = arm("l");
  const R = arm("r");
  const head = worldOf(base, "head", TX, 0, SC, false);

  // ---------- camera ----------
  const cam: Cam =
    s < 14
      ? keyed(s, [[0, 690, -460, 1.35], [14, 690, -440, 1.25]])
      : s < 40
        ? keyed(s, [[14, 640, -200, 0.9], [40, 640, 100, 0.75]])
        : s < beats.hookEnd + 4
          ? keyed(s, [[40, head.x + 30, head.y, 2.2], [beats.hookEnd + 4, head.x + 30, head.y, 2.5]])
          : s < 110
            ? keyed(s, [[beats.hookEnd + 4, 560, Math.min(tallY, 2700) - 300, 0.55], [110, 560, Math.min(tallY, 2700) - 300, 0.6]])
            : s < 146
              ? keyed(s, [[110, 1100, lightLine + 120, 1.7], [146, 1100, lightLine + 120, 1.9]])
              : s < 182
                ? keyed(s, [[146, 560, Math.min(tallY, 2900) - 200, 0.62], [182, 560, Math.min(tallY, 2900) - 200, 0.68]])
            : s < beats.impact
              ? { fx: tallX - 380, fy: tallY - 420, z: 0.8 }
              : s < beats.hands
                ? keyed(s, [[beats.impact, 300, BOT - 200, 0.85], [beats.laugh[0], 120, BOT - 120, 1.3], [beats.hands, 100, BOT - 120, 1.6]])
                : s < 390
                  ? keyed(s, [[beats.hands, R.hand.x, R.hand.y, 2.3], [390, R.hand.x, R.hand.y, 2.0]])
                  : s < beats.glow
                  ? keyed(s, [[390, (R.end.x + head.x) / 2, (R.end.y + head.y) / 2, 1.0], [beats.glow, (R.end.x + head.x) / 2, (R.end.y + head.y) / 2, 1.15]])
                  : s < beats.answer
                    ? keyed(s, [[beats.glow, head.x, head.y, 2.2], [beats.answer, head.x, head.y, 2.8]])
                    : s < beats.choice
                      ? s < 580
                        ? keyed(s, [[beats.answer, 560, -250, 1.0], [580, 560, -250, 1.1]])
                        : keyed(s, [[580, (R.hand.x + R.end.x) / 2, (R.hand.y + R.end.y) / 2, 1.8], [beats.choice, (R.hand.x + R.end.x) / 2, (R.hand.y + R.end.y) / 2, 2.0]])
                      : keyed(s, [[beats.choice, 600, 120, 0.9], [beats.freeze, 600, 160, 0.8]]);

  const lampKicks = LAMPS.map((y) => track(y, [150, BOT], [beats.lightsOn[1], beats.lightsOn[0]]));
  const kick = impulse(f, [toOut(2), toOut(14), toOut(40), toOut(beats.hookEnd), toOut(beats.impact), toOut(beats.laugh[0]), toOut(beats.hands), toOut(beats.eyes[0]), toOut(beats.marks), toOut(beats.choice), toOut(110), toOut(146), toOut(390), toOut(580), ...lampKicks.map(toOut)], 4) * 20;
  const shake = handheld(f, hooking ? 7 : laughing && s < beats.hands ? 6 : 3, { x: kick * Math.sin(f * 3), y: kick * 0.6 });

  const punch = 1 + 0.08 * impulse(f, EMPH, 5);
  const freezeT = frozen ? frame - toOut(beats.freeze) : 0;
  const filter = frozen ? `grayscale(${Math.min(0.8, freezeT * 0.1)}) brightness(${Math.max(0.5, 1 - freezeT * 0.06)})` : undefined;
  const cardT = frame - Math.round(toOut(beats.cards));
  return (
    <AbsoluteFill style={{ backgroundColor: "#050506" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ filter }}>
        <Defs0 />
        <g transform={`translate(540 960) scale(${punch * (1 + freezeT * 0.0012)}) translate(-540 -960)`}>
          <g transform={cameraTransform(cam, shake)}>
            <Shaft frame={f} drop={0} cx={540} top={-2200} bottom={BOT + 600} speed={0} />
            {LAMPS.map((y) =>
              [-1, 1].map((sd) => (
                <g key={`${y}${sd}`}>
                  {lit(y) ? <circle cx={540 + sd * 560} cy={y} r={190} fill="url(#goldGlow0)" opacity={0.55} /> : null}
                  <rect x={540 + sd * 560 - 18} y={y - 12} width={36} height={24} rx={6} fill={lit(y) ? "#FFE08A" : "#2a2c31"} filter={lit(y) ? "url(#glow0)" : undefined} />
                </g>
              )),
            )}
            {/* the bottom: the door marked 0, and him lying in front of it */}
            <rect x={-1600} y={BOT} width={4200} height={800} fill="#14110c" />
            <rect x={1000} y={BOT - 420} width={240} height={420} fill="#2a2216" stroke="#8a7a55" strokeWidth={10} />
            <rect x={1012} y={BOT - 408} width={216} height={408} fill="#ffe7a6" opacity={0.25} />
            <rect x={1060} y={BOT - 560} width={120} height={100} rx={12} fill="#060607" stroke="#4a4f57" strokeWidth={5} />
            <Led x={1120} y={BOT - 478} text="0" size={92} on={0.6 + 0.4 * Math.abs(Math.sin(f * 0.15))} />
            <g transform={`translate(${tallX} ${tallY}) rotate(${tallRot}) translate(${-tallX} ${-tallY}) translate(0 ${laughing && s < beats.hands ? Math.abs(Math.sin(f * 0.9)) * -10 : 0})`}>
              <Tall x={tallX} y={tallY} scale={TALL.s} frame={f} eyes={landed ? 1 : 0.6} step={0} />
            </g>
            {/* the beam at the top, Theo on it */}
            <rect x={-800} y={0} width={2700} height={46} fill="#2b2e35" />
            <circle cx={head.x} cy={head.y + 80} r={320} fill="url(#tubeGlow0)" opacity={0.35} />
            {stretch > 0
              ? [L, R].map((a, i) => (
                  <g key={i}>
                    <line x1={a.hand.x} y1={a.hand.y} x2={a.end.x} y2={a.end.y} stroke="#111" strokeWidth={13} strokeLinecap="round" />
                    {[-0.35, 0, 0.35].map((d) => (
                      <line key={d} x1={a.end.x} y1={a.end.y} x2={a.end.x + Math.cos(a.a + d) * 40} y2={a.end.y + Math.sin(a.a + d) * 40} stroke="#111" strokeWidth={7} strokeLinecap="round" />
                    ))}
                  </g>
                ))
              : null}
            {marks > 0 ? (
              <g transform={`translate(${R.hand.x} ${R.hand.y}) rotate(${(R.a * 180) / Math.PI}) translate(20 -10)`} opacity={marks}>
                <Tallies x={0} y={0} cols={Math.max(1, Math.floor(stretch / 34))} rows={1} dx={34} dy={0} size={22} />
              </g>
            ) : null}
            <StickFigure pose={base} x={TX} y={0} scale={SC} frame={f} face={face(1, s < 40 ? 0.9 : 0.6, 0.8)} />
            {eyes > 0 ? (
              <g opacity={eyes} filter="url(#glow0)">
                <circle cx={head.x} cy={head.y} r={110} fill="url(#tubeGlow0)" opacity={0.6} />
                <circle cx={head.x - 4} cy={head.y - 6} r={9} fill="#f4f7ff" />
                <circle cx={head.x + 18} cy={head.y - 6} r={9} fill="#f4f7ff" />
                <path d={`M ${head.x - 12} ${head.y + 14} Q ${head.x + 8} ${head.y + 28} ${head.x + 28} ${head.y + 12}`} stroke="#f4f7ff" strokeWidth={4} fill="none" />
              </g>
            ) : null}
          </g>
        </g>
        {s >= beats.impact && s < beats.impact + 5 ? <rect width={1080} height={1920} fill="#fff" opacity={0.8 * (1 - (s - beats.impact) / 5)} /> : null}
        {s >= beats.eyes[1] && s < beats.eyes[1] + 3 ? <rect width={1080} height={1920} fill="#fff" opacity={0.5} /> : null}
        <rect width={1080} height={1920} fill="url(#vignette0)" />
        {frozen ? <rect width={1080} height={1920} fill="#fff" opacity={Math.max(0, 0.6 - freezeT * 0.12)} /> : null}
      </svg>
      <HookText frame={frame} until={Math.round(toOut(beats.hookEnd - 8))} lines={["I PUSHED IT.", "WHY DID THE", "LIGHTS COME BACK?"]} top={1300} />
      {s >= beats.lightsOn[0] ? <Lives frame={frame} from={Math.round(toOut(beats.lightsOn[0]))} left={1} /> : null}
      <ChoiceCards frame={frame} from={Math.round(toOut(beats.cards))} question="WHAT SHOULD THEO DO?" a="STAY. SAVE THEM ALL" b="JUMP. SAVE MYSELF" />
      {cardT >= 14 ? (
        <div style={{ position: "absolute", top: 1620, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontSize: 42, color: "#FFD43B", WebkitTextStroke: "9px #0a0a0a", paintOrder: "stroke fill", opacity: Math.min(1, (cardT - 14) / 6) }}>
          COMMENT A OR B · I&apos;LL DO WHAT YOU SAY
        </div>
      ) : null}
      <Captions frame={frame} chunks={timeline.captions} speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>} />
    </AbsoluteFill>
  );
};
