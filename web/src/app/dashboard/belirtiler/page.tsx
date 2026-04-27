"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/Icons";
import BodySilhouette, { BODY_REGIONS, type BodyPin } from "@/components/ui/BodySilhouette";
import type { Symptom } from "@/services/types";

const NAME_TO_REGION: { test: RegExp; region: string }[] = [
  { test: /baş\s*ağrı|migren|baş ağr/i, region: "head" },
  { test: /baş\s*dön|baş dön/i, region: "head" },
  { test: /boğaz|boyun/i, region: "neck" },
  { test: /göğüs|kalp|nefes/i, region: "chest" },
  { test: /mide|karın|kabız|ishal|bulan/i, region: "abdomen" },
  { test: /sırt|bel/i, region: "pelvis" },
  { test: /omuz/i, region: "shoulder_l" },
  { test: /kol|dirsek/i, region: "arm_l" },
  { test: /el|parmak|bilek/i, region: "hand_l" },
  { test: /uyluk|kalça/i, region: "thigh_l" },
  { test: /diz|bacak/i, region: "knee_l" },
  { test: /ayak|topuk/i, region: "foot_l" },
];

function inferRegion(name: string): string | null {
  for (const { test, region } of NAME_TO_REGION) if (test.test(name)) return region;
  return null;
}

function severityColor(s?: string | null) {
  if (s === "şiddetli") return "var(--danger)";
  if (s === "orta") return "var(--warning)";
  return "var(--secondary)";
}

function formatLongDate(d: Date) {
  return d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function BelirtilerPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems((await api.getSymptoms()) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  const handleDelete = async (id: number) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    try {
      await api.deleteSymptom(id);
      setItems((prev) => prev.filter((s) => s.id !== id));
    } catch { /* */ }
  };

  const pins: BodyPin[] = useMemo(() => {
    const counts = new Map<string, { count: number; sev: number }>();
    items.slice(-50).forEach((s) => {
      s.detected_symptoms?.symptoms?.forEach((sym) => {
        const region = inferRegion(sym.name);
        if (!region) return;
        const sev = sym.severity === "şiddetli" ? 3 : sym.severity === "orta" ? 2 : 1;
        const cur = counts.get(region) ?? { count: 0, sev: 0 };
        counts.set(region, { count: cur.count + 1, sev: Math.max(cur.sev, sev) });
      });
    });
    return Array.from(counts.entries()).map(([region, { count, sev }]) => ({
      region,
      label: BODY_REGIONS[region]?.label ?? region,
      count,
      severity: sev === 3 ? ("high" as const) : sev === 2 ? ("medium" as const) : ("low" as const),
    }));
  }, [items]);

  const symptomCounts = useMemo(() => {
    const counts: Record<string, { count: number; severity?: string }> = {};
    items.forEach((s) => {
      s.detected_symptoms?.symptoms?.forEach((sym) => {
        const cur = counts[sym.name] ?? { count: 0 };
        const sevRank = (x?: string | null) => (x === "şiddetli" ? 3 : x === "orta" ? 2 : 1);
        if (!cur.severity || sevRank(sym.severity) > sevRank(cur.severity)) {
          cur.severity = sym.severity ?? undefined;
        }
        cur.count += 1;
        counts[sym.name] = cur;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1].count - a[1].count).slice(0, 6);
  }, [items]);

  const totalCount = symptomCounts.reduce((s, [, v]) => s + v.count, 0);

  const filtered = useMemo(() => {
    if (!selectedRegion) return items;
    return items.filter((s) =>
      s.detected_symptoms?.symptoms?.some((sym) => inferRegion(sym.name) === selectedRegion)
    );
  }, [items, selectedRegion]);

  const selectedLabel = selectedRegion ? BODY_REGIONS[selectedRegion]?.label : null;

  return (
    <div className="flex flex-col h-full">
      <header className="lm-topbar">
        <h1>
          Belirti haritası <span className="date-sub">{formatLongDate(new Date())}</span>
        </h1>
        <div className="actions">
          <div className="lm-search">
            <Icon.Search width={14} height={14} />
            <span>Belirti ara</span>
            <kbd>⌘ K</kbd>
          </div>
          <button className="lm-icon-btn" title="Bildirimler">
            <Icon.Bell width={16} height={16} />
            <i className="dot" />
          </button>
          <Link href="/dashboard/new" className="lm-btn lm-btn-primary">
            <Icon.Plus width={14} height={14} /> Yeni analiz
          </Link>
        </div>
      </header>

      <div className="lm-content flex-1 overflow-y-auto">
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--n-700)", borderTopColor: "var(--primary-500)", animation: "spin 0.8s linear infinite" }} />
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : items.length === 0 ? (
          <div className="lm-panel" style={{ textAlign: "center", padding: "64px 32px", minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "inline-flex", padding: 16, borderRadius: 999, background: "rgba(124,90,237,0.12)", color: "var(--primary-300)", marginBottom: 16 }}>
              <Icon.Heart width={28} height={28} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--n-100)", marginBottom: 8 }}>Henüz belirti analizi yok</h3>
            <p style={{ fontSize: 13, color: "var(--n-400)", marginBottom: 20, lineHeight: 1.6 }}>
              Yeni Kayıt sayfasından belirtilerinizi metin olarak yazın — AI otomatik analiz eder.
            </p>
            <Link href="/dashboard/new" className="lm-btn lm-btn-primary" style={{ display: "inline-flex" }}>
              <Icon.Plus width={14} height={14} /> Belirti ekle
            </Link>
          </div>
        ) : (
          <>
            {/* Body map + most-reported list — 2 cols */}
            <div className="dash-grid" style={{ gridTemplateColumns: "minmax(360px, 420px) 1fr" }}>
              <div className="lm-panel">
                <div className="lm-panel-head">
                  <h3>Vücut haritası</h3>
                  {selectedRegion && (
                    <button className="more" onClick={() => setSelectedRegion(null)}>Temizle ✕</button>
                  )}
                </div>
                <div style={{ textAlign: "center", fontSize: 11, color: "var(--n-400)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
                  Son 50 kayıt · {pins.length} bölge işaretli
                  {selectedLabel ? ` · Filtre: ${selectedLabel}` : ""}
                </div>
                <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 16px" }}>
                  <BodySilhouette
                    pins={pins}
                    selectedRegion={selectedRegion}
                    onSelectRegion={(r) => setSelectedRegion((cur) => (cur === r ? null : r))}
                    height={420}
                  />
                </div>
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 14,
                  fontSize: 11,
                  color: "var(--n-400)",
                  fontFamily: "var(--font-mono)",
                  paddingTop: 12,
                  borderTop: "1px solid var(--n-700)",
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <i style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger)" }} /> Şiddetli
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <i style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warning)" }} /> Orta
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <i style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--secondary)" }} /> Hafif
                  </span>
                </div>
              </div>

              <div className="lm-panel">
                <div className="lm-panel-head">
                  <h3>En çok bildirilenler</h3>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--n-400)" }}>
                    {totalCount} toplam belirti
                  </span>
                </div>
                {symptomCounts.length === 0 ? (
                  <div style={{ padding: "24px 0", textAlign: "center", color: "var(--n-400)", fontSize: 13 }}>
                    Henüz belirti tespit edilmedi.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {symptomCounts.map(([name, { count, severity }]) => {
                      const col = severityColor(severity);
                      const pct = totalCount === 0 ? 0 : (count / totalCount) * 100;
                      return (
                        <div key={name} style={{
                          padding: 12,
                          background: "var(--n-800)",
                          border: "1px solid var(--n-700)",
                          borderRadius: "var(--r-sm)",
                          display: "grid",
                          gridTemplateColumns: "1fr 80px 32px",
                          gap: 12,
                          alignItems: "center",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                            <i style={{ width: 8, height: 8, borderRadius: "50%", background: col, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: "var(--n-100)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                          </div>
                          <div className="lm-bar-h"><i style={{ width: `${pct}%`, background: col }} /></div>
                          <span style={{ fontSize: 11, color: "var(--n-300)", fontFamily: "var(--font-mono)", textAlign: "right" }}>×{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Symptom records list */}
            <div className="lm-panel">
              <div className="lm-panel-head">
                <h3>Kayıtlı analizler {selectedLabel ? `· ${selectedLabel}` : ""}</h3>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--n-400)" }}>
                  {filtered.length} / {items.length}
                </span>
              </div>
              {filtered.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: "var(--n-400)", fontSize: 13 }}>
                  Bu bölgeye ait belirti kaydı bulunamadı.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...filtered].reverse().map((s) => (
                    <div key={s.id} style={{
                      padding: 14,
                      background: "var(--n-800)",
                      border: "1px solid var(--n-700)",
                      borderRadius: "var(--r-sm)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 11, color: "var(--n-400)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
                            {new Date(s.date + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                          </div>
                          <p style={{ fontSize: 13, color: "var(--n-100)", lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>
                            &ldquo;{s.original_text}&rdquo;
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(s.id)}
                          title="Sil"
                          className="lm-icon-btn"
                          style={{ width: 32, height: 32 }}
                        >
                          <Icon.Trash width={14} height={14} />
                        </button>
                      </div>

                      {s.detected_symptoms?.summary && (
                        <div style={{
                          padding: "10px 12px",
                          background: "rgba(45,175,254,0.08)",
                          borderRadius: "var(--r-sm)",
                          fontSize: 12,
                          color: "var(--n-200)",
                          lineHeight: 1.55,
                          borderLeft: "2px solid var(--secondary)",
                          marginBottom: 10,
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--secondary)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>
                            MindTrack AI
                          </div>
                          {s.detected_symptoms.summary}
                        </div>
                      )}

                      {s.detected_symptoms?.symptoms && s.detected_symptoms.symptoms.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {s.detected_symptoms.symptoms.map((sym, i) => {
                            const region = inferRegion(sym.name);
                            const regionLabel = region ? BODY_REGIONS[region]?.label : null;
                            const col = severityColor(sym.severity);
                            return (
                              <span key={i} style={{
                                padding: "4px 10px",
                                borderRadius: "var(--r-full)",
                                background: `${col}1a`,
                                color: col,
                                fontSize: 11,
                                fontWeight: 500,
                                border: `1px solid ${col}33`,
                              }}>
                                {sym.name}
                                {sym.severity ? ` · ${sym.severity}` : ""}
                                {regionLabel ? ` · ${regionLabel}` : ""}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
