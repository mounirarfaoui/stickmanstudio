import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { GAITS, lerpPose, Pose, POSES, Skeleton, StickFigure, walkPose } from "../../shared/rig";
import { ACTION, cameraTransform, clamp01, handheld, impulse, KAI, makeWarp, track } from "../../LastLight/kit";
import { face, P78 } from "../../LastLight/bridge";
import { Captions, FONT, SPEAKERS } from "../../LastLight/Overlays";
import { Car, Defs0 } from "../elevator";
import { NoticeWall, PanelClose } from "../closeups";
import { Badge0, ChoiceCards, DoorTimer, EndCard0, Lives } from "../ui";
import { BACK, BEDS, FLOOR, HX, WardRoom } from "../ward";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toOut, toStory } = makeWarp(timeline);
const EMPH = timeline.captions.flatMap((c) => c.words.filter((w) => w.emph).map((w) => w.frame));

const CX = 540;
const CY = 1500;
const TS = 1.55;
const HEAD = { x: HX - 245, y: FLOOR - 170 };
const DOOR = HX - 1900;
const TX0 = HX - 470;
const dragX = (s: number) => track(s, beats.drag, [TX0, DOOR + 40]);

type SetName = "ward" | "wall" | "car" | "panel" | "face";
type Shot0 = { from: number; to: number; set: SetName; keys: [number, number, number, number][] };
const SHOTS: Shot0[] = [
  { from: 0, to: 45, set: "ward", keys: [[0, HX - 480, 1180, 1.1], [45, HX - 530, 1230, 1.5]] },
  { from: 45, to: 90, set: "ward", keys: [[45, HX - 420, 1200, 1.15], [90, HX - 420, 1250, 1.35]] },
  { from: 90, to: 175, set: "ward", keys: [[90, HX - 340, 1130, 1.6], [175, HX - 330, 1140, 2.0]] },
  { from: 175, to: 265, set: "face", keys: [[175, HEAD.x, HEAD.y - 110, 3.2], [265, HEAD.x, HEAD.y - 110, 4.4]] },
  { from: 265, to: 320, set: "ward", keys: [[265, HX - 300, 1110, 1.6], [320, HX - 280, 1120, 1.95]] },
  { from: 320, to: 395, set: "wall", keys: [[320, -220, 900, 1.05], [395, -60, 1200, 1.2]] },
  { from: 395, to: 490, set: "ward", keys: [[395, HX - 240, 1150, 2.3], [490, HX - 240, 1150, 2.9]] },
  { from: 490, to: 530, set: "ward", keys: [[490, HX + 150, 1140, 0.62], [530, HX + 100, 1150, 0.7]] },
  { from: 530, to: 565, set: "ward", keys: [[530, HX + 500, 1180, 1.3], [565, HX + 380, 1160, 1.6]] },
  { from: 565, to: 690, set: "ward", keys: [[565, dragX(565) - 60, 1160, 0.82], [690, dragX(690) + 60, 1160, 0.82]] },
  { from: 690, to: 735, set: "ward", keys: [[690, DOOR + 40, 1140, 1.2], [735, DOOR + 40, 1140, 1.4]] },
  { from: 735, to: 800, set: "car", keys: [[735, 400, 900, 1.0], [800, 320, 780, 1.45]] },
  { from: 800, to: 885, set: "panel", keys: [[800, 700, 620, 1.3], [885, 837, 520, 2.1]] },
  { from: 885, to: 965, set: "car", keys: [[885, 250, 610, 2.6], [965, 250, 630, 2.95]] },
  { from: 965, to: 1015, set: "car", keys: [[965, 280, 1110, 2.1], [1015, 280, 1110, 2.5]] },
  { from: 1015, to: 1060, set: "panel", keys: [[1015, 540, 880, 1.05], [1060, 540, 880, 1.15]] },
  { from: 1060, to: 9999, set: "car", keys: [[1060, 540, 1090, 0.92], [1120, 540, 1100, 1.05]] },
];
const shotAt = (s: number) => SHOTS.find((sh) => s >= sh.from && s < sh.to) ?? SHOTS[SHOTS.length - 1];
const camOf = (s: number, shot: Shot0) => {
  const f = shot.keys.map((k) => k[0]);
  const at = (i: number) => (f.length > 1 ? track(s, f, shot.keys.map((k) => k[i])) : shot.keys[0][i]);
  return { fx: at(1), fy: at(2), z: at(3) };
};

const SHAKE: Pose = { ...POSES.stand, lean: 20, tilt: 18, duck: 0.3, rUA: 66, rFA: 72, lUA: 42, lFA: 62 };
const TOW: Pose = { ...POSES.stand, lean: 22, tilt: -6, duck: 0.4, rUA: -34, rFA: -30, lUA: 50, lFA: 80 };
const TORN: Pose = { ...POSES.stand, lean: 4, tilt: 6, duck: 0.3, rUA: 70, rFA: 86, lUA: -62, lFA: -74, lTh: -14, lSh: -6, rTh: 14, rSh: 4 };
// The other Theo wears a hospital gown so the two can be told apart
const gown = (sk: Skeleton) => <line x1={sk.neck.x} y1={sk.neck.y + 14} x2={sk.hip.x} y2={sk.hip.y} stroke="#c8d8cf" strokeWidth={34} strokeLinecap="round" />;

// A body on its feet with the sheet still over it, drifting on
const Walker: React.FC<{ x: number; y: number; scale: number; frame: number; seed: number }> = ({ x, y, scale, frame, seed }) => {
  const b = Math.sin(frame * 0.35 + seed) * 7;
  const h = (i: number) => Math.sin(frame * 0.5 + i + seed) * 9;
  return (
    <g transform={`translate(${x} ${y + b * 0.3}) scale(${scale})`}>
      <path d={`M -78 0 L -66 ${-250 + b} Q -62 ${-420 + b} 0 ${-430 + b} Q 62 ${-420 + b} 66 ${-250 + b} L 78 0 Q 52 ${h(1)} 26 ${-12 + h(2)} Q 0 ${h(3)} -26 ${-12 + h(4)} Q -52 ${h(5)} -78 0 Z`} fill="#e9eee7" stroke="#aebbb1" strokeWidth={4} />
      <circle cx={-22} cy={-355 + b} r={11} fill="#141716" />
      <circle cx={22} cy={-355 + b} r={11} fill="#141716" />
      <path d={`M -36 ${-210 + b} Q -44 -110 -34 -24 M 30 ${-200 + b} Q 40 -120 32 -24`} stroke="#b7c3ba" strokeWidth={5} fill="none" />
    </g>
  );
};

export const Part03: React.FC = () => {
  const frame = useCurrentFrame();
  const sLive = toStory(frame);
  const frozen = sLive >= beats.freeze;
  const s = frozen ? beats.freeze : sLive;
  const f = frozen ? Math.round(toOut(beats.freeze)) : frame;
  const shot = shotAt(s);
  const cam = camOf(s, shot);
  const flash = s < beats.flashEnd;

  const kick = impulse(f, [toOut(beats.pull), toOut(beats.fallDown[1]), toOut(beats.eyesOpen), toOut(beats.walk), toOut(beats.close[1]), toOut(beats.bulbOn), toOut(beats.turn)], 4) * 20;
  const dragging = s >= beats.drag[0] && s < beats.drag[1];
  const shake = handheld(f, flash ? 6 : dragging ? 7 : 3, { x: kick * Math.sin(f * 3), y: kick * 0.6 + (dragging ? Math.abs(Math.sin(f * 0.6)) * 8 : 0) });

  // ---------- the ward ----------
  const awake = !flash && s >= beats.sitUp[0];
  const left = s >= beats.walk;
  const walkers = [...BEDS, ...BACK].map((bx, i) => {
    const near = i < 4;
    const tgt = dragX(s) + track(s, [beats.drag[1], beats.close[1] + 20], [560, 250]) + i * 95;
    const go = clamp01((s - beats.walk - (i % 4) * 8) / 150);
    return { x: bx + (tgt - bx) * go * go * (3 - 2 * go) + Math.sin(f * 0.05 + i) * 8, y: near ? FLOOR + 6 : 1398, scale: near ? 1 : 0.72, seed: i * 3 };
  });
  const flat = flash ? clamp01((s - beats.flat) / 3) : 0;

  // Theo
  let tx = TX0;
  let tFlip = false;
  let tPose: Pose = POSES.stand;
  let tFace = face(0.9, 0.2, 0.6);
  if (flash) {
    tx = TX0 - 80;
    tFlip = true;
    const fall = clamp01((s - beats.fallDown[0]) / (beats.fallDown[1] - beats.fallDown[0]));
    tPose = lerpPose(P78.reachDown, ACTION.land, fall);
    tFace = face(1, fall > 0 ? 1 : 0.3, 0.7);
  } else if (s < beats.sitUp[0]) {
    const k = s >= beats.shake ? Math.sin(f * 1.6) * 7 : 0;
    tPose = { ...SHAKE, lean: SHAKE.lean + k * 0.6, rUA: SHAKE.rUA + k, lUA: SHAKE.lUA + k };
    tFace = face(1, 0.5, 0.8);
  } else if (s < beats.walk) {
    tPose = lerpPose(P78.backUp, KAI.watch, clamp01((s - 300) / 40));
    tFace = face(1, 0.3, 0.7);
  } else if (s < beats.drag[0]) {
    tPose = KAI.flinch;
    tFace = face(1, 0.7, 1);
  } else {
    tx = dragX(s);
    tFlip = true;
    tPose = walkPose(tx / -260, GAITS.run, TOW);
    tFace = face(1, 0.7, 1);
  }
  // the other Theo in his bed, then towed across the floor
  const otherPose = lerpPose(P78.sit, { ...P78.sit, tilt: 22, lean: -2, duck: 0.8 }, clamp01((s - beats.tally[1]) / 40));
  const otherFace = face(0.9, s > 300 && s < 490 ? 0.18 + Math.abs(Math.sin(f * 0.55)) * 0.2 : 0, 0.2);
  const towed = s >= beats.drag[0];

  // ---------- the car ----------
  const bulb = s >= beats.bulbOn;
  const speaker = s >= beats.op && s < 1010 ? 0.55 + 0.45 * Math.abs(Math.sin(f * 0.5)) : 0;
  const torn = s >= 1060;
  const theoCar =
    s < beats.bulbGive + 15
      ? { x: -40, pose: KAI.sitLook as Pose }
      : s < beats.bulbOn + 18
        ? { x: -230, pose: { ...ACTION.reachUp, rUA: 172, lUA: -30, lFA: -20 } as Pose }
        : { x: 70, pose: (torn ? { ...TORN, lean: TORN.lean + Math.sin(f * 0.18) * 7 } : KAI.watch) as Pose };

  let scene: React.ReactNode;
  if (shot.set === "wall") {
    scene = <NoticeWall frame={f} scratch={1} />;
  } else if (shot.set === "panel") {
    scene = <PanelClose frame={f} lit={99} lit2={s >= beats.both ? 1 : undefined} />;
  } else if (shot.set === "car") {
    const down = s >= beats.turn;
    scene = (
      <g>
        <rect x={-2000} y={-2000} width={5000} height={6000} fill="#0a0b0e" />
        <g transform={`translate(${CX} ${CY})`}>
          <Car frame={f} open={0} floor="64" bulbs={[bulb ? 1 : 0, 1, 1]} swing={3} speaker={speaker} lit={99} exterior>
            {/* slumped by the wall; when the voice asks, he looks at the floor */}
            <StickFigure pose={down ? { ...KAI.sit, tilt: 26 } : KAI.sit} x={-340} y={0} scale={TS} frame={f} face={face(down ? 1 : 0.8, 0, down ? 0.8 : 0.2)} prop={gown} />
            <StickFigure pose={theoCar.pose} x={theoCar.x} y={-290 * Math.max(0, Math.sin(clamp01((s - beats.bulbOn + 12) / 24) * Math.PI))} scale={TS} frame={f} face={face(1, 0.2, 0.7)} />
          </Car>
          {bulb && s < beats.bulbOn + 12 ? <circle cx={-250} cy={-914} r={420} fill="url(#bulbGlow0)" opacity={1 - (s - beats.bulbOn) / 12} /> : null}
        </g>
      </g>
    );
  } else if (shot.set === "face") {
    const open = clamp01((s - beats.eyesOpen) / 5);
    const jolt = s < beats.eyesOpen ? Math.sin(f * 1.6) * 3 : 0;
    scene = (
      <g>
        <WardRoom frame={f} reveal={1} rises={BEDS.map(() => 1)} backRise={BACK.map(() => 1)} awake />
        <rect x={HEAD.x - 70} y={FLOOR - 150} width={150} height={44} rx={20} fill="#f2f5ef" />
        <g transform={`translate(${HEAD.x + jolt} ${HEAD.y})`}>
          <circle r={46} fill="#111" />
          {[-14, 14].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy={-12} rx={9} ry={1.5 + 9 * open} fill="#fff" />
              {open > 0.5 ? <circle cx={x} cy={-12} r={4} fill="#111" /> : null}
            </g>
          ))}
          <path d="M -10 16 q 10 -3 20 0" stroke="#fff" strokeWidth={3} fill="none" />
        </g>
      </g>
    );
  } else {
    const c = track(s, beats.close, [0, 1]);
    scene = (
      <WardRoom frame={f} reveal={1} rises={BEDS.map(() => 1)} backRise={BACK.map(() => 1)} flat={flat} awake={awake} empty={left}>
        {/* the elevator waiting at the end of the ward */}
        <rect x={DOOR - 230} y={760} width={460} height={740} fill="#26292f" stroke="#8a919b" strokeWidth={16} />
        <rect x={DOOR - 210} y={780} width={420} height={720} fill="#d8bd86" opacity={0.45} />
        <rect x={DOOR - 210} y={780} width={210 * c} height={720} fill="#6d7581" />
        <rect x={DOOR + 210 - 210 * c} y={780} width={210 * c} height={720} fill="#6d7581" />
        {left ? walkers.map((w, i) => (i >= 4 ? <Walker key={i} x={w.x} y={w.y} scale={w.scale} frame={f} seed={w.seed} /> : null)) : null}
        {awake && !towed ? <StickFigure pose={otherPose} x={HEAD.x + 90} y={FLOOR - 100} scale={1.3} frame={f} face={otherFace} prop={gown} /> : null}
        {towed && s < beats.close[0] ? (
          <g transform={`translate(${tx + 500} ${FLOOR + 6}) rotate(-60)`}>
            <StickFigure pose={{ ...POSES.stand, lUA: 150, lFA: 170, rUA: -40, rFA: -20 }} x={0} y={0} scale={1.3} frame={f} face={face(0.9, 0.3, 0.3)} prop={gown} />
          </g>
        ) : null}
        {s < beats.close[0] ? <StickFigure pose={tPose} x={tx} y={FLOOR + 22} scale={1.45} frame={f} flip={tFlip} face={tFace} /> : null}
        {left ? walkers.map((w, i) => (i < 4 ? <Walker key={i} x={w.x} y={w.y} scale={w.scale} frame={f} seed={w.seed} /> : null)) : null}
      </WardRoom>
    );
  }

  const punch = 1 + 0.07 * impulse(f, EMPH, 5);
  const freezeT = frozen ? frame - toOut(beats.freeze) : 0;
  // the clock stopped when he woke; it starts again when they walk
  const timerSec = s < beats.resume ? 7 : track(s, [beats.resume, beats.drag[0], beats.close[1]], [7, 6, 0]);
  const filter = flash ? "grayscale(1) sepia(1) hue-rotate(-45deg) saturate(3.5) contrast(1.15)" : frozen ? `grayscale(${Math.min(0.8, freezeT * 0.1)}) brightness(${Math.max(0.5, 1 - freezeT * 0.06)})` : undefined;
  return (
    <AbsoluteFill style={{ backgroundColor: "#050506" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ filter }}>
        <Defs0 />
        <g transform={`translate(540 960) scale(${punch * (1 + freezeT * 0.0012)}) translate(-540 -960)`}>
          <g transform={cameraTransform(cam, shake)}>{scene}</g>
        </g>
        <rect width={1080} height={1920} fill="url(#vignette0)" />
        {s >= beats.fallDown[1] + 8 && s < beats.flashEnd ? <rect width={1080} height={1920} fill="#fff" /> : null}
        {s >= beats.flashEnd && s < beats.flashEnd + 5 ? <rect width={1080} height={1920} fill="#fff" opacity={1 - (s - beats.flashEnd) / 5} /> : null}
        {frozen ? <rect width={1080} height={1920} fill="#fff" opacity={Math.max(0, 0.6 - freezeT * 0.12)} /> : null}
      </svg>
      {flash ? <div style={{ position: "absolute", top: 320, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontSize: 56, color: "#fff", WebkitTextStroke: "10px #0a0a0a", paintOrder: "stroke fill" }}>IF YOU&apos;D PICKED B…</div> : null}
      {!flash ? <Badge0 frame={frame - Math.round(toOut(beats.flashEnd))} part={3} title="THE OTHER THEO" until={70} /> : null}
      {!flash ? <Lives frame={frame} from={Math.round(toOut(beats.flashEnd))} left={bulb ? 3 : 2} /> : null}
      {!flash && s < beats.close[1] ? <DoorTimer frame={frame} from={Math.round(toOut(beats.flashEnd))} seconds={timerSec} frozen={s < beats.resume} /> : null}
      <ChoiceCards frame={frame} from={Math.round(toOut(beats.cards))} question="WHAT SHOULD THEO DO?" a="GO TO 99 WITH HIM" b="PRESS 1 LIKE THE VOICE SAID" />
      <Captions frame={frame} chunks={timeline.captions} speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>} />
      <EndCard0 frame={frame} from={Math.round(toOut(beats.card))} part={3} />
    </AbsoluteFill>
  );
};
