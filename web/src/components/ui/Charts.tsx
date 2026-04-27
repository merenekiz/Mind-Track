"use client";

// Lightweight SVG charts — no external deps
// Line, Bar, Donut, Sparkline

interface DataPoint { label: string; value: number }

export function LineChart({ data, height = 220, color = "var(--mt-primary)", gradient = true, showAxis = true }: { data: DataPoint[]; height?: number; color?: string; gradient?: boolean; showAxis?: boolean }) {
  if (data.length === 0) return null;
  const W = 600, H = height;
  const pad = { l: 36, r: 16, t: 16, b: 28 };
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;
  const stepX = (W - pad.l - pad.r) / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => {
    const x = pad.l + i * stepX;
    const y = pad.t + (1 - (d.value - min) / range) * (H - pad.t - pad.b);
    return { x, y, ...d };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${path} L ${points[points.length - 1].x.toFixed(1)} ${H - pad.b} L ${points[0].x.toFixed(1)} ${H - pad.b} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showAxis && [0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = pad.t + t * (H - pad.t - pad.b);
        return (
          <line key={t} x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="var(--mt-border)" strokeDasharray="3 4" strokeWidth="1" />
        );
      })}
      {gradient && <path d={area} fill="url(#lineFill)" />}
      <path d={path} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--mt-bg)" stroke={color} strokeWidth="2" />
      ))}
      {showAxis && points.map((p, i) => (
        <text key={i} x={p.x} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--mt-muted)">{p.label}</text>
      ))}
    </svg>
  );
}

export function BarChart({ data, height = 220, color = "var(--mt-primary)" }: { data: DataPoint[]; height?: number; color?: string }) {
  if (data.length === 0) return null;
  const W = 600, H = height;
  const pad = { l: 32, r: 16, t: 16, b: 28 };
  const max = Math.max(...data.map((d) => d.value), 1);
  const stepX = (W - pad.l - pad.r) / data.length;
  const barW = stepX * 0.55;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => {
        const y = pad.t + t * (H - pad.t - pad.b);
        return <line key={t} x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="var(--mt-border)" strokeDasharray="3 4" strokeWidth="1" />;
      })}
      {data.map((d, i) => {
        const x = pad.l + i * stepX + (stepX - barW) / 2;
        const h = (d.value / max) * (H - pad.t - pad.b);
        const y = H - pad.b - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx="6" fill="url(#barFill)" />
            <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--mt-muted)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Donut({ value, max = 100, size = 140, stroke = 12, color = "var(--mt-primary)", label }: { value: number; max?: number; size?: number; stroke?: number; color?: string; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--mt-surface3)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: "var(--mt-text)" }}>{value}</span>
        {label && <span style={{ fontSize: 11, color: "var(--mt-muted)", marginTop: 2 }}>{label}</span>}
      </div>
    </div>
  );
}

export function Sparkline({ data, color = "var(--mt-primary)", height = 40 }: { data: number[]; color?: string; height?: number }) {
  if (data.length === 0) return null;
  const W = 120, H = height;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = W / Math.max(data.length - 1, 1);
  const path = data.map((v, i) => {
    const x = i * step;
    const y = (1 - (v - min) / range) * H;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
