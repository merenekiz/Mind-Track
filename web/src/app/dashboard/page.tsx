"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";

interface HealthData {
  id: number;
  date: string;
  pain_level: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  stress_level: number | null;
  mood: string | null;
  notes: string | null;
  created_at: string;
}

const moodMap: Record<string, { label: string; cls: string }> = {
  very_bad: { label: "Çok Kötü", cls: "text-mt-accent3" },
  bad: { label: "Kötü", cls: "text-mt-warn" },
  neutral: { label: "Normal", cls: "text-mt-muted" },
  good: { label: "İyi", cls: "text-mt-accent4" },
  very_good: { label: "Çok İyi", cls: "text-mt-accent4" },
};

function levelColor(value: number, low: number, high: number) {
  if (value >= high) return "text-mt-accent3";
  if (value >= low) return "text-mt-warn";
  return "text-mt-accent4";
}

function levelBg(value: number, low: number, high: number) {
  if (value >= high) return "bg-mt-accent3/10";
  if (value >= low) return "bg-mt-warn/10";
  return "bg-mt-accent4/10";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const result = await api.getHealthData();
      setData(result || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleDelete = async (id: number) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    try {
      await api.deleteHealthData(id);
      setData((prev) => prev.filter((d) => d.id !== id));
    } catch { /* */ }
  };

  const recent = data.slice(-7);
  const avg = (key: keyof HealthData) => {
    const valid = recent.filter((d) => d[key] !== null);
    if (!valid.length) return null;
    return valid.reduce((s, d) => s + (Number(d[key]) || 0), 0) / valid.length;
  };

  const avgSleep = avg("sleep_hours");
  const avgStress = avg("stress_level");
  const avgPain = avg("pain_level");
  const avgQuality = avg("sleep_quality");

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-mt-accent" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <header className="bg-mt-surface border-b border-mt-border flex items-center justify-between shrink-0" style={{ height: 76, padding: "0 48px" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Kontrol Paneli</h1>
          <p className="text-mt-muted" style={{ fontSize: 13, marginTop: 4 }}>Merhaba, {user?.full_name}</p>
        </div>
        <Link
          href="/dashboard/new"
          className="bg-mt-accent text-black font-semibold hover:brightness-110 active:scale-[0.98] transition-all inline-flex items-center"
          style={{ height: 44, padding: "0 28px", borderRadius: 12, fontSize: 14, gap: 10 }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Yeni Kayıt
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: 48 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Stats */}
          <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 28, marginBottom: 48 }}>
            {/* Uyku */}
            <div className="bg-mt-surface border border-mt-border mt-card" style={{ borderRadius: 16, padding: 28 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
                <span className="text-mt-muted" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5 }}>Ort. Uyku</span>
                <div className="bg-mt-accent/10 flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 12 }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" className="text-mt-accent">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </div>
              </div>
              <p className="text-mt-accent" style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {avgSleep !== null ? avgSleep.toFixed(1) : "—"}
                <span className="text-mt-muted" style={{ fontSize: 13, fontWeight: 400, marginLeft: 6 }}>sa</span>
              </p>
              <p className={`${avgSleep !== null && avgSleep >= 7 ? "text-mt-accent4" : avgSleep !== null ? "text-mt-accent3" : "text-mt-muted"}`} style={{ fontSize: 12, marginTop: 16, fontWeight: 500 }}>
                {avgSleep !== null ? (avgSleep >= 7 ? "Yeterli uyku" : "Yetersiz uyku") : "Henüz veri yok"}
              </p>
            </div>

            {/* Stres */}
            <div className="bg-mt-surface border border-mt-border mt-card" style={{ borderRadius: 16, padding: 28 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
                <span className="text-mt-muted" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5 }}>Ort. Stres</span>
                <div className={`flex items-center justify-center ${avgStress !== null ? levelBg(avgStress, 5, 7) : "bg-mt-surface2"}`} style={{ width: 44, height: 44, borderRadius: 12 }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" className={avgStress !== null ? levelColor(avgStress, 5, 7) : "text-mt-muted"}>
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
              </div>
              <p className={avgStress !== null ? levelColor(avgStress, 5, 7) : "text-mt-text"} style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {avgStress !== null ? avgStress.toFixed(1) : "—"}
                <span className="text-mt-muted" style={{ fontSize: 13, fontWeight: 400, marginLeft: 6 }}>/10</span>
              </p>
              <p className={`${avgStress !== null && avgStress < 5 ? "text-mt-accent4" : avgStress !== null && avgStress >= 7 ? "text-mt-accent3" : "text-mt-muted"}`} style={{ fontSize: 12, marginTop: 16, fontWeight: 500 }}>
                {avgStress !== null ? (avgStress < 5 ? "Düşük seviye" : avgStress < 7 ? "Orta seviye" : "Yüksek seviye") : "Henüz veri yok"}
              </p>
            </div>

            {/* Ağrı */}
            <div className="bg-mt-surface border border-mt-border mt-card" style={{ borderRadius: 16, padding: 28 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
                <span className="text-mt-muted" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5 }}>Ort. Ağrı</span>
                <div className={`flex items-center justify-center ${avgPain !== null ? levelBg(avgPain, 4, 7) : "bg-mt-surface2"}`} style={{ width: 44, height: 44, borderRadius: 12 }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" className={avgPain !== null ? levelColor(avgPain, 4, 7) : "text-mt-muted"}>
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
              </div>
              <p className={avgPain !== null ? levelColor(avgPain, 4, 7) : "text-mt-text"} style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {avgPain !== null ? avgPain.toFixed(1) : "—"}
                <span className="text-mt-muted" style={{ fontSize: 13, fontWeight: 400, marginLeft: 6 }}>/10</span>
              </p>
              <p className={`${avgPain !== null && avgPain < 4 ? "text-mt-accent4" : avgPain !== null && avgPain >= 7 ? "text-mt-accent3" : "text-mt-muted"}`} style={{ fontSize: 12, marginTop: 16, fontWeight: 500 }}>
                {avgPain !== null ? (avgPain < 4 ? "Kontrol altında" : avgPain < 7 ? "Dikkat gerekli" : "Yüksek ağrı") : "Henüz veri yok"}
              </p>
            </div>

            {/* Kalite */}
            <div className="bg-mt-surface border border-mt-border mt-card" style={{ borderRadius: 16, padding: 28 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
                <span className="text-mt-muted" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5 }}>Uyku Kalitesi</span>
                <div className="bg-mt-purple/10 flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 12 }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" className="text-mt-purple">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-mt-purple" style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {avgQuality !== null ? avgQuality.toFixed(1) : "—"}
                <span className="text-mt-muted" style={{ fontSize: 13, fontWeight: 400, marginLeft: 6 }}>/5</span>
              </p>
              <p className="text-mt-muted" style={{ fontSize: 12, marginTop: 16, fontWeight: 500 }}>
                {data.length > 0 ? `${data.length} toplam kayıt` : "Henüz veri yok"}
              </p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="animate-slide-up" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}>
            {/* Records */}
            <div className="bg-mt-surface border border-mt-border mt-card" style={{ borderRadius: 16, overflow: "hidden" }}>
              <div className="flex items-center justify-between border-b border-mt-border" style={{ padding: "24px 32px" }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700 }}>Son Kayıtlar</h2>
                  <p className="text-mt-muted" style={{ fontSize: 12, marginTop: 6 }}>{data.length} kayıt</p>
                </div>
              </div>

              {data.length === 0 ? (
                <div className="text-center" style={{ padding: "80px 32px" }}>
                  <div className="bg-mt-surface2 flex items-center justify-center mx-auto" style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 24 }}>
                    <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" className="text-mt-muted">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-mt-muted" style={{ fontSize: 15, marginBottom: 20 }}>Henüz sağlık kaydınız bulunmuyor.</p>
                  <Link href="/dashboard/new" className="text-mt-accent font-semibold hover:underline" style={{ fontSize: 14 }}>
                    İlk kaydınızı oluşturun →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-mt-border/50">
                  {data.map((record) => {
                    const m = record.mood ? moodMap[record.mood] : null;
                    return (
                      <div key={record.id} className="hover:bg-mt-surface2/30 transition-colors" style={{ padding: "24px 32px" }}>
                        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(record.date)}</span>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-mt-muted hover:text-mt-accent3 hover:bg-mt-accent3/10 transition-colors"
                            style={{ fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 8 }}
                          >
                            Sil
                          </button>
                        </div>
                        <div className="flex flex-wrap" style={{ gap: 12 }}>
                          {record.sleep_hours !== null && (
                            <span className="inline-flex items-center bg-mt-accent/10 text-mt-accent" style={{ gap: 8, padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                              {record.sleep_hours} sa
                            </span>
                          )}
                          {record.stress_level !== null && (
                            <span className={`inline-flex items-center ${levelBg(record.stress_level, 5, 7)} ${levelColor(record.stress_level, 5, 7)}`} style={{ gap: 8, padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                              Stres {record.stress_level}/10
                            </span>
                          )}
                          {record.pain_level !== null && (
                            <span className={`inline-flex items-center ${levelBg(record.pain_level, 4, 7)} ${levelColor(record.pain_level, 4, 7)}`} style={{ gap: 8, padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                              Ağrı {record.pain_level}/10
                            </span>
                          )}
                          {record.sleep_quality !== null && (
                            <span className="inline-flex items-center bg-mt-purple/10 text-mt-purple" style={{ gap: 8, padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                              Kalite {record.sleep_quality}/5
                            </span>
                          )}
                          {m && (
                            <span className={`inline-flex items-center bg-mt-surface2 ${m.cls}`} style={{ gap: 8, padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                              {m.label}
                            </span>
                          )}
                        </div>
                        {record.notes && (
                          <p className="text-mt-muted line-clamp-2" style={{ fontSize: 13, marginTop: 16, lineHeight: 1.6 }}>{record.notes}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Side Panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {/* AI Panel */}
              <div className="bg-mt-surface border border-mt-purple/25 mt-card" style={{ borderRadius: 16, padding: 32 }}>
                <div className="flex items-center" style={{ gap: 12, marginBottom: 24 }}>
                  <span className="bg-mt-purple" style={{ width: 12, height: 12, borderRadius: "50%", animation: "pulse-glow 2s infinite" }} />
                  <span className="text-mt-purple" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>Klinik Analiz</span>
                </div>
                <p className="text-mt-text2" style={{ fontSize: 14, lineHeight: 1.8 }}>
                  {data.length > 0
                    ? `Son ${Math.min(7, data.length)} günlük veriniz değerlendiriliyor. Düzenli kayıt girdikçe sağlık trendleriniz daha net ortaya çıkacak.`
                    : "Henüz analiz edilecek veri yok. Günlük kayıtlarınızı girmeye başlayın."}
                </p>
                <p className="text-mt-muted border-t border-mt-border" style={{ fontSize: 11, marginTop: 24, paddingTop: 20, lineHeight: 1.6 }}>
                  Bu sistem tanı koymaz. Yorumlar bilgilendirme amaçlıdır.
                </p>
              </div>

              {/* Quick Summary */}
              {data.length > 0 && (
                <div className="bg-mt-surface border border-mt-border mt-card" style={{ borderRadius: 16, padding: 32 }}>
                  <h3 className="text-mt-muted" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 24 }}>Haftalık Özet</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div className="flex items-center justify-between border-b border-mt-border/50" style={{ paddingBottom: 20 }}>
                      <span className="text-mt-text2" style={{ fontSize: 14 }}>Toplam Kayıt</span>
                      <span className="text-mt-accent" style={{ fontSize: 14, fontWeight: 700 }}>{data.length}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-mt-border/50" style={{ paddingBottom: 20 }}>
                      <span className="text-mt-text2" style={{ fontSize: 14 }}>Son Kayıt</span>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{formatDate(data[data.length - 1].date)}</span>
                    </div>
                    {avgSleep !== null && (
                      <div className="flex items-center justify-between border-b border-mt-border/50" style={{ paddingBottom: 20 }}>
                        <span className="text-mt-text2" style={{ fontSize: 14 }}>Ort. Uyku</span>
                        <span className={avgSleep >= 7 ? "text-mt-accent4" : "text-mt-warn"} style={{ fontSize: 14, fontWeight: 700 }}>{avgSleep.toFixed(1)} sa</span>
                      </div>
                    )}
                    {avgStress !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-mt-text2" style={{ fontSize: 14 }}>Ort. Stres</span>
                        <span className={avgStress < 5 ? "text-mt-accent4" : avgStress < 7 ? "text-mt-warn" : "text-mt-accent3"} style={{ fontSize: 14, fontWeight: 700 }}>{avgStress.toFixed(1)}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
