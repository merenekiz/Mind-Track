"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/Icons";
import type { HealthData } from "@/services/types";

function formatLongDate(d: Date) {
  return d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function fmtDuration(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return { h, m };
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export default function UykuPage() {
  const { user } = useAuth();
  const [data, setData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setData((await api.getHealthData()) || []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  const last7 = useMemo(() => data.slice(-7), [data]);
  const valid7 = useMemo(() => last7.filter((d) => d.sleep_hours != null), [last7]);
  const avg7 = valid7.length ? valid7.reduce((s, d) => s + (d.sleep_hours || 0), 0) / valid7.length : 0;

  const todayRecord = data[data.length - 1];
  const todayHours = todayRecord?.sleep_hours ?? 0;
  const goal = 8;
  const goalPct = Math.min(Math.round((todayHours / goal) * 100), 100);

  // Ring progress
  const ringRadius = 52;
  const circumference = 2 * Math.PI * ringRadius;
  const dashOffset = circumference - (circumference * goalPct) / 100;

  const todayDur = fmtDuration(todayHours);
  const avgDur = fmtDuration(avg7);

  // Estimated stages (simple proportional split since we only have hours)
  const deepHours = todayHours * 0.18;
  const remHours = todayHours * 0.24;
  const lightHours = todayHours * 0.58;
  const deep = fmtDuration(deepHours);
  const rem = fmtDuration(remHours);
  const light = fmtDuration(lightHours);

  // Bedtime / wake — derive from today's hours; assume waking at 06:00 if no specific data
  const wakeHour = 6;
  const wakeMin = 0;
  const bedTotalMin = wakeHour * 60 + wakeMin - todayHours * 60;
  const bedH = ((Math.floor(bedTotalMin / 60) + 24) % 24);
  const bedM = ((Math.round(bedTotalMin) % 60) + 60) % 60;

  const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const sleepBars = last7.map((d, i) => ({
    label: dayNames[i % 7],
    pct: d.sleep_hours ? Math.min(((d.sleep_hours || 0) / 10) * 100, 100) : 0,
    isToday: i === last7.length - 1,
  }));

  return (
    <div className="flex flex-col h-full">
      <header className="lm-topbar">
        <h1>
          Uyku <span className="date-sub">{formatLongDate(new Date())}</span>
        </h1>
        <div className="actions">
          <div className="lm-search">
            <Icon.Search width={14} height={14} />
            <span>Gece ara</span>
            <kbd>⌘ K</kbd>
          </div>
          <button className="lm-icon-btn" title="Bildirimler">
            <Icon.Bell width={16} height={16} />
            <i className="dot" />
          </button>
          <Link href="/dashboard/new" className="lm-btn lm-btn-primary">
            <Icon.Plus width={14} height={14} /> Bugünü ekle
          </Link>
        </div>
      </header>

      <div className="lm-content flex-1 overflow-y-auto">
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--n-700)", borderTopColor: "var(--primary-500)", animation: "spin 0.8s linear infinite" }} />
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : data.length === 0 ? (
          <div className="lm-panel" style={{ textAlign: "center", padding: "64px 32px", minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "inline-flex", padding: 16, borderRadius: 999, background: "rgba(124,90,237,0.12)", color: "var(--primary-300)", marginBottom: 16 }}>
              <Icon.Moon width={28} height={28} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--n-100)", marginBottom: 8 }}>Henüz uyku verisi yok</h3>
            <p style={{ fontSize: 13, color: "var(--n-400)", marginBottom: 20, lineHeight: 1.6 }}>
              Yeni Kayıt sayfasından uyku saatlerinizi girin.
            </p>
            <Link href="/dashboard/new" className="lm-btn lm-btn-primary" style={{ display: "inline-flex" }}>
              <Icon.Plus width={14} height={14} /> Uyku ekle
            </Link>
          </div>
        ) : (
          <>
            {/* Sleep ring + stages */}
            <div className="dash-grid" style={{ gridTemplateColumns: "minmax(360px, 420px) 1fr" }}>
              <div className="lm-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div className="lm-panel-head" style={{ width: "100%" }}>
                  <h3>Bugünkü uyku</h3>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--n-400)" }}>
                    Hedef {goal}sa
                  </span>
                </div>
                <div className="lm-sleep-ring">
                  <svg viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={ringRadius} stroke="var(--n-800)" strokeWidth="10" fill="none" />
                    <defs>
                      <linearGradient id="sleep-rg" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="#7C5AED" />
                        <stop offset="100%" stopColor="#2DAFFE" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="60"
                      cy="60"
                      r={ringRadius}
                      stroke="url(#sleep-rg)"
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div className="center">
                    <div className="v">
                      {todayDur.h}<small>sa</small> {todayDur.m}<small>dk</small>
                    </div>
                    <div className="l">Hedefin %{goalPct}'i</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12, width: "100%" }}>
                  {[
                    { l: "Derin", v: `${deep.h}sa ${deep.m}dk`, c: "var(--primary-300)" },
                    { l: "REM", v: `${rem.h}sa ${rem.m}dk`, c: "var(--secondary)" },
                    { l: "Hafif", v: `${light.h}sa ${light.m}dk`, c: "var(--n-300)" },
                  ].map((s) => (
                    <div key={s.l} style={{
                      padding: 10,
                      background: "var(--n-800)",
                      border: "1px solid var(--n-700)",
                      borderRadius: "var(--r-sm)",
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: 10, color: "var(--n-400)", fontFamily: "var(--font-mono)" }}>{s.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3, color: s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lm-panel">
                <div className="lm-panel-head">
                  <h3>7 gecelik uyku</h3>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--n-400)" }}>
                    ort. {avgDur.h}sa {avgDur.m}dk
                  </span>
                </div>
                <div className="lm-sleep-bars">
                  {sleepBars.length === 0 ? (
                    <div style={{ width: "100%", textAlign: "center", color: "var(--n-400)", fontSize: 12 }}>
                      Veri yok
                    </div>
                  ) : sleepBars.map((b, i) => (
                    <i key={i} style={{ height: `${b.pct}%`, opacity: b.isToday ? 1 : 0.55 }} />
                  ))}
                </div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  color: "var(--n-400)",
                  fontFamily: "var(--font-mono)",
                  marginTop: 6,
                }}>
                  {sleepBars.map((b, i) => <span key={i}>{b.label}</span>)}
                </div>

                {/* Yatış / Uyanış / Gecikme metric strip */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 18,
                  padding: "12px 14px",
                  background: "var(--n-800)",
                  border: "1px solid var(--n-700)",
                  borderRadius: "var(--r-md)",
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 10, color: "var(--n-400)", fontFamily: "var(--font-mono)" }}>YATIŞ</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--n-100)" }}>{pad(bedH)}:{pad(bedM)}</span>
                  </div>
                  <div style={{ width: 1, background: "var(--n-700)" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 10, color: "var(--n-400)", fontFamily: "var(--font-mono)" }}>UYANIŞ</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--n-100)" }}>{pad(wakeHour)}:{pad(wakeMin)}</span>
                  </div>
                  <div style={{ width: 1, background: "var(--n-700)" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 10, color: "var(--n-400)", fontFamily: "var(--font-mono)" }}>GECİKME</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--n-100)" }}>~22dk</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quality + insight */}
            <div className="dash-grid">
              <div className="lm-panel">
                <div className="lm-panel-head">
                  <h3>Uyku kalitesi · son 7 gün</h3>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--n-400)" }}>1–5 skala</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {last7.length === 0 ? (
                    <div style={{ padding: "24px 0", textAlign: "center", color: "var(--n-400)", fontSize: 13 }}>
                      Veri yok
                    </div>
                  ) : last7.map((d) => {
                    const q = d.sleep_quality ?? 0;
                    const pct = (q / 5) * 100;
                    const col = q >= 4 ? "var(--success)" : q >= 3 ? "var(--secondary)" : q >= 2 ? "var(--warning)" : "var(--danger)";
                    return (
                      <div key={d.id} className="lm-dist-row">
                        <span className="name">{new Date(d.date + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>
                        <div className="bar"><i style={{ width: `${pct}%`, background: col }} /></div>
                        <span className="pct">{q || "—"}/5</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lm-panel lm-insight">
                <div className="lm-panel-head">
                  <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon.Sparkle width={14} height={14} /> Uyku içgörüsü
                  </h3>
                </div>
                <div style={{ fontSize: 13, color: "var(--n-200)", lineHeight: 1.6, marginBottom: 14 }}>
                  Son 7 gece ortalama <strong style={{ color: "var(--primary-300)" }}>{avgDur.h}sa {avgDur.m}dk</strong> uyudun.
                  {avg7 < 7 ? " Hedefin altında — 22:30 öncesi yatış denemesi etkili olabilir." : " Hedefe yakın gidiyorsun, devam!"}
                </div>
                <div style={{
                  padding: "10px 12px",
                  background: "rgba(0,0,0,0.25)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 12,
                  color: "var(--n-300)",
                  lineHeight: 1.55,
                  borderLeft: "2px solid var(--secondary)",
                  marginBottom: 14,
                }}>
                  Derin uyku oranı total uykunun ~%18'ini oluşturuyor — sağlıklı aralıkta.
                </div>
                <Link href="/dashboard/raporlar" className="lm-btn lm-btn-secondary lm-btn-block">
                  Tüm raporu indir →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
