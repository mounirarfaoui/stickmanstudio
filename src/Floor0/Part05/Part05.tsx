import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { lerpPose, Pose, POSES, Skeleton, StickFigure } from "../../shared/rig";
import { cameraTransform, clamp01, handheld, impulse, KAI, makeWarp, track } from "../../LastLight/kit";
import { face, P78 } from "../../LastLight/bridge";
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
const B = CTRL.button;
const CENTRE = { x: 380 + 68, y: 640 + 57 };

type Shot0 = { from: number; to: number; keys: [number, number, number, number][] };
const SHOTS: Shot0[] = [
  // the biggest event first: the hand on the button, the wall dying
  { from: 0, to: 20, keys: [[0, B.x, B.y - 150, 3.4], [20, B.x, B.y - 150, 3.0]] },
  { from: 20, to: 60, keys: [[20, 440, 560, 0.72], [60, 440, 620, 0.66]] },
  { from: 60, to: 110, keys: [[60, 240, 1150, 2.3], [110, 240, 1150, 2.6]] },
  { from: 110, to: 215, keys: [[110, 560, 1120, 1.45], [215, 600, 1120, 1.7]] },
  { from: 215, to: 300, keys: [[215, 440, 520, 0.7], [300, 440, 640, 0.62]] },
  { from: 300, to: 372, keys: [[300, 650, 1140, 2.4], [372, 650, 1140, 2.8]] },
  { from: 372, to: 470, keys: [[372, 520, 1130, 1.5], [470, 520, 1130, 1.9]] },
  { from: 470, to: 535, keys: [[470, 420, 1000, 0.62], [535, 420, 1000, 0.66]] },
  { from: 535, to: 620, keys: [[535, CENTRE.x, CENTRE.y + 80, 1.3], [620, CENTRE.x, CENTRE.y, 3.2]] },
  { from: 620, to: 705, keys: [[620, CENTRE.x, CENTRE.y, 6.5], [705, CENTRE.x, CENTRE.y, 7.4]] },
  { from: 705, to: 835, keys: [[705, CTRL.chair + 20, 1160, 2.3], [835, CTRL.chair + 20, 1160, 2.7]] },
  { from: 835, to: 935, keys: [[835, 60, 1100, 1.1], [935, 160, 1130, 1.3]] },
  { from: 935, to: 9999, keys: [[935, 250, 1150, 1.25], [1020, 260, 1160, 1.5]] },
];
const camOf = (s: number) => {
  const shot = SHOTS.find((sh) => s >= sh.from && s < sh.to) ?? SHOTS[SHOTS.length - 1];
  const f = shot.keys.map((k) => k[0]);
  const at = (i: number) => track(s, f, shot.keys.map((k) => k[i]));
  return { fx: at(1), fy: at(2), z: at(3) };
};

const gown = (sk: Skeleton) => <line x1={sk.neck.x} y1={sk.neck.y + 14} x2={sk.hip.x} y2={sk.hip.y} stroke="#c8d8cf" strokeWidth={34} strokeLinecap="round" />;
const PRESS: Pose = { ...POSES.stand, lean: 30, tilt: 6, duck: 0.35, rUA: 92, rFA: 96, lUA: -20, lFA: -10, lTh: -28, lSh: -12, rTh: 30, rSh: 4 };
const ARMS_UP: Pose = { ...POSES.stand, lean: -6, tilt: -12, rUA: 150, rFA: 170, lUA: -150, lFA: -170 };
const TORN: Pose = { ...POSES.stand, lean: 4, tilt: 6, duck: 0.3, rUA: 70, rFA: 86, lUA: -62, lFA: -74, lTh: -14, lSh: -6, rTh: 14, rSh: 4 };

export const Part05: React.FC = () => {
  const frame = useCurrentFrame();
  const sLive = toStory(frame);
  const frozen = sLive >= beats.freeze;
  const s = frozen ? beats.freeze : sLive;
  const f = frozen ? Math.round(toOut(beats.freeze)) : frame;
  const cam = camOf(s);
  const hooking = s < beats.hookEnd;

  const kick = impulse(f, [toOut(beats.press), toOut(20), toOut(60), toOut(110), toOut(beats.fade[0]), toOut(beats.gone), toOut(beats.screenOn), toOut(beats.timerResume)], 4) * 22;
  const shake = handheld(f, hooking ? 8 : 3, { x: kick * Math.sin(f * 3), y: kick * 0.6 });

  // ---------- the wall ----------
  const dead = clamp01((s - beats.die[0]) / (beats.die[1] - beats.die[0]));
  const alarm = s < beats.die[1] ? 1 : 0;
  const girl = s >= beats.screenOn ? clamp01((s - beats.screenOn) / 8) * (s < beats.screenOn + 20 && Math.sin(f * 2.2) < -0.3 ? 0.3 : 1) : 0;
  const opTalk = s >= 710 && s < 835 ? 0.5 + 0.5 * Math.abs(Math.sin(f * 0.5)) : 0;

  // ---------- the other Theo: presses, celebrates, flickers, goes ----------
  const fadeT = clamp01((s - beats.fade[0]) / (beats.fade[1] - beats.fade[0]));
  const flick = fadeT > 0 ? (Math.sin(f * (1.5 + fadeT * 3)) * Math.sin(f * 0.7) > -0.2 + fadeT * 1.1 ? 1 : 0.1) : 1;
  const otherOpacity = s >= beats.gone ? 0 : flick * (1 - fadeT * 0.5);
  const oPose: Pose = s < 110 ? PRESS : s < 300 ? lerpPose(PRESS, P78.backUp, clamp01((s - 110) / 20)) : s < beats.fade[0] ? lerpPose(P78.backUp, ARMS_UP, clamp01((s - 300) / 15)) : lerpPose(ARMS_UP, { ...P78.slump, tilt: 24 }, fadeT);
  const oFace = face(s < 300 ? 0.2 : fadeT > 0 ? 0.6 : 0, 0, 0, s >= 300 && fadeT < 0.5 ? 1.2 : 0);

  // ---------- Theo ----------
  const tx = s < 835 ? 300 : track(s, [835, 935], [300, 150]);
  const tPose: Pose =
    s < beats.die[1]
      ? lerpPose(KAI.watch, KAI.flinch, clamp01((s - 60) / 30) * (1 - clamp01((s - 200) / 40)))
      : s < beats.gone
        ? { ...KAI.watch, tilt: -6 + fadeT * 10 }
        : s < 835
          ? { ...KAI.watch, duck: 0.15, tilt: s >= beats.screenOn ? -18 : 4 }
          : { ...TORN, lean: TORN.lean + Math.sin(f * 0.2) * 7, rUA: TORN.rUA + Math.sin(f * 0.3) * 8 };
  const tFace = face(1, s < beats.die[1] ? 0.7 : s >= 835 ? 0.6 : 0.2, 0.8);

  // the doors behind him, closing
  const c = track(s, beats.close, [0, 1]);
  const timerSec = s < beats.timerResume ? 7 : track(s, [beats.timerResume, beats.close[1]], [7, 0]);

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
            <ControlRoom frame={f} alarm={alarm} swing={0.2} talk={opTalk} dead={dead} pressed={s >= beats.press} girl={girl}>
              {/* the door panels, sliding shut on the way out */}
              <rect x={-322} y={778} width={192 * c} height={722} fill="#6d7581" />
              <rect x={62 - 192 * c} y={778} width={192 * c} height={722} fill="#6d7581" />
              <g opacity={otherOpacity}>
                <StickFigure pose={oPose} x={s < 110 ? 700 : 640} y={F + 18} scale={1.45} frame={f} face={oFace} prop={gown} />
              </g>
              {/* what he leaves behind: a hospital gown on the floor */}
              {s >= beats.gone ? <path d={`M 560 ${F + 10} q 60 -30 120 0 q 40 10 10 22 q -80 14 -140 0 Z`} fill="#c8d8cf" opacity={0.9} /> : null}
              <StickFigure pose={tPose} x={tx} y={F + 34} scale={1.45} frame={f} face={tFace} />
            </ControlRoom>
          </g>
        </g>
        {alarm > 0 && hooking ? <rect width={1080} height={1920} fill="#ff1e12" opacity={0.22 + 0.16 * Math.abs(Math.sin(f * 0.4))} /> : null}
        {s >= beats.press && s < beats.press + 4 ? <rect width={1080} height={1920} fill="#fff" opacity={0.8 * (1 - (s - beats.press) / 4)} /> : null}
        <rect width={1080} height={1920} fill="url(#vignette0)" />
        {frozen ? <rect width={1080} height={1920} fill="#fff" opacity={Math.max(0, 0.6 - freezeT * 0.12)} /> : null}
      </svg>
      <HookText frame={frame} until={Math.round(toOut(60))} lines={["200 OF ME", "JUST DIED."]} top={120} />
      {!hooking ? <Badge0 frame={frame - Math.round(toOut(beats.hookEnd))} part={5} title="RESET" until={65} /> : null}
      {!hooking ? <Lives frame={frame} from={Math.round(toOut(beats.hookEnd))} left={3} /> : null}
      {s >= beats.timerResume ? <DoorTimer frame={frame} from={Math.round(toOut(beats.timerResume))} seconds={timerSec} frozen={frozen} /> : null}
      <ChoiceCards frame={frame} from={Math.round(toOut(beats.cards))} question="WHAT SHOULD THEO DO?" a="PUT ON THE HEADSET" b="RUN FOR THE DOORS" />
      <Captions frame={frame} chunks={timeline.captions} speakers={episode.captions.speakers as Record<string, keyof typeof SPEAKERS>} />
      <EndCard0 frame={frame} from={Math.round(toOut(beats.card))} part={5} />
    </AbsoluteFill>
  );
};
