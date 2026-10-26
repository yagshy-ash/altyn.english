"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS = { fontSize: 12, fill: "var(--muted)", fontWeight: 700 };
const TOOLTIP = {
  contentStyle: { borderRadius: 16, border: "2px solid var(--line)", background: "var(--sheet)", fontWeight: 700 },
  labelStyle: { color: "var(--muted)" },
};
const CEFR_LABELS = ["", "A1", "A2", "B1", "B2", "C1", "C2"];

export function MinutesBars({ data, color = "#1cb0f6", height = 200 }: { data: { day: string; minutes: number }[]; color?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip {...TOOLTIP} cursor={{ fill: "var(--line)", opacity: 0.4 }} />
        <Bar dataKey="minutes" fill={color} radius={[8, 8, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SkillBars({ data, height = 220 }: { data: { name: string; score: number; color: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={96} />
        <Tooltip {...TOOLTIP} cursor={{ fill: "var(--line)", opacity: 0.4 }} />
        <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={20} background={{ fill: "var(--line)", radius: 10 }}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ScoreLine({ data, height = 200 }: { data: { label: string; score: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis domain={[0, 100]} tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip {...TOOLTIP} />
        <Line type="monotone" dataKey="score" stroke="#58cc02" strokeWidth={4} dot={{ r: 4, fill: "#58cc02" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Seviye 1–6 (A1–C2) olarak çizilir
export function LevelLine({ data, height = 180 }: { data: { label: string; level: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis domain={[1, 6]} ticks={[1, 2, 3, 4, 5, 6]} tickFormatter={(v) => CEFR_LABELS[v]} tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip {...TOOLTIP} formatter={(v) => CEFR_LABELS[Number(v)]} />
        <Line type="stepAfter" dataKey="level" stroke="#ce82ff" strokeWidth={4} dot={{ r: 4, fill: "#ce82ff" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
