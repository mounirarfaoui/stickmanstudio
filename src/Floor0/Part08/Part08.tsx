import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { lerpPose, Pose, POSES, skeleton, StickFigure } from "../../shared/rig";
import { cameraTransform, handheld, impulse, KAI, makeWarp, track } from "../../LastLight/kit";
import { face } from "../../LastLight/bridge";
import { Captions, SPEAKERS } from "../../LastLight/Overlays";
import { Defs0, Kid, Shaft } from "../elevator";
import { ControlRoom, CTRL } from "../control";
import { AF, AtticLamp, Cable, rand, ROOF, Shears, tagY } from "../attic";
import { Badge0, ChoiceCards, EndCard0, HookText, Lives } from "../ui";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toOut, toStory } = makeWarp(timeline);
const EMPH = timeline.captions.flatMap((c) => c.words.filter((w) => w.emph).map((w) => w.frame));

const SC = 1.45;

// ---------- below: the control room, the ladder up through the hatch ----------
const F = CTRL.floor;
const HATCH = { x: 210, w: 240, y: 60 };
const CENTRE = { x: 448, y: 697 };

// ---------- above: the cable room ----------
const HOLE = 600;
const CABLES = Array.from({ length: 14 }, (_, k) => 250 + (k - 5) * 230);
const SNAPX = 250;
const MINE = 710;
const ROWS = [
  { scale: 0.42, dx: 60, shade: 0.72, snips: [2380, 2150, 1920, 1690, 1460] },
  { scale: 0.64, dx: 140, shade: 0.5, snips: [] as number[] },
];
const KX = (s: number) => track(s, [beats.steps[0], beats.reveal - 6], [2500, 1250]);
const KS = 1.3;

type Cam = { fx: number; fy: number; z: number };
type Shot0 = { from: number; to: number; keys: [number, number, number, number][] };
const SHOTS: Shot0[] = [
  // the attic: Theo comes up through the floor, then the whole room of cables
  { from: 182, to: 222, keys: [[182, HOLE, 1240, 1.7], [222, HOLE, 1200, 1.5]] },
  { from: 222, to: 290, keys: [[222, 700, 820, 0.62], [290, 700, 800, 0.56]] },
  { from: 290, to: 345, keys: [[290, 940, tagY(940), 1.4], [325, 940, tagY(940) + 10, 3.6], [345, 940, tagY(940) + 10, 3.8]] },
  { from: 345, to: 384, keys: [[345, 380, 820, 0.95], [384, 330, 760, 1.05]] },
  { from: 384, to: 420, keys: [[384, SNAPX, 700, 1.5], [420, SNAPX + 60, 900, 1.1]] },
  { from: 560, to: 600, keys: [[560, 760, 1000, 0.8], [600, 820, 980, 0.72]] },
  { from: 600, to: 760, keys: [[600, 1450, 960, 0.6], [760, 1320, 1020, 0.82]] },
  { from: 760, to: 815, keys: [[760, 1250, 1180, 1.3], [782, 1250, 1120, 2.1], [815, 1250, 1110, 2.3]] },
  { from: 815, to: 880, keys: [[815, 1170, 1180, 1.5], [880, 1150, 1170, 1.7]] },
  { from: 880, to: 930, keys: [[880, 1150, 1170, 1.5], [905, MINE, tagY(MINE), 3.0], [930, MINE, tagY(MINE), 3.4]] },
  { from: 930, to: 9999, keys: [[930, 900, 1230, 1.02], [1012, 910, 1240, 1.15]] },
];
const camAt = (shot: Shot0, s: number): Cam => {
  const f = shot.keys.map((k) => k[0]);
  const at = (i: number) => track(s, f, shot.keys.map((k) => k[i]));
  return { fx: at(1), fy: at(2), z: at(3) };
};

// climbing: hands over hands, one knee up, then the other
const CLIMB_A: Pose = { ...POSES.stand, lean: 6, tilt: -22, lUA: 168, lFA: 176, rUA: 128, rFA: 150, lTh: 78, lSh: 4, rTh: -4, rSh: -4 };
const CLIMB_B: Pose = { ...CLIMB_A, lUA: 128, lFA: 150, rUA: 168, rFA: 176, lTh: -4, lSh: -4, rTh: 78, rSh: 4 };
const climbPose = (f: number) => lerpPose(CLIMB_A, CLIMB_B, 0.5 + 0.5 * Math.sin(f * 0.42));
const LOOKUP: Pose = { ...POSES.stand, lean: -8, tilt: -30, duck: 0.1, lUA: -30, lFA: -20, rUA: 30, rFA: 20 };
const TORN: Pose = { ...POSES.stand, lean: 4, tilt: 6, duck: 0.3, rUA: 70, rFA: 86, lUA: -62, lFA: -74, lTh: -14, lSh: -6, rTh: 14, rSh: 4 };

export const Part08: React.FC = () => {
  const frame = useCurrentFrame();
  const sLive = toStory(frame);
  const frozen = sLive >= beats.freeze;
  const s = frozen ? beats.freeze : sLive;
  const f = frozen ? Math.round(toOut(beats.freeze)) : frame;
  const hooking = s < beats.hookEnd;
  const below = s < beats.emerge[0];
  const falling = s >= beats.fall[0] && s < 560;

  const kick =
    impulse(f, [toOut(2), toOut(30), toOut(65), toOut(beats.doors[1]), toOut(beats.emerge[0]), toOut(222), toOut(beats.snap), toOut(beats.fall[0]), toOut(560), ...beats.snips.map(toOut), toOut(beats.reveal), toOut(beats.point[0])], 4) * 22;
  const bang = s >= beats.snap && s < beats.snap + 24 ? 3.5 : falling ? 2.4 : 1;
  const shake = handheld(f, hooking ? 8 : 3 * bang, { x: kick * Math.sin(f * 3), y: kick * 0.6 });

  // ---------- Theo ----------
  const feetBelow = track(s, beats.climb, [1020, 110]);
  const feetAbove = track(s, beats.emerge, [AF + 460, AF]);
  const tx = below ? HATCH.x - 10 : track(s, [beats.emerge[1], beats.emerge[1] + 18], [HOLE, HOLE - 50]);
  const ty = below ? feetBelow : feetAbove;
  const snapT = s - beats.snap;
  const base: Pose =
    s < beats.emerge[1]
      ? climbPose(f)
      : s < beats.snap
        ? lerpPose(KAI.watch, LOOKUP, 0.5 + 0.5 * Math.sin(f * 0.04))
        : s < beats.snap + 40
          ? KAI.flinch
          : s < beats.reveal
            ? { ...KAI.watch, tilt: 10, duck: 0.25 }
            : s < beats.reveal + 30
              ? KAI.flinch
              : s < beats.choice
                ? { ...KAI.watch, lean: -10, tilt: 4, duck: 0.35 }
                : { ...TORN, lean: TORN.lean + Math.sin(f * 0.2) * 7, rUA: TORN.rUA + Math.sin(f * 0.3) * 8 };
  const tFace = face(1, s < beats.hookEnd || (snapT >= 0 && snapT < 40) || (s >= beats.reveal && s < beats.reveal + 30) ? 0.8 : 0.4, 0.8);
  const sk = skeleton(base);
  const headY = ty + sk.head.y * SC;

  // ---------- camera ----------
  let cam: Cam;
  if (s < 30) cam = { fx: tx + 40, fy: headY + 30, z: track(s, [0, 30], [2.5, 2.1]) };
  else if (s < 65) cam = { fx: 300, fy: 700, z: track(s, [30, 65], [0.74, 0.68]) };
  else if (s < beats.hookEnd) cam = { fx: tx + 20, fy: headY - 120, z: track(s, [65, beats.hookEnd], [1.6, 1.9]) };
  else if (s < 170) cam = { fx: -40, fy: 1000, z: track(s, [beats.hookEnd, 170], [0.82, 0.95]) };
  else if (below) cam = { fx: HATCH.x, fy: track(s, [170, 182], [500, 160]), z: track(s, [170, 182], [1.1, 1.7]) };
  else {
    const shot = SHOTS.find((sh) => s >= sh.from && s < sh.to) ?? SHOTS[SHOTS.length - 1];
    cam = camAt(shot, s);
  }

  // ---------- the girl ----------
  const kx = KX(s);
  const kWalk = s >= beats.steps[0] && s < beats.reveal ? Math.abs(Math.sin(s * 0.22)) : 0;
  const snipOpen = beats.snips.reduce((o, b) => (s >= b - 8 && s < b ? Math.max(o, (s - b + 8) / 8) : o), 0.15);
  const lit = s >= beats.reveal ? (s < beats.reveal + 8 ? (Math.floor(s) % 3 ? 1 : 0.2) : 1) : 0;
  const hold = track(s, beats.keyUp, [0, 1]);
  const shearAngle = track(s, beats.point, [8, 114]);
  const hand = { x: kx + 46 * KS, y: AF - 150 * KS };

  // ---------- below: the doors shut on the new Theo ----------
  const doorOpen = track(s, beats.doors, [1, 0]);
  const creep = track(s, [beats.doors[0], beats.dark], [0.55, 1]);

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
          {falling ? (
            // somewhere below: another elevator, its cable gone, dropping
            <g transform={cameraTransform({ fx: 540, fy: 960, z: track(fallT, [0, 140], [0.8, 1.15]) }, shake)}>
              <Shaft frame={f} drop={fallT * 50 + fallT * fallT * 0.4} cx={540} top={-1200} bottom={3200} speed={50 + fallT * 0.8} />
              <path d={`M 540 520 Q ${540 + Math.sin(f * 0.5) * 60} 200 ${540 - Math.sin(f * 0.4) * 40} -400`} stroke="#9aa3ad" strokeWidth={8} fill="none" />
              <g transform={`translate(${540 + Math.sin(f * 1.7) * 6} 960)`}>
                <rect x={-230} y={-440} width={460} height={560} fill="#3a3f47" stroke="#8a919b" strokeWidth={10} />
                <rect x={-150} y={-340} width={300} height={360} fill="#d9c27e" opacity={0.85} />
                <line x1={0} y1={-340} x2={0} y2={20} stroke="#6d7581" strokeWidth={8} />
                <g transform="translate(-40 10) scale(0.62)">
                  <StickFigure pose={{ ...KAI.flinch, tilt: -30 + Math.sin(f * 0.5) * 8 }} x={0} y={0} scale={1} frame={f} face={face(1, 0.9, 0.9)} />
                </g>
              </g>
              {Array.from({ length: 16 }, (_, i) => (
                <circle key={i} cx={540 + (i % 2 ? -236 : 236)} cy={540 + ((i * 47 + f * 9) % 260)} r={i % 3 ? 4 : 7} fill={i % 2 ? "#ffcf6b" : "#fff"} filter="url(#glow0)" />
              ))}
            </g>
          ) : below ? (
            <g transform={cameraTransform(cam, shake)}>
              <ControlRoom frame={f} alarm={0} swing={0.1} talk={0} pressed girl={1} wake={1} headset stare={1} girlSmile={-1}>
                {/* the ceiling with its open hatch; the light from above */}
                <rect x={-2200} y={-1400} width={5500} height={1400 + HATCH.y} fill="#0d1014" />
                <rect x={HATCH.x - HATCH.w / 2} y={HATCH.y - 30} width={HATCH.w} height={30} fill="#fff6d8" />
                <polygon points={`${HATCH.x - HATCH.w / 2},${HATCH.y} ${HATCH.x + HATCH.w / 2},${HATCH.y} ${HATCH.x + 300},${F} ${HATCH.x - 300},${F}`} fill="#fff3c4" opacity={0.16} />
                <g stroke="#8a919b" strokeWidth={10} strokeLinecap="round">
                  <line x1={HATCH.x - 50} y1={HATCH.y} x2={HATCH.x - 50} y2={HATCH.y + 880} />
                  <line x1={HATCH.x + 50} y1={HATCH.y} x2={HATCH.x + 50} y2={HATCH.y + 880} />
                  {Array.from({ length: 14 }, (_, i) => (
                    <line key={i} x1={HATCH.x - 50} y1={HATCH.y + 50 + i * 62} x2={HATCH.x + 50} y2={HATCH.y + 50 + i * 62} strokeWidth={7} />
                  ))}
                </g>
                {/* the doors sliding shut behind him */}
                <rect x={-322} y={778} width={192 * (1 - doorOpen)} height={722} fill="#6d7581" />
                <rect x={62 - 192 * (1 - doorOpen)} y={778} width={192 * (1 - doorOpen)} height={722} fill="#6d7581" />
                {/* on the centre screen: the new Theo, and the dark taking him */}
                <g transform={`translate(${CENTRE.x - 44} ${CENTRE.y + 43}) scale(0.26)`}>
                  <StickFigure pose={{ ...KAI.flinch, tilt: -30 + Math.sin(f * 0.4) * 8 }} x={0} y={0} scale={1} frame={f} face={face(1, 0.7, 0.8)} />
                </g>
                <rect x={CENTRE.x + 68 - 136 * creep} y={CENTRE.y - 57} width={136 * creep} height={114} fill="#07090c" opacity={0.94} />
                <circle cx={CENTRE.x + 68 - 136 * creep + 9} cy={CENTRE.y - 31} r={2.2} fill="#fff" />
                <circle cx={CENTRE.x + 68 - 136 * creep + 16} cy={CENTRE.y - 32} r={2.2} fill="#fff" />
                <StickFigure pose={base} x={tx} y={ty} scale={SC} frame={f} face={tFace} />
                <rect x={-2200} y={-1400} width={5500} height={1400 + HATCH.y - 30} fill="#0d1014" />
              </ControlRoom>
            </g>
          ) : (
            <g transform={cameraTransform(cam, shake)}>
              {/* the cable room above the top floor */}
              <rect x={-2600} y={-1400} width={6400} height={5000} fill="#08090c" />
              <rect x={-2600} y={-1400} width={6400} height={1400 + ROOF - 30} fill="#0e1116" />
              {Array.from({ length: 30 }, (_, i) => (
                <rect key={i} x={-2600 + i * 220} y={ROOF - 70} width={40} height={40} fill="#1a1d23" />
              ))}
              {ROWS.map((row, r) => (
                <g key={r} transform={`translate(${540 + row.dx} 760) scale(${row.scale}) translate(-540 -760)`}>
                  {Array.from({ length: 22 }, (_, k) => {
                    const x = -1600 + k * 230;
                    const hit = row.snips.findIndex((sx) => Math.abs(sx - x) < 116);
                    const cut = hit >= 0 && s >= beats.snips[hit] ? s - beats.snips[hit] : -1;
                    return <Cable key={k} x={x} frame={f} num={String(Math.floor(rand(x + r * 7) * 1200)).padStart(4, "0")} cut={cut} />;
                  })}
                  {row.snips.map((sx, i) => {
                    const t = s - beats.snips[i];
                    return t >= 0 && t < 10 ? <circle key={i} cx={sx} cy={700} r={120} fill="url(#goldGlow0)" opacity={1 - t / 10} /> : null;
                  })}
                  <rect x={-2600} y={AF} width={6400} height={1600} fill="#0d1014" />
                  <rect x={-2600} y={-1400} width={6400} height={4000} fill="#08090c" opacity={row.shade} />
                </g>
              ))}
              {[-450, 380, 1250, 2050].map((x) => (
                <AtticLamp key={x} x={x} frame={f} on={x === 1250 ? lit : 0.55 + 0.1 * Math.sin(f * 0.3 + x)} />
              ))}
              {CABLES.map((x) => (
                <Cable key={x} x={x} frame={f} mine={x === MINE} num={x === MINE ? "1201" : String(Math.floor(rand(x) * 1200)).padStart(4, "0")} cut={x === SNAPX && snapT >= 0 ? snapT : -1} />
              ))}
              {snapT >= 0 && snapT < 26
                ? Array.from({ length: 20 }, (_, i) => {
                    const a = (i / 20) * Math.PI * 2 + i;
                    const d = snapT * (7 + (i % 5) * 3);
                    return <circle key={i} cx={SNAPX + Math.cos(a) * d} cy={700 + Math.sin(a) * d + snapT * snapT * 0.4} r={i % 3 ? 4 : 7} fill={i % 2 ? "#ffcf6b" : "#dff2ff"} opacity={1 - snapT / 26} filter="url(#glow0)" />;
                  })
                : null}
              {/* the girl: a shadow with lit eyes until the lamp over her comes on */}
              {s >= beats.steps[0] ? (
                <g>
                  <g transform={`translate(${kx} ${-kWalk * 8}) scale(-1 1) translate(${-kx} 0)`} style={{ filter: lit > 0.5 ? undefined : "brightness(0.12)" }}>
                    <Kid x={kx} y={AF} scale={KS} frame={f} hold={hold} glow={hold} smile={1} tilt={Math.sin(f * 0.05) * 4} />
                  </g>
                  {lit < 0.5 ? (
                    <g filter="url(#glow0)">
                      <circle cx={kx + 16 * KS} cy={AF - 326 * KS - kWalk * 8} r={6} fill="#fff" />
                      <circle cx={kx - 16 * KS} cy={AF - 326 * KS - kWalk * 8} r={6} fill="#fff" />
                    </g>
                  ) : null}
                  <g transform={`translate(${hand.x} ${hand.y - kWalk * 8}) rotate(${shearAngle}) scale(${KS * 0.9})`} style={{ filter: lit > 0.5 ? undefined : "brightness(0.25)" }}>
                    <Shears open={snipOpen} />
                  </g>
                </g>
              ) : null}
              <StickFigure pose={base} x={tx} y={ty} scale={SC} frame={f} face={tFace} />
              {/* the floor, the hatch he came up through, the light from the screens below */}
              <rect x={-2600} y={AF} width={6400} height={1800} fill="#0d1115" />
              <rect x={-2600} y={AF} width={6400} height={10} fill="#22272e" />
              <rect x={HOLE - 110} y={AF - 6} width={220} height={20} fill="#bfe3f2" opacity={0.85} />
              <circle cx={HOLE} cy={AF} r={220} fill="url(#tubeGlow0)" opacity={0.5} />
              <g stroke="#8a919b" strokeWidth={10} strokeLinecap="round">
                <line x1={HOLE - 50} y1={AF - 90} x2={HOLE - 50} y2={AF} />
                <line x1={HOLE + 50} y1={AF - 90} x2={HOLE + 50} y2={AF} />
                <line x1={HOLE - 50} y1={AF - 40} x2={HOLE + 50} y2={AF - 40} strokeWidth={7} />
              </g>
            </g>
          )}
        </g>
        {snapT >= 0 && snapT < 5 ? <rect width={1080} height={1920} fill="#fff" opacity={0.85 * (1 - snapT / 5)} /> : null}
        {s >= beats.reveal && s < beats.reveal + 4 ? <rect width={1080} height={1920} fill="#fff" opacity={0.6} /> : null}
        <rect width={1080} height={1920} fill="url(#vignette0)" />
        {frozen ? <rect width={1080} height={1920} fill="#fff" opacity={Math.max(0, 0.6 - freezeT * 0.12)} /> : null}
      </svg>
      <HookText frame={frame} until={Math.round(toOut(beats.hookEnd - 10))} lines={["1,200 DEATHS.", "WHY IS THERE", "A LADDER UP?"]} top={1300} />
      {!hooking ? <Badge0 frame={frame - Math.round(toOut(beats.hookEnd))} part={8} title="THE CABLES" until={65} /> : null}
      {!hooking ? <Lives frame={frame} from={Math.round(toOut(beats.hookEnd))} left={2} /> : null}
      <ChoiceCards frame={frame} from={Math.round(toOut(beats.cards))} question="WHAT SHOULD THEO DO?" a="TAKE THE KEY" b="GRAB THE SHEARS" />
      <Captions frame={frame} chunks={timeline.captions} speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>} />
      <EndCard0 frame={frame} from={Math.round(toOut(beats.card))} part={8} />
    </AbsoluteFill>
  );
};
