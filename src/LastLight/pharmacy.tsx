import React from "react";
import { rand } from "./world";

// ================= Part 5: the pharmacy =================
// Outside: a night street with the pharmacy front. Inside: aisles, the counter, the battery rack,
// the door with its bell. Inside is pitch black except what a light reaches (see <Darkness>).

export const FRONT = {
  ground: 1500,
  x: 260,
  w: 1900,
  top: 640,
  doorX: 1500,
  doorW: 210,
  doorTop: 1040,
};

// The green pharmacy cross; `on` 0..1 (it flickers)
const Cross: React.FC<{ x: number; y: number; on: number; size?: number }> = ({
  x,
  y,
  on,
  size = 90,
}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle
      r={size * 1.6}
      fill="#3dff8a"
      opacity={0.18 * on}
      filter="url(#soft)"
    />
    {[0, 90].map((a) => (
      <rect
        key={a}
        x={-size / 2}
        y={-size * 0.17}
        width={size}
        height={size * 0.34}
        rx={6}
        fill={on > 0.5 ? "#4dff97" : "#14402a"}
        transform={`rotate(${a})`}
      />
    ))}
  </g>
);

export const PharmacyFront: React.FC<{
  frame: number;
  cross: number;
  children?: React.ReactNode;
}> = ({ frame, cross, children }) => {
  const { ground, x, w, top, doorX, doorW, doorTop } = FRONT;
  return (
    <g>
      {/* neighbours */}
      {Array.from({ length: 10 }, (_, i) => {
        const bx = -1400 + i * 420;
        if (bx > x - 300 && bx < x + w) return null;
        const h = 700 + rand(i + 1200) * 500;
        return (
          <g key={i}>
            <rect
              x={bx}
              y={ground - h}
              width={400}
              height={h}
              fill={i % 2 ? "#161624" : "#1b1a2a"}
            />
            {Array.from({ length: 6 }, (_, r) => (
              <rect
                key={r}
                x={bx + 50 + (r % 3) * 110}
                y={ground - h + 80 + Math.floor(r / 3) * 180}
                width={60}
                height={90}
                fill={rand(i * 9 + r + 3) > 0.85 ? "#6a4a2a" : "#0b0b14"}
              />
            ))}
          </g>
        );
      })}
      {/* the pharmacy */}
      <rect x={x} y={top} width={w} height={ground - top} fill="#2a3a3c" />
      {Array.from({ length: Math.ceil((ground - top) / 30) }, (_, r) => (
        <line
          key={r}
          x1={x}
          y1={top + r * 30}
          x2={x + w}
          y2={top + r * 30}
          stroke="#243234"
          strokeWidth={3}
        />
      ))}
      <rect x={x - 20} y={top - 30} width={w + 40} height={40} fill="#1c2628" />
      {/* sign board */}
      <rect
        x={x + 120}
        y={top + 70}
        width={1100}
        height={150}
        rx={10}
        fill="#0f1a1a"
        stroke="#3a4a4c"
        strokeWidth={8}
      />
      <text
        x={x + 670}
        y={top + 180}
        textAnchor="middle"
        fontFamily='"Arial Black", Impact, sans-serif'
        fontSize={104}
        letterSpacing={14}
        fill={cross > 0.5 ? "#d8fff0" : "#3a5550"}
        opacity={0.95}
      >
        PHARMACY
      </text>
      {/* the display window, smashed */}
      <rect
        x={x + 120}
        y={doorTop}
        width={1000}
        height={ground - doorTop - 40}
        fill="#081010"
      />
      {Array.from({ length: 4 }, (_, i) => (
        <g key={i}>
          <rect
            x={x + 160 + i * 240}
            y={doorTop + 120 + (i % 2) * 40}
            width={190}
            height={14}
            fill="#1a2626"
          />
          {Array.from({ length: 5 }, (_, k) => (
            <rect
              key={k}
              x={x + 170 + i * 240 + k * 36}
              y={doorTop + 76 + (i % 2) * 40}
              width={24}
              height={44}
              fill={rand(i * 5 + k) > 0.5 ? "#2c3d3a" : "#3a2c30"}
            />
          ))}
        </g>
      ))}
      <path
        d={`M ${x + 520} ${doorTop + 140} l 60 -40 l 50 70 l 70 -20 l -30 90 l 60 60 l -110 10 l -40 70 l -50 -80 l -80 -10 l 40 -70 Z`}
        fill="#020404"
      />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        return (
          <line
            key={i}
            x1={x + 590}
            y1={doorTop + 200}
            x2={x + 590 + Math.cos(a) * (200 + rand(i + 30) * 160)}
            y2={doorTop + 200 + Math.sin(a) * (150 + rand(i + 40) * 120)}
            stroke="#9fc4c0"
            strokeWidth={3}
            opacity={0.4}
          />
        );
      })}
      <rect
        x={x + 120}
        y={doorTop}
        width={1000}
        height={ground - doorTop - 40}
        fill="none"
        stroke="#1a2426"
        strokeWidth={16}
      />
      {/* glass door with the little bell visible inside */}
      <rect
        x={doorX - 14}
        y={doorTop - 14}
        width={doorW + 28}
        height={ground - doorTop + 14}
        fill="#141c1e"
      />
      <rect
        x={doorX}
        y={doorTop}
        width={doorW}
        height={ground - doorTop}
        fill="#0a1214"
      />
      <rect
        x={doorX + 20}
        y={doorTop + 20}
        width={doorW - 40}
        height={ground - doorTop - 140}
        fill="#050909"
        stroke="#2b3a3c"
        strokeWidth={6}
      />
      <rect
        x={doorX + 20}
        y={doorTop + 300}
        width={doorW - 40}
        height={40}
        fill="#c8352f"
      />
      <text
        x={doorX + doorW / 2}
        y={doorTop + 330}
        textAnchor="middle"
        fontFamily='"Arial Black", Impact, sans-serif'
        fontSize={30}
        fill="#fff"
      >
        CLOSED
      </text>
      <path
        d={`M ${doorX + doorW - 50} ${doorTop + 34} q 14 0 14 22 l -28 0 q 0 -22 14 -22`}
        fill="#b8933f"
        opacity={0.6}
      />
      <rect
        x={doorX + 30}
        y={doorTop + 420}
        width={60}
        height={12}
        rx={5}
        fill="#7d8890"
      />
      {/* hanging cross sign */}
      <rect
        x={x + w - 40}
        y={top + 230}
        width={180}
        height={10}
        fill="#1c2628"
      />
      <rect
        x={x + w + 120}
        y={top + 236}
        width={6}
        height={60}
        fill="#1c2628"
      />
      <Cross x={x + w + 123} y={top + 380} on={cross} />
      {/* sidewalk, street */}
      <rect x={-1600} y={ground} width={5600} height={60} fill="#2a2a34" />
      <rect
        x={-1600}
        y={ground + 60}
        width={5600}
        height={1500}
        fill="#121219"
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={-1200 + i * 700}
          y={ground + 220}
          width={260}
          height={12}
          fill="#34343e"
        />
      ))}
      {/* trash blowing past */}
      {Array.from({ length: 3 }, (_, i) => {
        const p = ((frame * (1.6 + i * 0.7) + i * 900) % 3600) - 1400;
        return (
          <rect
            key={i}
            x={p}
            y={ground + 20 - Math.abs(Math.sin(frame * 0.12 + i)) * 50}
            width={34}
            height={22}
            fill="#cfc6b0"
            opacity={0.5}
            transform={`rotate(${frame * (5 + i * 3)} ${p + 17} ${ground})`}
          />
        );
      })}
      {children}
      <ellipse
        cx={x + w + 123}
        cy={ground}
        rx={500}
        ry={60}
        fill="#3dff8a"
        opacity={0.06 * cross}
      />
    </g>
  );
};

// ---------- inside ----------
export const STORE = {
  floor: 1500,
  aisles: [-420, 220],
  standee: 1060,
  counter: { x: 1380, w: 560, top: 1230 },
  rack: { x: 1450, y: 860, w: 420, h: 280 },
  door: { x: 2240, top: 1060, w: 220 },
  bell: { x: 2290, y: 1046 },
};

const Shelf: React.FC<{ x: number; seed: number; tipped?: number }> = ({
  x,
  seed,
  tipped = 0,
}) => {
  const { floor } = STORE;
  const w = 520;
  const h = 560;
  const colors = [
    "#c94b4b",
    "#e9e4d8",
    "#4b8fc9",
    "#e2b13c",
    "#5fbf7a",
    "#b07ad0",
  ];
  return (
    <g transform={`rotate(${-tipped * 64} ${x} ${floor})`}>
      <rect x={x} y={floor - h} width={w} height={h} fill="#26302f" />
      {[0, 1, 2, 3].map((r) => {
        const sy = floor - h + 40 + r * 130;
        return (
          <g key={r}>
            <rect x={x} y={sy + 100} width={w} height={12} fill="#3a4746" />
            {Array.from({ length: 9 }, (_, k) => {
              const gone = rand(seed * 50 + r * 9 + k) > 0.55;
              if (gone) return null;
              const bh = 40 + rand(seed + r * 9 + k + 7) * 50;
              const bottle = rand(seed + r + k * 3) > 0.5;
              return bottle ? (
                <g key={k}>
                  <rect
                    x={x + 20 + k * 54}
                    y={sy + 100 - bh}
                    width={34}
                    height={bh}
                    rx={8}
                    fill={colors[(k + r + seed) % colors.length]}
                  />
                  <rect
                    x={x + 22 + k * 54}
                    y={sy + 100 - bh - 10}
                    width={30}
                    height={12}
                    rx={3}
                    fill="#f2f2f2"
                  />
                </g>
              ) : (
                <rect
                  key={k}
                  x={x + 16 + k * 54}
                  y={sy + 100 - bh}
                  width={44}
                  height={bh}
                  fill={colors[(k * 2 + r + seed) % colors.length]}
                  opacity={0.85}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

// The cardboard pharmacist standee: a big printed smile. `fall` 0..1 folds it over backwards.
export const Standee: React.FC<{ x: number; fall: number; wobble: number }> = ({
  x,
  fall,
  wobble,
}) => {
  const g = STORE.floor;
  return (
    <g transform={`rotate(${fall * 84 + wobble} ${x} ${g})`}>
      <rect
        x={x - 6}
        y={g - 200}
        width={12}
        height={200}
        fill="#6b5235"
        transform={`skewX(-14)`}
      />
      <path
        d={`M ${x - 90} ${g} L ${x - 96} ${g - 220} Q ${x - 100} ${g - 270} ${x - 60} ${g - 280} L ${x - 40} ${g - 290} L ${x + 40} ${g - 290} L ${x + 60} ${g - 280} Q ${x + 100} ${g - 270} ${x + 96} ${g - 220} L ${x + 90} ${g} Z`}
        fill="#efece4"
        stroke="#a07a4a"
        strokeWidth={8}
      />
      <rect x={x - 6} y={g - 280} width={12} height={180} fill="#cfd8dc" />
      <rect x={x - 50} y={g - 200} width={34} height={22} fill="#7fb7d8" />
      {/* head */}
      <circle
        cx={x}
        cy={g - 360}
        r={74}
        fill="#f1c7a0"
        stroke="#a07a4a"
        strokeWidth={8}
      />
      <path
        d={`M ${x - 72} ${g - 380} Q ${x - 60} ${g - 446} ${x} ${g - 440} Q ${x + 60} ${g - 446} ${x + 72} ${g - 380} Q ${x + 30} ${g - 410} ${x - 72} ${g - 380} Z`}
        fill="#5a3a26"
      />
      <circle
        cx={x - 26}
        cy={g - 370}
        r={16}
        fill="none"
        stroke="#222"
        strokeWidth={5}
      />
      <circle
        cx={x + 26}
        cy={g - 370}
        r={16}
        fill="none"
        stroke="#222"
        strokeWidth={5}
      />
      <circle cx={x - 26} cy={g - 370} r={5} fill="#222" />
      <circle cx={x + 26} cy={g - 370} r={5} fill="#222" />
      <path
        d={`M ${x - 46} ${g - 336} Q ${x} ${g - 270} ${x + 46} ${g - 336} Z`}
        fill="#fff"
        stroke="#7a2a2a"
        strokeWidth={5}
      />
      <line
        x1={x - 40}
        y1={g - 330}
        x2={x + 40}
        y2={g - 330}
        stroke="#ddd"
        strokeWidth={2}
      />
      {/* the sign it holds */}
      <rect
        x={x + 40}
        y={g - 230}
        width={150}
        height={90}
        rx={8}
        fill="#d93b3b"
        stroke="#a07a4a"
        strokeWidth={6}
      />
      <text
        x={x + 115}
        y={g - 196}
        textAnchor="middle"
        fontFamily='"Arial Black", Impact, sans-serif'
        fontSize={28}
        fill="#fff"
      >
        WE
      </text>
      <text
        x={x + 115}
        y={g - 160}
        textAnchor="middle"
        fontFamily='"Arial Black", Impact, sans-serif'
        fontSize={28}
        fill="#fff"
      >
        CARE ♥
      </text>
    </g>
  );
};

export const Bell: React.FC<{ swing: number }> = ({ swing }) => {
  const { x, y } = STORE.bell;
  return (
    <g>
      <rect x={x - 40} y={y - 26} width={80} height={10} fill="#2a2a2e" />
      <g transform={`rotate(${swing} ${x} ${y - 16})`}>
        <line
          x1={x}
          y1={y - 16}
          x2={x}
          y2={y}
          stroke="#8a7a50"
          strokeWidth={3}
        />
        <path
          d={`M ${x - 18} ${y + 30} Q ${x - 18} ${y} ${x} ${y} Q ${x + 18} ${y} ${x + 18} ${y + 30} Z`}
          fill="#c9a24a"
        />
        <circle cx={x + swing * 0.3} cy={y + 34} r={5} fill="#8a6a2a" />
      </g>
    </g>
  );
};

// The store, lit as if every light were on; <Darkness> then hides everything the torch doesn't reach.
export const Store: React.FC<{
  frame: number;
  door: number;
  standeeFall: number;
  standeeWobble: number;
  hookSwing: number;
  boxOut: number;
  children?: React.ReactNode;
  front?: React.ReactNode;
}> = ({
  frame,
  door,
  standeeFall,
  standeeWobble,
  hookSwing,
  boxOut,
  children,
  front,
}) => {
  const { floor, aisles, standee, counter, rack, door: d } = STORE;
  return (
    <g>
      {/* wall, tiles, floor */}
      <rect
        x={-1600}
        y={-600}
        width={5200}
        height={floor + 600}
        fill="#2f4644"
      />
      {Array.from({ length: 50 }, (_, i) => (
        <rect
          key={i}
          x={-1600 + i * 110}
          y={-600}
          width={4}
          height={floor + 600}
          fill="#365150"
        />
      ))}
      <rect x={-1600} y={680} width={5200} height={10} fill="#243836" />
      <rect x={-1600} y={floor} width={5200} height={900} fill="#1f2a2b" />
      {Array.from({ length: 30 }, (_, i) => (
        <line
          key={i}
          x1={-1600 + i * 180}
          y1={floor}
          x2={-1600 + i * 180 - 200}
          y2={floor + 500}
          stroke="#283536"
          strokeWidth={4}
        />
      ))}
      {/* the big PHARMACY sign above the counter */}
      <rect
        x={counter.x - 20}
        y={560}
        width={counter.w + 40}
        height={110}
        fill="#173130"
      />
      <text
        x={counter.x + counter.w / 2}
        y={640}
        textAnchor="middle"
        fontFamily='"Arial Black", Impact, sans-serif'
        fontSize={70}
        letterSpacing={8}
        fill="#cfeee4"
      >
        PHARMACY
      </text>
      {/* battery pegboard: every hook empty */}
      <rect
        x={rack.x}
        y={rack.y}
        width={rack.w}
        height={rack.h}
        fill="#8c7a5c"
      />
      {Array.from({ length: 10 }, (_, c) =>
        Array.from({ length: 6 }, (_, r) => (
          <circle
            key={`${c}-${r}`}
            cx={rack.x + 20 + c * 42}
            cy={rack.y + 60 + r * 40}
            r={4}
            fill="#5a4c38"
          />
        )),
      )}
      <rect x={rack.x} y={rack.y} width={rack.w} height={50} fill="#e2b13c" />
      <text
        x={rack.x + rack.w / 2}
        y={rack.y + 38}
        textAnchor="middle"
        fontFamily='"Arial Black", Impact, sans-serif'
        fontSize={34}
        fill="#1a1a1a"
      >
        BATTERIES
      </text>
      {Array.from({ length: 8 }, (_, i) => {
        const hx = rack.x + 40 + (i % 4) * 100;
        const hy = rack.y + 100 + Math.floor(i / 4) * 110;
        const sw = Math.sin(frame * 0.5 + i) * hookSwing * (1 + (i % 3));
        return (
          <line
            key={i}
            x1={hx}
            y1={hy}
            x2={hx + 50 * Math.cos((sw * Math.PI) / 180)}
            y2={hy + 50 * Math.sin((sw * Math.PI) / 180)}
            stroke="#c8c8cc"
            strokeWidth={6}
            strokeLinecap="round"
          />
        );
      })}
      {/* aisles, one tipped over */}
      <Shelf x={aisles[0]} seed={1} />
      <Shelf x={aisles[1]} seed={2} />
      <Shelf x={-1100} seed={3} tipped={1} />
      {/* scattered pills and boxes */}
      {Array.from({ length: 26 }, (_, i) => (
        <rect
          key={i}
          x={-900 + rand(i + 60) * 2000}
          y={floor - 8 - rand(i + 61) * 10}
          width={10 + rand(i + 62) * 30}
          height={8 + rand(i + 63) * 12}
          fill={["#e9e4d8", "#c94b4b", "#4b8fc9", "#e2b13c"][i % 4]}
          opacity={0.8}
          transform={`rotate(${rand(i + 64) * 60 - 30} ${-900 + rand(i + 60) * 2000} ${floor})`}
        />
      ))}
      <Standee x={standee} fall={standeeFall} wobble={standeeWobble} />
      {/* door: glass onto the orange-lit street */}
      <rect
        x={d.x - 16}
        y={d.top - 16}
        width={d.w + 32}
        height={floor - d.top + 16}
        fill="#141c1e"
      />
      <rect
        x={d.x}
        y={d.top}
        width={d.w}
        height={floor - d.top}
        fill="#a8512e"
      />
      <rect
        x={d.x}
        y={d.top + 300}
        width={d.w}
        height={floor - d.top - 300}
        fill="#3a1c14"
      />
      <g transform={`translate(${d.x} 0) scale(${1 - door * 0.75} 1)`}>
        <rect
          x={0}
          y={d.top}
          width={d.w}
          height={floor - d.top}
          fill="none"
          stroke="#2b3a3c"
          strokeWidth={14}
        />
        <rect
          x={10}
          y={d.top + 10}
          width={d.w - 20}
          height={floor - d.top - 20}
          fill="#e0a070"
          opacity={door > 0 ? 0.08 : 0.15}
        />
        <rect
          x={d.w - 50}
          y={d.top + 420}
          width={14}
          height={60}
          rx={5}
          fill="#7d8890"
        />
      </g>
      {children}
      {/* the counter (in front of the dog's hiding place) */}
      <rect
        x={counter.x}
        y={counter.top}
        width={counter.w}
        height={floor - counter.top}
        fill="#3c3530"
      />
      <rect
        x={counter.x - 14}
        y={counter.top - 18}
        width={counter.w + 28}
        height={20}
        fill="#5a4e44"
      />
      <rect
        x={counter.x + 360}
        y={counter.top - 110}
        width={130}
        height={92}
        rx={8}
        fill="#1b1b20"
      />
      <rect
        x={counter.x + 376}
        y={counter.top - 98}
        width={98}
        height={40}
        fill="#2a3a2a"
      />
      {/* the gap under the counter where the box was hiding */}
      <rect
        x={counter.x + 30}
        y={floor - 90}
        width={180}
        height={90}
        fill="#0d0b0a"
      />
      {boxOut < 1 ? (
        <rect
          x={counter.x + 60 + boxOut * 200}
          y={floor - 60}
          width={110}
          height={60}
          fill="#c27a2c"
          opacity={0.9}
        />
      ) : null}
      {front}
    </g>
  );
};

// A box of batteries (dragged out by Biscuit). `open` lifts the flaps.
export const BatteryBox: React.FC<{ x: number; y: number; open: number }> = ({
  x,
  y,
  open,
}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-55} y={-60} width={110} height={60} fill="#c27a2c" />
    <rect x={-55} y={-60} width={110} height={16} fill="#a5631f" />
    <text
      x={0}
      y={-16}
      textAnchor="middle"
      fontFamily='"Arial Black", Impact, sans-serif'
      fontSize={24}
      fill="#1a1a1a"
    >
      AA ×24
    </text>
    <rect
      x={-55}
      y={-64}
      width={56}
      height={10}
      fill="#d18a3a"
      transform={`rotate(${-open * 120} -55 -60)`}
    />
    <rect
      x={-1}
      y={-64}
      width={56}
      height={10}
      fill="#d18a3a"
      transform={`rotate(${open * 120} 55 -60)`}
    />
    {open > 0.5
      ? [-30, -10, 10, 30].map((bx) => (
          <g key={bx}>
            <rect
              x={bx - 6}
              y={-86}
              width={12}
              height={34}
              rx={3}
              fill="#222"
            />
            <rect
              x={bx - 6}
              y={-86}
              width={12}
              height={10}
              rx={3}
              fill="#e2b13c"
            />
          </g>
        ))
      : null}
  </g>
);

export type Light =
  | {
      kind: "cone";
      x: number;
      y: number;
      dir: number;
      len?: number;
      spread?: number;
      power?: number;
    }
  | { kind: "glow"; x: number; y: number; r: number; power?: number };

// Pitch black over the scene, with holes cut by every light. Draw it inside the camera group.
export const Darkness: React.FC<{
  id: string;
  lights: Light[];
  dark?: number;
}> = ({ id, lights, dark = 0.95 }) => (
  <g>
    <defs>
      <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={22} />
      </filter>
      <mask
        id={id}
        maskUnits="userSpaceOnUse"
        x={-3000}
        y={-3000}
        width={9000}
        height={9000}
      >
        <rect x={-3000} y={-3000} width={9000} height={9000} fill="#fff" />
        <g filter={`url(#${id}-blur)`}>
          {lights.map((l, i) => {
            const v = Math.round(255 * (1 - (l.power ?? 1)));
            const fill = `rgb(${v},${v},${v})`;
            if (l.kind === "glow")
              return <circle key={i} cx={l.x} cy={l.y} r={l.r} fill={fill} />;
            const len = l.len ?? 1500;
            const sp = ((l.spread ?? 15) * Math.PI) / 180;
            const a = (l.dir * Math.PI) / 180;
            const p1 = [
              l.x + Math.cos(a - sp) * len,
              l.y + Math.sin(a - sp) * len,
            ];
            const p2 = [
              l.x + Math.cos(a + sp) * len,
              l.y + Math.sin(a + sp) * len,
            ];
            return (
              <g key={i}>
                <polygon
                  points={`${l.x},${l.y} ${p1.join(",")} ${p2.join(",")}`}
                  fill={fill}
                />
                <circle cx={l.x} cy={l.y} r={70} fill={fill} />
              </g>
            );
          })}
        </g>
      </mask>
    </defs>
    <rect
      x={-3000}
      y={-3000}
      width={9000}
      height={9000}
      fill="#02030a"
      opacity={dark}
      mask={`url(#${id})`}
    />
    {/* visible haze in each torch beam */}
    {lights.map((l, i) => {
      if (l.kind !== "cone") return null;
      const len = (l.len ?? 1500) * 0.8;
      const sp = ((l.spread ?? 15) * Math.PI) / 180;
      const a = (l.dir * Math.PI) / 180;
      return (
        <polygon
          key={i}
          points={`${l.x},${l.y} ${l.x + Math.cos(a - sp) * len},${l.y + Math.sin(a - sp) * len} ${l.x + Math.cos(a + sp) * len},${l.y + Math.sin(a + sp) * len}`}
          fill="#fff3c4"
          opacity={0.09 * (l.power ?? 1)}
        />
      );
    })}
  </g>
);

export const Flashlight: React.FC<{
  x: number;
  y: number;
  dir: number;
  on: number;
}> = ({ x, y, dir, on }) => (
  <g transform={`translate(${x} ${y}) rotate(${dir})`}>
    <rect x={-34} y={-9} width={46} height={18} rx={5} fill="#2a2d33" />
    <rect x={10} y={-13} width={18} height={26} rx={4} fill="#3a3e46" />
    <circle cx={28} cy={0} r={11} fill={on > 0.5 ? "#fff6d0" : "#555"} />
  </g>
);

// A moth circling in the torchlight: life in the dark
export const Moth: React.FC<{ x: number; y: number; frame: number }> = ({
  x,
  y,
  frame,
}) => {
  const mx = x + Math.sin(frame * 0.21) * 70 + Math.sin(frame * 0.53) * 24;
  const my = y + Math.cos(frame * 0.17) * 50 + Math.sin(frame * 0.71) * 14;
  const flap = Math.abs(Math.sin(frame * 1.9));
  return (
    <g transform={`translate(${mx} ${my})`}>
      <ellipse
        cx={-8}
        cy={0}
        rx={12}
        ry={4 + flap * 6}
        fill="#d8cfb0"
        opacity={0.9}
      />
      <ellipse
        cx={8}
        cy={0}
        rx={12}
        ry={4 + flap * 6}
        fill="#d8cfb0"
        opacity={0.9}
      />
      <ellipse cx={0} cy={0} rx={3} ry={7} fill="#6a5a40" />
    </g>
  );
};

// The road map on the counter: the route north to Gull Point draws itself, the lighthouse lamp turns on.
export const RoadMap: React.FC<{
  frame: number;
  route: number;
  lamp: number;
  fingerX: number;
  fingerY: number;
  finger: number;
}> = ({ frame, route, lamp, fingerX, fingerY, finger }) => {
  const path =
    "M 380 1500 C 420 1380 330 1290 420 1180 S 560 1010 520 880 S 600 650 700 540 S 760 420 760 380";
  const total = 1400;
  return (
    <g>
      <rect x={-200} y={-200} width={1480} height={2320} fill="#1a1410" />
      <g transform={`rotate(-4 540 960)`}>
        <rect x={80} y={180} width={920} height={1560} fill="#e9dfc4" />
        {/* folds */}
        {[1, 2].map((i) => (
          <rect
            key={i}
            x={80 + i * 306}
            y={180}
            width={4}
            height={1560}
            fill="#c9bea4"
          />
        ))}
        {[1, 2, 3].map((i) => (
          <rect
            key={i}
            x={80}
            y={180 + i * 390}
            width={920}
            height={4}
            fill="#c9bea4"
          />
        ))}
        {/* sea on the right, coastline */}
        <path
          d="M 1000 180 L 860 180 C 820 300 900 380 840 480 S 880 700 800 820 S 900 1100 840 1260 S 920 1550 880 1740 L 1000 1740 Z"
          fill="#9cc3d6"
        />
        {/* roads, towns */}
        <path
          d="M 80 1300 L 1000 1180 M 200 180 L 380 1740 M 80 700 Q 500 760 820 640"
          stroke="#d07a4a"
          strokeWidth={10}
          fill="none"
          opacity={0.7}
        />
        <path
          d="M 80 1000 Q 400 980 700 1100 M 600 180 Q 560 600 640 1740"
          stroke="#b8ac90"
          strokeWidth={6}
          fill="none"
        />
        {[
          [300, 1420, "MILLBROOK"],
          [560, 1060, "ASHFORD"],
          [470, 760, "PINE HOLLOW"],
        ].map(([tx, ty, name]) => (
          <g key={name as string}>
            <circle cx={tx as number} cy={ty as number} r={9} fill="#4a3a2a" />
            <text
              x={(tx as number) + 18}
              y={(ty as number) + 8}
              fontFamily="Arial, sans-serif"
              fontWeight={700}
              fontSize={26}
              fill="#4a3a2a"
            >
              {name}
            </text>
          </g>
        ))}
        <text
          x={120}
          y={240}
          fontFamily='"Arial Black", Impact, sans-serif'
          fontSize={34}
          fill="#6a5a40"
        >
          COASTAL ROAD MAP
        </text>
        <text
          x={900}
          y={240}
          textAnchor="end"
          fontFamily='"Arial Black", Impact, sans-serif'
          fontSize={40}
          fill="#6a5a40"
        >
          N ↑
        </text>
        {/* you are here */}
        <circle
          cx={380}
          cy={1500}
          r={28}
          fill="none"
          stroke="#c8352f"
          strokeWidth={7}
        />
        <path
          d="M 362 1482 L 398 1518 M 398 1482 L 362 1518"
          stroke="#c8352f"
          strokeWidth={7}
        />
        {/* the route */}
        <path
          d={path}
          stroke="#c8352f"
          strokeWidth={9}
          fill="none"
          strokeDasharray="26 18"
          strokeLinecap="round"
          opacity={0.95}
        />
        <path
          d={path}
          stroke="#e9dfc4"
          strokeWidth={14}
          fill="none"
          strokeDasharray={`${total} ${total}`}
          strokeDashoffset={-route * total}
        />
        {/* the lighthouse at Gull Point */}
        <g transform="translate(780 360)">
          {lamp > 0 ? (
            <g opacity={lamp}>
              <polygon
                points={`0,-120 ${Math.cos(frame * 0.12) * 520},${-120 + Math.sin(frame * 0.12) * 120 - 60} ${Math.cos(frame * 0.12) * 520},${-120 + Math.sin(frame * 0.12) * 120 + 60}`}
                fill="#ffe9a0"
                opacity={0.7}
              />
              <circle
                cx={0}
                cy={-120}
                r={70}
                fill="#ffe9a0"
                opacity={0.5}
                filter="url(#soft)"
              />
            </g>
          ) : null}
          <polygon
            points="-34,0 34,0 20,-110 -20,-110"
            fill="#f4f0e6"
            stroke="#4a3a2a"
            strokeWidth={5}
          />
          <rect x={-30} y={-60} width={60} height={18} fill="#c8352f" />
          <rect
            x={-24}
            y={-140}
            width={48}
            height={30}
            fill={lamp > 0 ? "#ffe9a0" : "#4a3a2a"}
            stroke="#4a3a2a"
            strokeWidth={5}
          />
          <polygon points="-30,-140 30,-140 0,-170" fill="#4a3a2a" />
          <text
            x={-60}
            y={64}
            textAnchor="end"
            fontFamily='"Arial Black", Impact, sans-serif'
            fontSize={36}
            fill="#4a3a2a"
          >
            GULL POINT
          </text>
        </g>
        {route > 0.95 ? (
          <g
            transform={`translate(430 480) scale(${Math.min(1, (route - 0.95) * 30)})`}
          >
            <rect
              x={-90}
              y={-40}
              width={180}
              height={70}
              rx={14}
              fill="#c8352f"
            />
            <text
              x={0}
              y={12}
              textAnchor="middle"
              fontFamily='"Arial Black", Impact, sans-serif'
              fontSize={40}
              fill="#fff"
            >
              50 MI
            </text>
          </g>
        ) : null}
        {/* Kai's finger tracing the route */}
        {finger > 0 ? (
          <line
            x1={fingerX + 80}
            y1={fingerY + 1400}
            x2={fingerX}
            y2={fingerY + 6}
            stroke="#111"
            strokeWidth={26}
            strokeLinecap="round"
            opacity={finger}
          />
        ) : null}
        {finger > 0 ? (
          <circle
            cx={fingerX}
            cy={fingerY}
            r={22}
            fill="#c8352f"
            opacity={0.5 * finger}
          />
        ) : null}
      </g>
      {/* torchlight pool over the map */}
      <defs>
        <radialGradient id="mapTorch" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.5" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.88} />
        </radialGradient>
      </defs>
      <ellipse
        cx={540 + Math.sin(frame * 0.05) * 40}
        cy={960 + Math.cos(frame * 0.04) * 60}
        rx={900}
        ry={1200}
        fill="url(#mapTorch)"
      />
    </g>
  );
};
