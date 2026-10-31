import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { FONT } from "../LastLight/Overlays";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const LED = '"Consolas", "Courier New", monospace';
const pop = (t: number, d: number) => ({
  opacity: interpolate(t, [d, d + 6], [0, 1], clamp),
  translate: interpolate(t, [d, d + 12], ["0px 40px", "0px 0px"], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
});

// The series logo: an elevator floor read-out
export const Logo0: React.FC<{ size: number; flicker?: number }> = ({ size, flicker = 1 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: size * 0.3,
      backgroundColor: "#060607",
      border: `${size * 0.06}px solid #4a4f57`,
      borderRadius: size * 0.2,
      padding: `${size * 0.12}px ${size * 0.4}px`,
      opacity: flicker,
    }}
  >
    <div style={{ width: 0, height: 0, borderLeft: `${size * 0.22}px solid transparent`, borderRight: `${size * 0.22}px solid transparent`, borderTop: `${size * 0.34}px solid #ff3b30`, filter: "drop-shadow(0 0 8px #ff3b30)" }} />
    <div style={{ fontFamily: LED, fontWeight: 700, fontSize: size, color: "#ff3b30", letterSpacing: size * 0.08, textShadow: "0 0 18px #ff3b30, 0 0 4px #ff8a80" }}>FLOOR 0</div>
  </div>
);

export const Badge0: React.FC<{ frame: number; part: number; title: string; until: number }> = ({ frame, part, title, until }) => (
  <div
    style={{
      position: "absolute",
      top: 110,
      left: 0,
      right: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
      opacity: interpolate(frame, [0, 4, until - 12, until], [0, 1, 1, 0], clamp),
    }}
  >
    <Logo0 size={78} flicker={frame % 23 < 2 ? 0.4 : 1} />
    <div style={{ fontFamily: FONT, fontSize: 42, color: "#0a0a0a", backgroundColor: "#FFD43B", padding: "6px 24px", borderRadius: 12 }}>
      PART {part} · {title}
    </div>
  </div>
);

// The doors' countdown, top right
export const DoorTimer: React.FC<{ frame: number; from: number; seconds: number; frozen: boolean }> = ({ frame, from, seconds, frozen }) => {
  const t = frame - from;
  if (t < 0) return null;
  const sec = Math.max(0, Math.ceil(seconds));
  const urgent = sec <= 10;
  const beat = urgent && !frozen ? 1 + 0.12 * Math.exp(-((seconds % 1) * 12)) : 1;
  return (
    <div
      style={{
        position: "absolute",
        top: 300,
        right: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "rgba(5,5,6,0.88)",
        border: `5px solid ${urgent ? "#ff3b30" : "#4a4f57"}`,
        borderRadius: 18,
        padding: "8px 22px 10px",
        opacity: interpolate(t, [0, 6], [0, 1], clamp),
        scale: interpolate(t, [0, 10], [1.6, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }) * beat,
        boxShadow: urgent ? "0 0 40px rgba(255,59,48,0.6)" : "none",
      }}
    >
      <div style={{ fontFamily: FONT, fontSize: 24, color: "#9aa3b5", letterSpacing: 3 }}>DOORS CLOSE</div>
      <div style={{ fontFamily: LED, fontWeight: 700, fontSize: 92, lineHeight: 1, color: "#ff3b30", textShadow: "0 0 20px #ff3b30" }}>0:{String(sec).padStart(2, "0")}</div>
    </div>
  );
};

// The vote: two choices the comments decide between
export const ChoiceCards: React.FC<{ frame: number; from: number; a: string; b: string; question: string }> = ({ frame, from, a, b, question }) => {
  const t = frame - from;
  if (t < 0) return null;
  const card = (letter: string, text: string, color: string, d: number, dir: number) => (
    <div
      style={{
        width: 450,
        height: 470,
        borderRadius: 30,
        backgroundColor: color,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        border: "8px solid #0a0a0a",
        boxShadow: `0 0 60px ${color}aa`,
        opacity: interpolate(t, [d, d + 5], [0, 1], clamp),
        translate: interpolate(t, [d, d + 12], [`${dir * 500}px 0px`, "0px 0px"], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
        rotate: `${dir * 2 * Math.sin((t + d) * 0.12)}deg`,
      }}
    >
      <div style={{ fontFamily: FONT, fontSize: 200, lineHeight: 1, color: "#fff", WebkitTextStroke: "10px #0a0a0a", paintOrder: "stroke fill" }}>{letter}</div>
      <div style={{ fontFamily: FONT, fontSize: 48, lineHeight: 1.1, color: "#0a0a0a", textAlign: "center", padding: "0 24px" }}>{text}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 1010, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontSize: 64, color: "#fff", WebkitTextStroke: "12px #0a0a0a", paintOrder: "stroke fill", ...pop(t, 0) }}>{question}</div>
      <div style={{ position: "absolute", top: 1120, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 40 }}>
        {card("A", a, "#FF5A3C", 4, -1)}
        {card("B", b, "#3CC8FF", 10, 1)}
      </div>
    </AbsoluteFill>
  );
};

// Closing card: the read-out flickers on, then the follow line
export const EndCard0: React.FC<{ frame: number; from: number; part: number }> = ({ frame, from, part }) => {
  const t = frame - from;
  if (t < 0) return null;
  const flick = t < 14 ? (Math.sin(t * 2.7) > 0 ? 1 : 0.2) : 1;
  return (
    <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${interpolate(t, [0, 4], [0, 1], clamp)})`, justifyContent: "center", alignItems: "center", gap: 40, scale: 1 + t * 0.0012 }}>
      <div style={{ ...pop(t, 2), opacity: (pop(t, 2).opacity as number) * flick }}>
        <Logo0 size={110} />
      </div>
      <div style={{ ...pop(t, 10), fontFamily: FONT, fontSize: 52, color: "#9aa3b5" }}>PART {part} · YOU DECIDE PART {part + 1}</div>
      <div style={{ ...pop(t, 16), fontFamily: FONT, fontSize: 70, color: "#0a0a0a", backgroundColor: "#FFD43B", padding: "12px 36px", borderRadius: 18, textAlign: "center", lineHeight: 1.15 }}>
        FOLLOW
        <br />
        <span style={{ fontSize: 46 }}>so you don&apos;t miss the next floor</span>
      </div>
    </AbsoluteFill>
  );
};

// The lives: three bulbs, top left
export const Lives: React.FC<{ frame: number; from: number; left: number }> = ({ frame, from, left }) => {
  const t = frame - from;
  if (t < 0) return null;
  return (
    <div style={{ position: "absolute", top: 300, left: 50, display: "flex", gap: 12, backgroundColor: "rgba(5,5,6,0.88)", border: "5px solid #4a4f57", borderRadius: 18, padding: "16px 20px", opacity: interpolate(t, [0, 6], [0, 1], clamp), scale: interpolate(t, [0, 10], [1.5, 1], clamp) }}>
      {[0, 1, 2].map((i) => {
        const on = i >= 3 - left;
        return <div key={i} style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: on ? "#FFE08A" : "#2a2c31", boxShadow: on ? "0 0 22px #FFC94D" : "none", border: "3px solid #6a6f78" }} />;
      })}
    </div>
  );
};
