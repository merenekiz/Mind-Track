"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/Icons";
import type { HealthData } from "@/services/types";

type Range = 7 | 14 | 30;
type Metric = "stress_level" | "sleep_hours" | "pain_level" | "mood";

const METRICS: { key: Metric; label: string; color: string; max: number; unit: string; mapMood?: boolean }[] = [
  { key: "stress_level", label: "Stres", color: "#FF5C7A", max: 10, unit: "/10" },
  { key: "sleep_hours", label: "Uyku", color: "#7C5AED", max: 10, unit: "sa" },
  { key: "pain_level", label: "Ağrı", color: "#F4B740", max: 10, unit: "/10" },
  { key: "mood", label: "Ruh hali", color: "#5EE6C7", max: 5, unit: "/5", mapMood: true },
];

const moodScore: Record<string, number> = { very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5 };

function formatLongDate(d: Date) {
  return d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function fmtShort(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function LineCard({ data, color, max }: { data: { label: string; value: number }[]; color: string; max: number }) {
  if (data.length < 2) {
    return (
      <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--n-400)", fontSize: 13 }}>
        Trend için en az 2 günlük kayıt gerekli.
      </div>
    );
  }
  const w = 600, h = 200;
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"} ${(i / (data.length - 1)) * w} ${h - (d.value / max) * h}`).join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  const id = `metric-${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} style={{ width: "100%", height: 240 }}>
      <defs>
        <linearGradient id={`${id}-line`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#7C5AED" />
        </linearGradient>
        <linearGradient id={`${id}-area`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="0" x2={w} y1={i * (h / 4)} y2={i * (h / 4)} stroke="var(--n-700)" strokeDasharray="2 4" />
      ))}
      <path d={area} fill={`url(#${id}-area)`} />
      <path d={path} fill="none" stroke={`url(#${id}-line)`} strokeWidth="2" />
      {data.map((d, i) => (
        <circle key={i} cx={(i / (data.length - 1)) * w} cy={h - (d.value / max) * h} r="4" fill="var(--n-950)" stroke={color} strokeWidth="2" />
      ))}
      <g fontSize="10" fill="var(--n-400)" fontFamily="var(--font-mono)">
        {data.map((d, i) => {
          if (i % Math.max(1, Math.floor(data.length / 6)) !== 0) return null;
          return <text key={i} x={(i / (data.length - 1)) * w} y={h + 18}>{d.label}</text>;
        })}
      </g>
    </svg>
  );
}

export default function AnalizlerPage() {
  const { user } = useAuth();
  const [data, setData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>(7);
  const [metric, setMetric] = useState<Metric>("stress_level");

  const load = useCallback(async () => {
    try {
      setData((await api.getHealthData()) || []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  const sliced = useMemo(() => data.slice(-range), [data, range]);
  const cfg = METRICS.find((m) => m.key === metric)!;

  const series = sliced.map((d) => {
    let v: number;
    if (cfg.mapMood) v = d.mood ? moodScore[d.mood] : 0;
    else v = (d[cfg.key] as number | null) ?? 0;
    return { label: fmtShort(d.date), value: v };
  });

  const validValues = series.filter((s) => s.value > 0).map((s) => s.value);
  const peak = validValues.length ? Math.max(...validValues) : 0;
  const low = validValues.length ? Math.min(...validValues) : 0;
  const avg = validValues.length ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;

  return (
    <div className="flex flex-col h-full">
      <header className="lm-topbar">
        <h1>
          {cfg.label} trendi <span className="date-sub">{formatLongDate(new Date())}</span>
        </h1>
        <div className="actions">
          <div className="lm-search">
            <Icon.Search width={14} height={14} />
            <span>Metrik ara</span>
            <kbd>⌘ K</kbd>
          </div>
          <button className="lm-icon-btn" title="Bildirimler">
            <Icon.Bell width={16} height={16} />
            <i className="dot" />
          </button>
          <Link href="/dashboard/raporlar" className="lm-btn lm-btn-secondary">
            <Icon.Document width={14} height={14} /> Rapor
          </Link>
        </div>
      </header>

      <div className="lm-content flex-1 overflow-y-auto">
        {/* Chip filter row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--n-300)", overflowX: "auto", paddingBottom: 4, marginBottom: -8, flexWrap: "wrap" }}>
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className="lm-tag"
              style={{
                padding: "8px 14px",
                borderRadius: "var(--r-full)",
                background: metric === m.key ? "var(--primary-500)" : "var(--n-800)",
                color: metric === m.key ? "#fff" : "var(--n-300)",
                border: `1px solid ${metric === m.key ? "var(--primary-500)" : "var(--n-700)"}`,
                fontWeight: metric === m.key ? 600 : 500,
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              {m.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {([7, 14, 30] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: "8px 14px",
                borderRadius: "var(--r-full)",
                background: range === r ? "var(--n-700)" : "var(--n-800)",
                color: range === r ? "#fff" : "var(--n-400)",
                border: `1px solid ${range === r ? "var(--n-600)" : "var(--n-700)"}`,
                fontWeight: range === r ? 600 : 500,
                whiteSpace: "nowrap",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
              }}
            >
              Son {r}g
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--n-700)", borderTopColor: "var(--primary-500)", animation: "spin 0.8s linear infinite" }} />
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : data.length === 0 ? (
          <div className="lm-panel" style={{ textAlign: "center", padding: "64px 32px", minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "inline-flex", padding: 16, borderRadius: 999, background: "rgba(124,90,237,0.12)", color: "var(--primary-300)", marginBottom: 16 }}>
              <Icon.Chart width={28} height={28} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--n-100)", marginBottom: 8 }}>Analiz için veri yok</h3>
            <p style={{ fontSize: 13, color: "var(--n-400)", marginBottom: 20, lineHeight: 1.6 }}>
              Birkaç günlük kayıt sonrası analiz görünür hale gelir.
            </p>
            <Link href="/dashboard/new" className="lm-btn lm-btn-primary" style={{ display: "inline-flex" }}>
              <Icon.Plus width={14} height={14} /> İlk kayıt
            </Link>
          </div>
        ) : (
          <>
            {/* 3 mini stats */}
            <div className="lm-kpi-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div className="lm-kpi">
                <div className="label"><Icon.Heart width={11} height={11} /> Zirve</div>
                <div className="value danger">{peak.toFixed(1)}<span style={{ fontSize: 14, color: "var(--n-400)" }}>{cfg.unit}</span></div>
                <div className="delta down">En yüksek değer</div>
              </div>
              <div className="lm-kpi">
                <div className="label"><Icon.Chart width={11} height={11} /> Ortalama</div>
                <div className="value">{avg.toFixed(1)}<span style={{ fontSize: 14, color: "var(--n-400)" }}>{cfg.unit}</span></div>
                <div className="delta up">{validValues.length} kayıttan</div>
              </div>
              <div className="lm-kpi">
                <div className="label"><Icon.Sparkle width={11} height={11} /> En düşük</div>
                <div className="value success">{low.toFixed(1)}<span style={{ fontSize: 14, color: "var(--n-400)" }}>{cfg.unit}</span></div>
                <div className="delta up">İyi gün referansı</div>
              </div>
            </div>

            {/* Main trend */}
            <div className="lm-panel">
              <div className="lm-panel-head">
                <h3>{cfg.label} · son {range} gün</h3>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--n-400)" }}>
                  {sliced[0]?.date && sliced[sliced.length - 1]?.date
                    ? `${fmtShort(sliced[0].date)} – ${fmtShort(sliced[sliced.length - 1].date)}`
                    : ""}
                </span>
              </div>
              <LineCard data={series} color={cfg.color} max={cfg.max} />
            </div>

            {/* Insight */}
            <div className="lm-panel lm-insight">
              <div className="lm-panel-head">
                <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon.Sparkle width={14} height={14} /> Eğilim
                </h3>
              </div>
              <div style={{ fontSize: 13, color: "var(--n-200)", lineHeight: 1.6 }}>
                {validValues.length < 2
                  ? "Daha fazla veri toplandıkça trend yorumu görünecek."
                  : peak > avg * 1.4
                  ? `${cfg.label} en yüksek değerine ulaştığında ortalamanın %${Math.round((peak / avg - 1) * 100)} üzerine çıktı. Bu pikleri tetikleyen faktörlere yakın bak.`
                  : `${cfg.label} stabil bir bantta — pik ile ortalama arasındaki fark düşük.`}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
