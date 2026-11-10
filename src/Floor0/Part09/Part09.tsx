import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { lerpPose, Pose, POSES, skeleton, StickFigure } from "../../shared/rig";
import { ACTION, cameraTransform, handheld, impulse, KAI, makeWarp, track } from "../../LastLight/kit";
import { face, worldOf } from "../../LastLight/bridge";
import { Captions, SPEAKERS } from "../../LastLight/Overlays";
import { Defs0, Kid, Led, Shaft } from "../elevator";
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
const CABLES = Array.from({ length: 14 }, (_, k) => 250 + (k - 5) * 230);
const SNAPX = 250;
const MINE = 710;
const EAR = 940;
const ROWS = [
  { scale: 0.42, dx: 60, shade: 0.72, cut: [2380, 2150, 1920, 1690, 1460] },
  { scale: 0.64, dx: 140, shade: 0.5, cut: [] as number[] },
];
const numOf = (x: number) => String(Math.floor(rand(x) * 1200)).padStart(4, "0");

type Cam = { fx: number; fy: number; z: number };
type Shot0 = { from: number; to: number; keys: [number, number, number, number][] };
const at = (shot: Shot0, s: number): Cam => {
  const f = shot.keys.map((k) => k[0]);
  const v = (i: number) => track(s, f, shot.keys.map((k) => k[i]));
  return { fx: v(1), fy: v(2), z: v(3) };
};
// shots in the cable room (the cutaways below have their own cameras)
const SHOTS: Shot0[] = [
  { from: 0, to: 18, keys: [[0, 1160, 1160, 2.0], [18, 1150, 1150, 1.7]] },
  { from: 86, to: 170, keys: [[86, 1180, 1160, 1.15], [170, 1130, 1110, 0.9]] },
  { from: 170, to: 236, keys: [[170, 820, 840, 0.62], [236, 820, 820, 0.56]] },
  { from: 236, to: 294, keys: [[236, EAR, 1080, 1.4], [294, EAR - 10, 1020, 2.5]] },
  { from: 440, to: 492, keys: [[440, 1130, 1160, 1.0], [492, 1150, 1150, 1.1]] },
  { from: 766, to: 800, keys: [[766, MINE, tagY(MINE) - 20, 2.0], [800, MINE, tagY(MINE) - 10, 2.6]] },
  { from: 800, to: 9999, keys: [[800, 760, 920, 0.74], [874, 780, 930, 0.64]] },
];

const HOLD: Pose = { ...KAI.watch, rUA: 50, rFA: 110 };
const LEAN: Pose = { ...KAI.watch, lean: 12, tilt: 30, duck: 0.2, rUA: 30, rFA: 70 };
const CUT: Pose = { ...POSES.stand, lean: 6, tilt: -6, rUA: 104, rFA: 96, lUA: 60, lFA: 100 };
const TORN: Pose = { ...CUT, lean: 0, tilt: 8, duck: 0.25 };

// The bottom of the shaft: a wrecked car, and a doorway lit from inside with a 0 above it
const Bottom: React.FC<{ frame: number; s: number }> = ({ frame, s }) => {
  const t = s - beats.door;
  return (
    <g>
      <rect x={-1600} y={-1400} width={4200} height={5000} fill="#060709" />
      <rect x={-1600} y={1500} width={4200} height={1600} fill="#14110c" />
      <polygon points="560,1060 840,1060 1300,1500 100,1500" fill="#ffd98a" opacity={0.12} />
      {/* the wrecked car, doors bent open */}
      <g transform="rotate(-6 200 1500)">
        <rect x={-30} y={1000} width={460} height={500} fill="#3a3f47" stroke="#8a919b" strokeWidth={10} />
        <rect x={60} y={1080} width={120} height={420} fill="#6d7581" transform="rotate(-12 60 1500)" />
        <rect x={250} y={1080} width={120} height={420} fill="#6d7581" transform="rotate(10 370 1500)" />
        <path d="M -30 1000 L 80 960 L 190 1000" stroke="#9aa3ad" strokeWidth={8} fill="none" />
      </g>
      {/* the door to Floor Zero */}
      <rect x={570} y={1060} width={260} height={440} fill="#2a2216" stroke="#8a7a55" strokeWidth={12} />
      <rect x={582} y={1072} width={236} height={428} fill="#ffe7a6" opacity={0.75 + 0.15 * Math.sin(frame * 0.2)} />
      <circle cx={700} cy={1290} r={420} fill="url(#goldGlow0)" opacity={0.55} />
      <rect x={640} y={930} width={120} height={100} rx={12} fill="#060607" stroke="#4a4f57" strokeWidth={5} />
      <Led x={700} y={1012} text="0" size={92} on={0.6 + 0.4 * Math.abs(Math.sin(frame * 0.15))} />
      {/* Theos who fell before him, walking in */}
      {[0, 1, 2].map((i) => {
        const x = track(t - i * 18, [0, 70], [250, 700]);
        const fade = track(x, [600, 700], [1, 0]);
        return (
          <g key={i} opacity={fade}>
            <StickFigure pose={{ ...POSES.stand, lean: 6, lUA: -20 + Math.sin(frame * 0.3 + i) * 20, rUA: 20 - Math.sin(frame * 0.3 + i) * 20 }} x={x} y={1500} scale={0.8} frame={frame + i * 9} face={face(0, 0, 0)} />
          </g>
        );
      })}
    </g>
  );
};

// Down below: another Theo's car hanging on its cable, fists on the roof, CUT IT scratched into the steel
const Below: React.FC<{ frame: number; s: number }> = ({ frame, s }) => {
  const bang = impulse(s, beats.bangs, 3);
  const arm = Math.sin(frame * 0.6) > 0;
  return (
    <g>
      <Shaft frame={frame} drop={0} cx={540} top={-1400} bottom={3200} speed={0} />
      <path d={`M 540 -1400 Q ${540 + Math.sin(frame * 0.9) * 14 + bang * 10} 0 540 1100`} stroke="#9aa3ad" strokeWidth={9} fill="none" />
      <g transform={`translate(${Math.sin(frame * 2.1) * bang * 6} 0)`}>
        <rect x={310} y={1100} width={460} height={560} fill="#3a3f47" stroke="#8a919b" strokeWidth={10} />
        <path d={`M 310 1100 Q 540 ${1100 - bang * 30} 770 1100`} stroke="#8a919b" strokeWidth={10} fill="#3a3f47" />
        <text x={540} y={1196} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize={64} fill="none" stroke="#e9eef4" strokeWidth={4} transform="rotate(-4 540 1180)">
          CUT IT
        </text>
        <rect x={390} y={1220} width={300} height={380} fill="#d9c27e" opacity={0.85} />
        <StickFigure pose={arm ? ACTION.reachUp : ACTION.strain} x={540} y={1600} scale={0.95} frame={frame} face={face(1, 1, 1)} />
      </g>
    </g>
  );
};

export const Part09: React.FC = () => {
  const frame = useCurrentFrame();
  const sLive = toStory(frame);
  const frozen = sLive >= beats.freeze;
  const s = frozen ? beats.freeze : sLive;
  const f = frozen ? Math.round(toOut(beats.freeze)) : frame;
  const hooking = s < beats.hookEnd;
  const below = s >= beats.below[0] && s < beats.below[1];
  const falling = s >= beats.fall[0] && s < beats.door;
  const bottom = s >= beats.door && s < beats.choice;

  const kick = impulse(f, [toOut(2), toOut(14), toOut(40), toOut(beats.hookEnd), toOut(beats.shake[1]), toOut(beats.below[0]), toOut(beats.why), toOut(beats.girl[0]), toOut(beats.fall[0]), toOut(beats.door), toOut(beats.choice), toOut(beats.wide), ...beats.bangs.map(toOut)], 4) * 22;
  const shakeAmt = track(s, [beats.shake[0], beats.shake[1], beats.why, beats.why + 40, beats.choice, beats.wide], [0, 1, 1, 0.3, 0.3, 0.8]);
  const shake = handheld(f, hooking ? 8 : 3 + shakeAmt * 4 + (falling ? 6 : 0), { x: kick * Math.sin(f * 3), y: kick * 0.6 });

  // ---------- Theo: lunges, takes the shears, listens, and finally holds them open at his own cable ----------
  const tx = s < beats.choice ? track(s, [0, 14, beats.lean[0], beats.lean[1]], [560, 1040, 1040, EAR - 90]) : MINE - 150;
  const base: Pose =
    s < 14
      ? KAI.push
      : s < beats.lean[0]
        ? lerpPose(KAI.push, HOLD, track(s, [14, 30], [0, 1]))
        : s < beats.why
          ? lerpPose(HOLD, LEAN, track(s, beats.lean, [0, 1]))
          : s < beats.choice
            ? { ...HOLD, tilt: 10 + Math.sin(f * 0.1) * 4, duck: 0.25 }
            : s < beats.wide
              ? CUT
              : { ...TORN, tilt: TORN.tilt + Math.sin(f * 0.2) * 7, rUA: TORN.rUA + Math.sin(f * 0.3) * 6 };
  const tFace = face(1, s < beats.hookEnd || s >= beats.choice ? 0.8 : 0.4, 0.8);
  const sk = skeleton(base);
  const hand = worldOf(base, "rHand", tx, AF, SC, false);
  const fa = Math.atan2(sk.rHand.x - sk.rElbow.x, sk.rHand.y - sk.rElbow.y) * (180 / Math.PI);

  // ---------- the girl: loses the shears, steps back into the light, smiles, speaks ----------
  const kx = track(s, beats.back, [1250, 1370]);
  const herHand = { x: kx + 46 * KS, y: AF - 150 * KS };
  const fly = track(s, [2, 12], [0, 1]);
  const shearsAt = s < 12 ? { x: herHand.x + (hand.x - herHand.x) * fly, y: herHand.y + (hand.y - herHand.y) * fly, a: 8 + 160 * fly } : { x: hand.x, y: hand.y, a: -fa };
  const speaking = s >= beats.girl[0] && s < beats.girl[1];
  const lampOn = speaking ? (Math.floor(f / 3) % 7 ? 1 : 0.3) : 1;
  const open = s >= beats.choice ? 0.7 : 0.1 + 0.06 * Math.sin(f * 0.2);

  // ---------- camera ----------
  const headY = AF + sk.head.y * SC;
  let cam: Cam;
  if (s >= 18 && s < 40) cam = { fx: hand.x, fy: hand.y, z: track(s, [18, 40], [2.4, 2.8]) };
  else if (s >= 40 && s < beats.hookEnd) cam = { fx: kx, fy: AF - 370 * KS, z: track(s, [40, beats.hookEnd], [2.6, 3.2]) };
  else if (s >= beats.why && s < 440) cam = { fx: tx + 30, fy: headY, z: track(s, [beats.why, 440], [2.2, 2.6]) };
  else if (speaking || (s >= beats.girl[0] && s < beats.fall[0])) cam = { fx: kx, fy: track(s, beats.girl, [1060, 1030]), z: track(s, beats.girl, [1.6, 2.8]) };
  else {
    const shot = SHOTS.find((sh) => s >= sh.from && s < sh.to) ?? SHOTS[SHOTS.length - 1];
    cam = at(shot, s);
  }

  const punch = 1 + 0.08 * impulse(f, EMPH, 5);
  const freezeT = frozen ? frame - toOut(beats.freeze) : 0;
  const filter = frozen ? `grayscale(${Math.min(0.8, freezeT * 0.1)}) brightness(${Math.max(0.5, 1 - freezeT * 0.06)})` : undefined;
  const fallT = s - beats.fall[0];
  return (
    <AbsoluteFill style={{ backgroundColor: "#050506" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ filter }}>
        <Defs0 />
        <g transform={`translate(540 960) scale(${punch * (1 + freezeT * 0.0012)}) translate(-540 -960)`}>
          {below ? (
            <g transform={cameraTransform({ fx: 540, fy: track(s, beats.below, [500, 1180]), z: track(s, beats.below, [0.8, 1.3]) }, shake)}>
              <Below frame={f} s={s} />
            </g>
          ) : falling ? (
            // the only way down: falling, floor numbers streaming up past us
            <g transform={cameraTransform({ fx: 540, fy: 960, z: track(fallT, [0, 90], [0.9, 1.3]) }, shake)}>
              <Shaft frame={f} drop={fallT * 70 + fallT * fallT * 1.4} cx={540} top={-1200} bottom={3200} speed={70 + fallT * 1.5} />
              {/* a Theo tumbling down after his cut cable */}
              <path d={`M 540 -1200 Q ${540 + Math.sin(f * 0.7) * 120} 300 ${560 + Math.sin(f * 0.5) * 40} 760`} stroke="#9aa3ad" strokeWidth={10} fill="none" />
              <circle cx={540} cy={1250} r={520} fill="url(#goldGlow0)" opacity={0.35 + fallT * 0.006} />
              <g transform={`rotate(${fallT * 9} 540 1250)`}>
                <StickFigure pose={{ ...KAI.flinch, lUA: 150 + Math.sin(f * 0.6) * 20, rUA: -150 - Math.sin(f * 0.6) * 20 }} x={540} y={1530} scale={2.1} frame={f} face={face(1, 1, 1)} />
              </g>
            </g>
          ) : bottom ? (
            <g transform={cameraTransform({ fx: track(s, [beats.door, beats.choice], [560, 690]), fy: track(s, [beats.door, beats.choice], [1200, 1240]), z: track(s, [beats.door, beats.choice], [0.72, 1.5]) }, shake)}>
              <Bottom frame={f} s={s} />
            </g>
          ) : (
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
                    const gone = row.cut.some((cx) => Math.abs(cx - x) < 116);
                    return <Cable key={k} x={x} frame={f} num={numOf(x + r * 7)} cut={gone ? 400 : -1} shake={shakeAmt} />;
                  })}
                  <rect x={-2600} y={AF} width={6400} height={1600} fill="#0d1014" />
                  <rect x={-2600} y={-1400} width={6400} height={4000} fill="#08090c" opacity={row.shade} />
                </g>
              ))}
              {[-450, 380, 1340, 2050].map((x) => (
                <AtticLamp key={x} x={x} frame={f} on={x === 1340 ? lampOn : 0.55 + 0.1 * Math.sin(f * 0.3 + x)} />
              ))}
              {CABLES.map((x) => (
                <Cable key={x} x={x} frame={f} mine={x === MINE} num={x === MINE ? "1201" : numOf(x)} cut={x === SNAPX ? 400 : -1} shake={x === EAR && s >= beats.lean[1] && s < beats.why ? 1.4 : shakeAmt} />
              ))}
              <g transform={`translate(${kx} 0) scale(-1 1) translate(${-kx} 0)`}>
                <Kid x={kx} y={AF} scale={KS} frame={f} hold={speaking ? 1 : 0.3} glow={speaking ? 1 : 0.3} smile={1} tilt={Math.sin(f * 0.05) * 4 + (speaking ? Math.sin(f * 0.3) * 3 : 0)} />
              </g>
              <StickFigure pose={base} x={tx} y={AF} scale={SC} frame={f} face={tFace} />
              <g transform={`translate(${shearsAt.x} ${shearsAt.y}) rotate(${shearsAt.a}) scale(${KS * 0.9})`}>
                <Shears open={open} />
              </g>
              <rect x={-2600} y={AF} width={6400} height={1800} fill="#0d1115" />
              <rect x={-2600} y={AF} width={6400} height={10} fill="#22272e" />
              <rect x={490} y={AF - 6} width={220} height={20} fill="#bfe3f2" opacity={0.85} />
            </g>
          )}
        </g>
        {s >= beats.door && s < beats.door + 5 ? <rect width={1080} height={1920} fill="#fff" opacity={0.85 * (1 - (s - beats.door) / 5)} /> : null}
        <rect width={1080} height={1920} fill="url(#vignette0)" />
        {frozen ? <rect width={1080} height={1920} fill="#fff" opacity={Math.max(0, 0.6 - freezeT * 0.12)} /> : null}
      </svg>
      <HookText frame={frame} until={Math.round(toOut(beats.hookEnd - 10))} lines={["I TOOK THEM.", "SO WHY IS", "SHE SMILING?"]} top={1300} />
      {!hooking ? <Badge0 frame={frame - Math.round(toOut(beats.hookEnd))} part={9} title="LET GO" until={65} /> : null}
      {!hooking ? <Lives frame={frame} from={Math.round(toOut(beats.hookEnd))} left={2} /> : null}
      <ChoiceCards frame={frame} from={Math.round(toOut(beats.cards))} question="WHAT SHOULD THEO CUT?" a="MY OWN CABLE" b="ALL OF THEM" />
      <Captions frame={frame} chunks={timeline.captions} speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>} />
    </AbsoluteFill>
  );
};
