"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";

import { Icon } from "@/components/ui/Icons";
import { buildLocalInsight } from "@/services/insights";
import type { HealthData, ImageAnalysis, Symptom, AIInsight as AIInsightType } from "@/services/types";

function formatShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function formatLongDate(d: Date) {
  return d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

type TrendKey = "stress_level" | "sleep_hours" | "mood" | "pain_level";

const TREND_TABS: { key: TrendKey; label: string; color: string; max: number; mapMood?: boolean }[] = [
  { key: "stress_level", label: "Stres", color: "#FF5C7A", max: 10 },
  { key: "sleep_hours", label: "Uyku", color: "#7C5AED", max: 10 },
  { key: "mood", label: "Enerji", color: "#5EE6C7", max: 5, mapMood: true },
  { key: "pain_level", label: "Belirti", color: "#F4B740", max: 10 },
];

const moodScore: Record<string, number> = { very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5 };

function TrendChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  if (data.length < 2) {
    return (
      <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--n-400)", fontSize: 13 }}>
        Trend için en az 2 günlük kayıt gerekli.
      </div>
    );
  }
  const w = 600, h = 180;
  const max = Math.max(...data.map((d) => d.value), 1);
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"} ${(i / (data.length - 1)) * w} ${h - (d.value / max) * h}`).join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  const id = `grad-${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} style={{ width: "100%", height: 200 }}>
      <defs>
        <linearGradient id={`${id}-line`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#FF5C7A" />
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
          return (
            <text key={i} x={(i / (data.length - 1)) * w} y={h + 18}>{d.label}</text>
          );
        })}
      </g>
    </svg>
  );
}

function ScatterChart({ points }: { points: [number, number][] }) {
  const w = 280, h = 160;
  if (points.length < 2) {
    return (
      <div style={{ height: 170, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--n-400)", fontSize: 12 }}>
        Korelasyon için yeterli veri yok.
      </div>
    );
  }
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} style={{ width: "100%", height: 170 }}>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1="0" x2={w} y1={i * (h / 3)} y2={i * (h / 3)} stroke="var(--n-700)" strokeDasharray="2 4" />
      ))}
      <line x1="20" y1="20" x2={w - 10} y2={h - 10} stroke="var(--primary-500)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={(x / 10) * w} cy={h - (y / 10) * h} r="4" fill="var(--primary-500)" opacity="0.85" />
      ))}
    </svg>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [images, setImages] = useState<ImageAnalysis[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendTab, setTrendTab] = useState<TrendKey>("stress_level");

  const loadAll = useCallback(async () => {
    try {
      const [hd, img, sym] = await Promise.all([
        api.getHealthData().catch(() => []),
        api.getImageAnalyses().catch(() => []),
        api.getSymptoms().catch(() => []),
      ]);
      setHealthData(hd || []);
      setImages(img || []);
      setSymptoms(sym || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadAll();
  }, [user, loadAll]);

  const recent = useMemo(() => healthData.slice(-7), [healthData]);
  const prev = useMemo(() => healthData.slice(-14, -7), [healthData]);

  const avg = (arr: HealthData[], key: keyof HealthData, mapMood = false) => {
    const valid = arr
      .map((d) => (mapMood ? (d.mood ? moodScore[d.mood] : null) : (d[key] as number | null | undefined)))
      .filter((v): v is number => v !== null && v !== undefined);
    if (!valid.length) return null;
    return valid.reduce((s, v) => s + v, 0) / valid.length;
  };

  const avgSleep = avg(recent, "sleep_hours");
  const avgStress = avg(recent, "stress_level");
  const avgPain = avg(recent, "pain_level");
  const avgEnergy = avg(recent, "mood", true);

  const prevSleep = avg(prev, "sleep_hours");
  const prevStress = avg(prev, "stress_level");
  const prevEnergy = avg(prev, "mood", true);

  const pctDelta = (cur: number | null, prev: number | null) => {
    if (cur === null || prev === null || prev === 0) return null;
    return ((cur - prev) / prev) * 100;
  };

  const stressDelta = pctDelta(avgStress, prevStress);
  const sleepDelta = pctDelta(avgSleep, prevSleep);
  const energyDelta = pctDelta(avgEnergy, prevEnergy);

  const insight: AIInsightType | null = buildLocalInsight({ healthData, imageAnalyses: images, symptoms });

  const symptomCounts: Record<string, number> = {};
  symptoms.slice(-10).forEach((s) => {
    s.detected_symptoms?.symptoms?.forEach((sym) => {
      const k = sym.name;
      symptomCounts[k] = (symptomCounts[k] || 0) + 1;
    });
  });
  const topSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const totalSymptomCount = Object.values(symptomCounts).reduce((a, b) => a + b, 0);

  const trendTabConfig = TREND_TABS.find((t) => t.key === trendTab)!;
  const trendData = recent.map((d) => {
    let v: number;
    if (trendTabConfig.mapMood) v = d.mood ? moodScore[d.mood] : 0;
    else v = (d[trendTabConfig.key] as number | null) ?? 0;
    return { label: formatShort(d.date), value: v };
  });

  const scatterPoints: [number, number][] = recent
    .filter((d) => d.stress_level != null && d.sleep_hours != null)
    .map((d) => [d.stress_level as number, d.sleep_hours as number]);

  const recentActivity = healthData.slice(-4).reverse();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--n-700)", borderTopColor: "var(--primary-500)", animation: "spin 0.8s linear infinite" }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const today = new Date();
  const energyLabel = avgEnergy === null ? "—" : avgEnergy >= 4 ? "Yüksek" : avgEnergy >= 3 ? "Orta" : "Düşük";
  const stressLabel = avgStress === null ? "—" : avgStress >= 7 ? "Yüksek" : avgStress >= 5 ? "Orta" : "Düşük";
  const stressClass = avgStress !== null && avgStress >= 7 ? "danger" : avgStress !== null && avgStress >= 5 ? "warning" : "success";
  const energyClass = avgEnergy !== null && avgEnergy >= 4 ? "success" : avgEnergy !== null && avgEnergy >= 3 ? "warning" : "danger";

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <header className="lm-topbar">
        <h1>
          Genel bakış <span className="date-sub">{formatLongDate(today)}</span>
        </h1>
        <div className="actions">
          <div className="lm-search">
            <Icon.Search width={14} height={14} />
            <span>Her yerde ara</span>
            <kbd>⌘ K</kbd>
          </div>
          <button className="lm-icon-btn" title="Bildirimler">
            <Icon.Bell width={16} height={16} />
            <i className="dot" />
          </button>
          <Link href="/dashboard/new" className="lm-btn lm-btn-primary">
            <Icon.Plus width={14} height={14} /> Yeni kayıt
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="lm-content flex-1 overflow-y-auto">
        {/* KPI row — 5 cols */}
        <div className="lm-kpi-row">
          <div className="lm-kpi">
            <div className="label"><Icon.Heart width={11} height={11} /> Stres seviyesi</div>
            <div className={`value ${stressClass}`}>{stressLabel}</div>
            <div className={`delta ${stressDelta !== null && stressDelta > 0 ? "down" : "up"}`}>
              {stressDelta !== null ? `${stressDelta > 0 ? "+" : ""}%${Math.abs(stressDelta).toFixed(0)} (geçen hafta)` : "Veri yok"}
            </div>
          </div>
          <div className="lm-kpi">
            <div className="label"><Icon.Moon width={11} height={11} /> Uyku ort.</div>
            <div className="value">
              {avgSleep !== null ? avgSleep.toFixed(1) : "—"}
              <span style={{ fontSize: 14, color: "var(--n-400)" }}>sa</span>
            </div>
            <div className={`delta ${sleepDelta !== null && sleepDelta < 0 ? "down" : "up"}`}>
              {sleepDelta !== null ? `${sleepDelta > 0 ? "+" : ""}%${Math.abs(sleepDelta).toFixed(0)} (geçen hafta)` : "Veri yok"}
            </div>
          </div>
          <div className="lm-kpi">
            <div className="label"><Icon.Sparkle width={11} height={11} /> Enerji</div>
            <div className={`value ${energyClass}`}>{energyLabel}</div>
            <div className={`delta ${energyDelta !== null && energyDelta < 0 ? "down" : "up"}`}>
              {energyDelta !== null ? `${energyDelta > 0 ? "+" : ""}%${Math.abs(energyDelta).toFixed(0)} (geçen hafta)` : "Veri yok"}
            </div>
          </div>
          <div className="lm-kpi">
            <div className="label"><Icon.Heart width={11} height={11} /> Belirti</div>
            <div className="value">{totalSymptomCount}</div>
            <div className="delta up">{symptoms.length} kayıt</div>
          </div>
          <div className="lm-kpi">
            <div className="label"><Icon.Notebook width={11} height={11} /> Seri</div>
            <div className="value success">
              {healthData.length}
              <span style={{ fontSize: 14, color: "var(--n-400)" }}>g</span>
            </div>
            <div className="delta up">Toplam kayıt</div>
          </div>
        </div>

        {/* Trends + AI summary — 2fr 1fr */}
        <div className="dash-grid">
          <div className="lm-panel">
            <div className="lm-panel-head">
              <h3>Trendler</h3>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div className="lm-tabs-mini">
                  {TREND_TABS.map((t) => (
                    <button key={t.key} className={trendTab === t.key ? "active" : ""} onClick={() => setTrendTab(t.key)}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <Link href="/dashboard/analizler" className="more">Tüm metrikler →</Link>
              </div>
            </div>
            <TrendChart data={trendData} color={trendTabConfig.color} />
          </div>

          <div className="lm-panel lm-insight">
            <div className="lm-panel-head">
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon.Sparkle width={14} height={14} /> AI özeti
              </h3>
            </div>
            <div style={{ fontSize: 13, color: "var(--n-200)", lineHeight: 1.6, marginBottom: 14 }}>
              {insight?.summary ?? `${healthData.length} kayıt analiz edildi. Örüntü taraması aktif.`}
            </div>
            {insight?.suggestion && (
              <div style={{
                padding: "10px 12px",
                background: "rgba(0,0,0,0.25)",
                borderRadius: "var(--r-sm)",
                fontSize: 12,
                color: "var(--n-300)",
                lineHeight: 1.55,
                borderLeft: "2px solid var(--secondary)",
                marginBottom: 10,
              }}>
                {insight.suggestion}
              </div>
            )}
            <div style={{
              padding: "8px 10px",
              background: "rgba(45,175,254,0.08)",
              borderRadius: "var(--r-sm)",
              fontSize: 11,
              color: "var(--secondary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 14,
              fontFamily: "var(--font-mono)",
            }}>
              <Icon.Document width={11} height={11} /> {insight?.sources?.length ?? 0} bilimsel kaynak · pgvector
            </div>
            <Link href="/dashboard/ai-sohbet" className="lm-btn lm-btn-secondary lm-btn-block">
              Tüm içgörüleri gör →
            </Link>
          </div>
        </div>

        {/* Distribution + Correlation + Activity — 3 cols */}
        <div className="dash-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="lm-panel">
            <div className="lm-panel-head">
              <h3>Belirti dağılımı</h3>
            </div>
            {topSymptoms.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "var(--n-400)", fontSize: 13 }}>
                Henüz belirti kaydı yok.
              </div>
            ) : (
              topSymptoms.map(([name, count]) => {
                const pct = totalSymptomCount === 0 ? 0 : (count / totalSymptomCount) * 100;
                return (
                  <div key={name} className="lm-dist-row">
                    <span className="name">{name}</span>
                    <div className="bar"><i style={{ width: `${pct}%` }} /></div>
                    <span className="pct">%{pct.toFixed(0)}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="lm-panel">
            <div className="lm-panel-head">
              <h3>Stres × Uyku korelasyonu</h3>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--primary-300)" }}>
                n = {scatterPoints.length}
              </span>
            </div>
            <ScatterChart points={scatterPoints} />
            <div style={{ fontSize: 11, color: "var(--n-400)", marginTop: 6 }}>
              {scatterPoints.length >= 2
                ? "Stres yükseldikçe uyku süresi düşme eğiliminde."
                : "Yeterli veri bekleniyor."}
            </div>
          </div>

          <div className="lm-panel">
            <div className="lm-panel-head">
              <h3>Son aktivite</h3>
              <Link href="/dashboard/history" className="more">Tümü →</Link>
            </div>
            {recentActivity.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "var(--n-400)", fontSize: 13 }}>
                Henüz kayıt yok.
              </div>
            ) : (
              recentActivity.map((r) => {
                const isStress = r.stress_level != null && r.stress_level >= 7;
                const isSleep = r.sleep_hours != null && r.sleep_hours < 6;
                const isPain = r.pain_level != null && r.pain_level >= 6;
                const badge = isStress
                  ? { label: "stres", bg: "rgba(255,92,122,0.15)", color: "var(--danger)", text: `Yüksek stres · ${r.stress_level}/10` }
                  : isSleep
                  ? { label: "uyku", bg: "rgba(45,175,254,0.15)", color: "var(--secondary)", text: `${r.sleep_hours} sa uyku` }
                  : isPain
                  ? { label: "belirti", bg: "rgba(244,183,64,0.15)", color: "var(--warning)", text: `Ağrı bildirildi · ${r.pain_level}/10` }
                  : { label: "alışkanlık", bg: "rgba(43,206,137,0.15)", color: "var(--success)", text: "Günlük kayıt" };
                return (
                  <div key={r.id} className="lm-activity-row">
                    <span className="when">{formatShort(r.date)}</span>
                    <div className="what">
                      <span className="badge" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                      {badge.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
