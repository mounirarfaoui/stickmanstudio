import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { GAITS, lerpPose, Pose, POSES, Skeleton, StickFigure, walkPose } from "../../shared/rig";
import { cameraTransform, clamp01, handheld, impulse, KAI, makeWarp, track } from "../../LastLight/kit";
import { face, P78 } from "../../LastLight/bridge";
import { Captions, SPEAKERS } from "../../LastLight/Overlays";
import { Car, Defs0 } from "../elevator";
import { PanelClose } from "../closeups";
import { ControlRoom, CTRL } from "../control";
import { Badge0, ChoiceCards, DoorTimer, EndCard0, Lives } from "../ui";
import beats from "./beats.json";
import episode from "./episode.json";
import timeline from "./timeline.json";

export const DURATION = timeline.duration;
const { toOut, toStory } = makeWarp(timeline);
const EMPH = timeline.captions.flatMap((c) => c.words.filter((w) => w.emph).map((w) => w.frame));

const CX = 540;
const CY = 1500;
const TS = 1.55;
const F = CTRL.floor;

type SetName = "car" | "panel" | "door" | "control";
type Shot0 = { from: number; to: number; set: SetName; keys: [number, number, number, number][] };
const SHOTS: Shot0[] = [
  // the stranger-first opening: huge faces, a cut every second, no titles
  { from: 0, to: 28, set: "car", keys: [[0, 475, 1000, 3.3], [28, 475, 1000, 3.0]] },
  { from: 28, to: 55, set: "car", keys: [[28, 620, 1060, 1.5], [55, 590, 1050, 1.8]] },
  { from: 55, to: 80, set: "car", keys: [[55, 555, 1040, 4.0], [80, 555, 1040, 4.6]] },
  { from: 80, to: 110, set: "door", keys: [[80, 540, 1000, 1.05], [110, 540, 1000, 1.25]] },
  { from: 110, to: 175, set: "panel", keys: [[110, 720, 700, 1.25], [150, 837, 520, 2.0], [175, 837, 520, 2.3]] },
  { from: 175, to: 260, set: "car", keys: [[175, 560, 1080, 1.15], [260, 560, 1060, 1.5]] },
  { from: 260, to: 310, set: "car", keys: [[260, 660, 1040, 3.2], [310, 660, 1040, 3.7]] },
  { from: 310, to: 365, set: "door", keys: [[310, 540, 1000, 1.1], [365, 540, 1000, 1.4]] },
  { from: 365, to: 460, set: "car", keys: [[365, 540, 1130, 1.3], [415, 540, 1120, 1.5], [460, 540, 1130, 2.1]] },
  { from: 460, to: 545, set: "control", keys: [[460, 300, 740, 2.6], [545, 500, 700, 2.9]] },
  { from: 545, to: 630, set: "control", keys: [[545, 420, 900, 1.1], [630, 420, 880, 0.62]] },
  { from: 630, to: 745, set: "control", keys: [[630, CTRL.chair + 30, 1170, 2.4], [745, CTRL.chair + 30, 1170, 3.0]] },
  { from: 745, to: 830, set: "control", keys: [[745, CTRL.chair, 1180, 1.5], [830, CTRL.chair + 40, 1180, 1.8]] },
  { from: 830, to: 895, set: "control", keys: [[830, CTRL.button.x, 1300, 3.2], [895, CTRL.button.x, 1300, 3.8]] },
  { from: 895, to: 990, set: "control", keys: [[895, 560, 1150, 1.45], [990, 660, 1120, 2.0]] },
  { from: 990, to: 1100, set: "control", keys: [[990, 420, 900, 0.68], [1100, 480, 960, 0.9]] },
  { from: 1100, to: 1150, set: "control", keys: [[1100, 330, 1050, 2.3], [1150, 330, 1050, 2.7]] },
  { from: 1150, to: 9999, set: "control", keys: [[1150, 590, 1180, 1.25], [1205, 620, 1190, 1.55]] },
];
const shotAt = (s: number) => SHOTS.find((sh) => s >= sh.from && s < sh.to) ?? SHOTS[SHOTS.length - 1];
const camOf = (s: number, shot: Shot0) => {
  const f = shot.keys.map((k) => k[0]);
  const at = (i: number) => (f.length > 1 ? track(s, f, shot.keys.map((k) => k[i])) : shot.keys[0][i]);
  return { fx: at(1), fy: at(2), z: at(3) };
};

const gown = (sk: Skeleton) => <line x1={sk.neck.x} y1={sk.neck.y + 14} x2={sk.hip.x} y2={sk.hip.y} stroke="#c8d8cf" strokeWidth={34} strokeLinecap="round" />;
const GRAB: Pose = { ...POSES.stand, lean: 16, tilt: 4, duck: 0.2, rUA: 84, rFA: 92, lUA: 66, lFA: 88 };
const SHOVE: Pose = { ...POSES.stand, lean: -12, tilt: -10, duck: 0.3, rUA: 76, rFA: 110, lUA: 60, lFA: 124 };
const REACH: Pose = { ...POSES.stand, lean: 26, tilt: 8, duck: 0.3, rUA: 74, rFA: 84, lUA: -30, lFA: -20 };
const GRASP: Pose = { ...POSES.stand, lean: 22, tilt: 2, duck: 0.3, rUA: 86, rFA: 92, lUA: 72, lFA: 84, lTh: -24, lSh: -10, rTh: 26, rSh: 2 };

export const Part04: React.FC = () => {
  const frame = useCurrentFrame();
  const sLive = toStory(frame);
  const frozen = sLive >= beats.freeze;
  const s = frozen ? beats.freeze : sLive;
  const f = frozen ? Math.round(toOut(beats.freeze)) : frame;
  const shot = shotAt(s);
  const cam = camOf(s, shot);
  const hooking = s < 110;

  const kick = impulse(f, [...beats.slam.map(toOut), toOut(80), toOut(beats.press), toOut(beats.shut), toOut(beats.reveal), toOut(beats.button), toOut(beats.alarm)], 4) * 22;
  const shake = handheld(f, hooking ? 8 : 3, { x: kick * Math.sin(f * 3), y: kick * 0.6 });

  // ---------- the elevator ----------
  const fight = s < 110;
  const j = fight ? Math.sin(f * 1.1) * 12 : 0;
  const floorNum = s < beats.press ? "64" : s < beats.ding ? String(Math.min(99, 64 + Math.floor((s - beats.press) * 0.17))) : "99";
  const carOpen = track(s, beats.open, [0, 1]);
  const ride = s >= 175 && s < beats.ding;
  const talk = s >= 268 && s < 365;
  const otherCar = fight
    ? { x: 118 + j, pose: lerpPose(GRAB, { ...GRAB, lean: 26 }, Math.abs(Math.sin(f * 0.5))), flip: true, fc: s >= 55 ? face(0, 0, 0, 1.4) : face(0.1, 0.6, 0, 0.9) }
    : { x: 150, pose: talk ? { ...P78.slump, tilt: 26 } : ride ? P78.slump : KAI.watch, flip: true, fc: face(0.8, talk ? Math.abs(Math.sin(f * 0.55)) * 0.3 : 0, 0.3) };
  const theoCar = fight
    ? { x: -118 + j, pose: SHOVE, flip: false, fc: face(1, 1, 1) }
    : { x: -150, pose: ride ? { ...KAI.watch, duck: 0.15 } : P78.backUp, flip: false, fc: face(1, 0.3, 0.8) };
  const alarmLight = hooking ? 0.3 + 0.2 * Math.abs(Math.sin(f * 0.35)) : 0;

  // ---------- Floor 99 ----------
  const alarm = s >= beats.alarm ? 1 : 0;
  const swing = clamp01(1 - (s - beats.chair) / 120);
  const opTalk = (s >= 638 && s < 745) || (s >= 995 && s < 1095) ? 0.5 + 0.5 * Math.abs(Math.sin(f * 0.5)) : 0;
  const ox = track(s, [beats.button, beats.lunge, 1100], [40, 180, 590]);
  const tx = track(s, [beats.choice - 60, beats.choice + 40], [-110, 250]);
  const oPose: Pose = s >= 1090 ? REACH : s >= beats.lunge ? walkPose(ox / 260, GAITS.walk, { ...POSES.stand, lean: 12, rUA: 50, rFA: 70 }) : { ...KAI.watch, tilt: 10 };
  const tPose: Pose = s >= beats.choice ? { ...GRASP, lean: GRASP.lean + Math.sin(f * 0.2) * 6, rUA: GRASP.rUA + Math.sin(f * 0.3) * 6 } : s >= beats.reveal ? { ...KAI.flinch, duck: 0.4 } : P78.backUp;

  let scene: React.ReactNode;
  if (shot.set === "panel") {
    const tip = { x: track(s, [112, beats.press], [1000, 837]), y: track(s, [112, beats.press], [1400, 494]) };
    scene = (
      <g>
        <PanelClose frame={f} lit={s >= beats.press ? 99 : 64} />
        <polyline points={`${tip.x + 300},${tip.y + 800} ${tip.x + 130},${tip.y + 240} ${tip.x},${tip.y}`} stroke="#111" strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx={tip.x} cy={tip.y} r={20} fill="#111" />
      </g>
    );
  } else if (shot.set === "door") {
    // the last Theo, on the wrong side of the doors
    const first = s < 110;
    const gap = first ? track(s, [80, 110], [300, 110]) : track(s, [310, 362], [270, 0]);
    const reach = Math.sin(f * 0.9) * 12;
    scene = (
      <g>
        <rect x={-400} y={-400} width={1900} height={2800} fill="#0a0c10" />
        <rect x={0} y={200} width={1080} height={1800} fill="#21301f" opacity={0.7} />
        <StickFigure pose={{ ...POSES.stand, lean: 8, tilt: -4, rUA: 40 + reach, rFA: 150, lUA: -26, lFA: -150 - reach }} x={540} y={1960} scale={3} frame={f} face={face(1, 0.9, 1)} />
        <rect x={540 - gap - 1100} y={0} width={1100} height={2000} fill="url(#doorSteel0)" />
        <rect x={540 + gap} y={0} width={1100} height={2000} fill="url(#doorSteel0)" />
      </g>
    );
  } else if (shot.set === "control") {
    scene = (
      <ControlRoom frame={f} alarm={alarm} swing={swing} talk={opTalk}>
        <StickFigure pose={oPose} x={ox} y={F + 18} scale={1.45} frame={f} face={face(0.7, s > 900 && s < 990 ? Math.abs(Math.sin(f * 0.55)) * 0.3 : 0, 0.3)} prop={gown} />
        <StickFigure pose={tPose} x={tx} y={F + 34} scale={1.45} frame={f} face={face(1, s >= beats.choice ? 0.7 : 0.3, 0.9)} />
      </ControlRoom>
    );
  } else {
    const glow = (
      <g clipPath="url(#doorClip0)">
        <rect x={-190} y={-700} width={380} height={700} fill="#7fa6b8" opacity={0.6} />
        {Array.from({ length: 40 }, (_, i) => (
          <rect key={i} x={-186 + (i % 5) * 75} y={-690 + Math.floor(i / 5) * 86} width={68} height={78} fill={(i + Math.floor(f / 9)) % 7 === 0 ? "#0b0d10" : "#a9c9d6"} stroke="#0d1115" strokeWidth={4} />
        ))}
      </g>
    );
    scene = (
      <g>
        <rect x={-2000} y={-2000} width={5000} height={6000} fill="#0a0b0e" />
        <g transform={`translate(${CX} ${CY})`}>
          <Car frame={f} open={carOpen} floor={floorNum} bulbs={[1, 1, 1]} swing={hooking ? 14 : 3} speaker={0} lit={s >= beats.press ? 99 : -1} exterior beyond={glow}>
            <StickFigure pose={theoCar.pose} x={theoCar.x} y={0} scale={TS} frame={f} flip={theoCar.flip} face={theoCar.fc} />
            <StickFigure pose={otherCar.pose} x={otherCar.x} y={0} scale={TS} frame={f} flip={otherCar.flip} face={otherCar.fc} prop={gown} />
          </Car>
        </g>
      </g>
    );
  }

  const punch = 1 + 0.08 * impulse(f, EMPH, 5);
  const freezeT = frozen ? frame - toOut(beats.freeze) : 0;
  const timerSec = s < beats.choice ? 30 - (20 * (s - beats.timerStart)) / (beats.choice - beats.timerStart) : 10 - (3 * (s - beats.choice)) / (beats.freeze - beats.choice);
  const filter = frozen ? `grayscale(${Math.min(0.8, freezeT * 0.1)}) brightness(${Math.max(0.5, 1 - freezeT * 0.06)})` : undefined;
  return (
    <AbsoluteFill style={{ backgroundColor: "#050506" }}>
      <Audio src={staticFile(`${episode.publicDir}/soundtrack.wav`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ filter }}>
        <Defs0 />
        <g transform={`translate(540 960) scale(${punch * (1 + freezeT * 0.0012)}) translate(-540 -960)`}>
          <g transform={cameraTransform(cam, shake)}>{scene}</g>
        </g>
        {alarmLight > 0 ? <rect width={1080} height={1920} fill="#ff1e12" opacity={alarmLight} /> : null}
        <rect width={1080} height={1920} fill="url(#vignette0)" />
        {frozen ? <rect width={1080} height={1920} fill="#fff" opacity={Math.max(0, 0.6 - freezeT * 0.12)} /> : null}
      </svg>
      {/* the series title waits until the hook has landed */}
      {!hooking ? <Badge0 frame={frame - Math.round(toOut(110))} part={4} title="FLOOR 99" until={65} /> : null}
      {!hooking ? <Lives frame={frame} from={Math.round(toOut(110))} left={3} /> : null}
      <DoorTimer frame={frame} from={Math.round(toOut(beats.timerStart))} seconds={timerSec} frozen={frozen} />
      <ChoiceCards frame={frame} from={Math.round(toOut(beats.cards))} question="WHAT SHOULD THEO DO?" a="LET HIM PRESS IT" b="STOP HIM" />
      <Captions frame={frame} chunks={timeline.captions} speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>} />
      <EndCard0 frame={frame} from={Math.round(toOut(beats.card))} part={4} />
    </AbsoluteFill>
  );
};
