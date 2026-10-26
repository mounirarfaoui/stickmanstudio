import { Easing, interpolate } from "remotion";
import { Pose, POSES } from "../shared/rig";

// Helpers shared by every LAST LIGHT episode.

type Timeline = { anchors: number[][] };

// Each episode's timeline.json stretches story sections to fit the narration.
// toStory: output frame -> story frame; toOut: story frame -> output frame.
export const makeWarp = (timeline: Timeline) => {
  const OUT = timeline.anchors.map((a) => a[1]);
  const STORY = timeline.anchors.map((a) => a[0]);
  return {
    toStory: (frame: number) => interpolate(frame, OUT, STORY, { extrapolateLeft: "clamp", extrapolateRight: "extend" }),
    toOut: (story: number) => interpolate(story, STORY, OUT, { extrapolateLeft: "clamp", extrapolateRight: "extend" }),
  };
};

const ease = Easing.inOut(Easing.cubic);
// Eased keyframe track in story frames
export const track = (s: number, frames: number[], values: number[]) => interpolate(s, frames, values, { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// Sum of decaying kicks after each hit frame (door bangs, impacts)
export const impulse = (frame: number, at: number[], decay = 5) => at.reduce((acc, b) => (frame >= b ? acc + Math.exp(-(frame - b) / decay) : acc), 0);

// Kai's poses (side view facing +x; StickFigure's `flip` turns him around)
export const KAI = {
  hold: { ...POSES.stand, rUA: 22, rFA: 150 },
  sip: { ...POSES.stand, tilt: -8, rUA: 40, rFA: 174 },
  watch: { ...POSES.stand, tilt: 7, duck: 0.15, rUA: 22, rFA: 150 },
  flinch: { lean: -16, tilt: -12, duck: 0.6, chest: 1, lUA: 42, lFA: 150, rUA: 58, rFA: 162, lTh: -22, lSh: -6, rTh: 20, rSh: 12 },
  stand: POSES.stand,
  push: { lean: 30, tilt: -4, duck: 0.3, chest: 1, lUA: 72, lFA: 88, rUA: 82, rFA: 94, lTh: -30, lSh: -34, rTh: 40, rSh: 4 },
  brace: { lean: 22, tilt: 6, duck: 0.5, chest: 1, lUA: 70, lFA: 96, rUA: 84, rFA: 104, lTh: -26, lSh: -30, rTh: 34, rSh: 6 },
  sit: { lean: -16, tilt: 10, duck: 0.6, chest: 0.97, lUA: 52, lFA: 96, rUA: 64, rFA: 106, lTh: 112, lSh: 14, rTh: 124, rSh: 26 },
  sitLook: { lean: -10, tilt: -14, duck: 0.3, chest: 1, lUA: 40, lFA: 70, rUA: 60, rFA: 100, lTh: 112, lSh: 14, rTh: 124, rSh: 26 },
} satisfies Record<string, Pose>;

// Action poses used across episodes
export const ACTION = {
  crouch: { lean: 26, tilt: 4, duck: 0.5, chest: 1, lUA: 40, lFA: 80, rUA: 50, rFA: 90, lTh: 72, lSh: -38, rTh: 84, rSh: -28 },
  lock: { ...POSES.stand, lean: 8, tilt: -4, lUA: 34, lFA: 64, rUA: 82, rFA: 74 },
  climbUp: { ...POSES.stand, lean: 8, rTh: 88, rSh: 4, rUA: 40, rFA: 120, lUA: -20, lFA: 10 },
  reachUp: { ...POSES.stand, lean: -4, tilt: -10, lUA: -172, lFA: -176, rUA: 172, rFA: 176 },
  strain: { ...POSES.stand, lean: -9, tilt: -16, duck: 0.35, lUA: -168, lFA: -172, rUA: 166, rFA: 172 },
  squeeze: { lean: 0, tilt: -6, duck: 0.6, chest: 1, lUA: -172, lFA: -176, rUA: 172, rFA: 176, lTh: -4, lSh: -2, rTh: 4, rSh: 2 },
  pull: { lean: -18, tilt: -6, duck: 0.3, chest: 1, lUA: 120, lFA: 150, rUA: 128, rFA: 160, lTh: -24, lSh: -10, rTh: 20, rSh: 26 },
  climbOver: { lean: 10, tilt: 0, duck: 0.2, chest: 1, lUA: 20, lFA: 40, rUA: 30, rFA: 50, lTh: -10, lSh: -4, rTh: 95, rSh: 20 },
  hang: { lean: 0, tilt: -8, duck: 0.4, chest: 1, lUA: -176, lFA: -178, rUA: 176, rFA: 178, lTh: -10, lSh: -18, rTh: 8, rSh: -6 },
  fall: { lean: -6, tilt: -12, duck: 0.2, chest: 1, lUA: -150, lFA: -120, rUA: 150, rFA: 120, lTh: 20, lSh: -20, rTh: 40, rSh: -10 },
  land: { lean: 34, tilt: 8, duck: 0.6, chest: 0.95, lUA: 60, lFA: 30, rUA: 70, rFA: 40, lTh: 92, lSh: -48, rTh: 100, rSh: -40 },
  recoil: { lean: -24, tilt: -14, duck: 0.4, chest: 1, lUA: 30, lFA: 160, rUA: 50, rFA: 165, lTh: 112, lSh: 14, rTh: 124, rSh: 26 },
} satisfies Record<string, Pose>;

// Crouched sneaking: bent knees with a small, careful step
export const sneakPose = (phase: number): Pose => {
  const a = phase * Math.PI * 2;
  return { ...ACTION.crouch, lTh: ACTION.crouch.lTh + 14 * Math.sin(a), lSh: ACTION.crouch.lSh - 8 * Math.max(0, Math.cos(a)), rTh: ACTION.crouch.rTh - 14 * Math.sin(a), rSh: ACTION.crouch.rSh - 8 * Math.max(0, -Math.cos(a)) };
};

// A scene's camera as a list of shots; each shot eases through its own keys [story, fx, fy, z].
// Cutting between shots is instant, like an editor's cut.
export type Shot = { from: number; to: number; keys: [number, number, number, number][] };
export const shotCamera = (s: number, shots: Shot[]) => {
  const shot = shots.find((sh) => s >= sh.from && s < sh.to) ?? shots[shots.length - 1];
  const f = shot.keys.map((k) => k[0]);
  const at = (i: number) => (f.length > 1 ? track(s, f, shot.keys.map((k) => k[i])) : shot.keys[0][i]);
  return { fx: at(1), fy: at(2), z: at(3) };
};
export const cameraTransform = ({ fx, fy, z }: { fx: number; fy: number; z: number }, shake = { x: 0, y: 0 }) =>
  `translate(${540 - fx * z + shake.x} ${960 - fy * z + shake.y}) scale(${z})`;
