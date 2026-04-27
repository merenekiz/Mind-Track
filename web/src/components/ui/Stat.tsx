import { ReactNode } from "react";
import Card from "./Card";

interface StatProps {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: { value: number; positive?: boolean; label?: string };
  icon?: ReactNode;
  accent?: "primary" | "secondary" | "success" | "warn" | "danger" | "ai";
  spark?: number[];
}

const accentMap = {
  primary: "var(--mt-primary)",
  secondary: "var(--mt-secondary)",
  success: "var(--mt-success)",
  warn: "var(--mt-warn)",
  danger: "var(--mt-danger)",
  ai: "var(--mt-mint)",
} as const;

export default function Stat({ label, value, unit, delta, icon, accent = "primary", spark }: StatProps) {
  const color = accentMap[accent];

  return (
    <Card padding={20} radius={18}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--mt-text3)" }}>
          {label}
        </p>
        {icon && (
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: `color-mix(in oklab, ${color} 16%, transparent)`,
              border: `1px solid color-mix(in oklab, ${color} 28%, transparent)`,
              color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          className="mt-mono"
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: "var(--mt-text)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          {value}
        </span>
        {unit && <span style={{ fontSize: 13, color: "var(--mt-text3)", fontWeight: 500 }}>{unit}</span>}
      </div>
      {delta !== undefined && (
        <p
          style={{
            marginTop: 10,
            fontSize: 12,
            fontWeight: 600,
            color: delta.positive ? "var(--mt-success)" : "var(--mt-danger)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span>{delta.positive ? "▲" : "▼"}</span>
          <span>{Math.abs(delta.value)}%</span>
          <span style={{ color: "var(--mt-text3)", fontWeight: 500 }}>{delta.label ?? "son haftaya göre"}</span>
        </p>
      )}
      {spark && spark.length > 1 && (
        <div style={{ marginTop: 12 }}>
          <Sparkline values={spark} color={color} />
        </div>
      )}
    </Card>
  );
}

function Sparkline({ values, color, height = 36 }: { values: number[]; color: string; height?: number }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 200;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`)
    .join(" ");
  const area = `0,${height} ${points} ${w},${height}`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ width: "100%", height }}>
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={area} fill={`url(#sg-${color})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
