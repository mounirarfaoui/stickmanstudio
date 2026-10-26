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
