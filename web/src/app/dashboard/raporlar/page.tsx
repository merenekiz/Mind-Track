"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import PageShell from "@/components/ui/PageShell";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import AIInsight from "@/components/ui/AIInsight";
import { EmptyState } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icons";
import { buildLocalInsight } from "@/services/insights";
import type { HealthData, ImageAnalysis, Symptom } from "@/services/types";

export default function RaporlarPage() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [images, setImages] = useState<ImageAnalysis[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
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
  useEffect(() => { if (user) load(); }, [user, load]);

  const insight = buildLocalInsight({ healthData, imageAnalyses: images, symptoms });
  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  const handleExport = () => {
    const payload = {
      generated_at: new Date().toISOString(),
      user: { name: user?.full_name, email: user?.email },
      summary: {
        total_records: healthData.length,
        total_images: images.length,
        total_symptoms: symptoms.length,
      },
      ai_insight: insight,
      health_data: healthData,
      symptoms,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mindtrack-report-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell
      title="Raporlar"
      subtitle="Sağlık verilerinizi doktorunuzla paylaşın"
      action={
        <Button onClick={handleExport} iconLeft={<Icon.Document />}>
          JSON İndir
        </Button>
      }
    >
      {loading ? null : healthData.length === 0 && symptoms.length === 0 ? (
        <EmptyState icon={<Icon.Document />} title="Rapor için yeterli veri yok" description="Birkaç günlük kayıt ve belirti analizi sonrası rapor üretilebilir." />
      ) : (
        <>
          <Card variant="gradient" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--mt-primary-light)" }}>
                  Hekim Raporu
                </p>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--mt-text)", marginTop: 6 }}>
                  {user?.full_name} — {today}
                </h2>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Badge tone="primary">{healthData.length} sağlık kaydı</Badge>
                <Badge tone="ai">{images.length} görsel analiz</Badge>
                <Badge tone="success">{symptoms.length} belirti analizi</Badge>
              </div>
            </div>
          </Card>

          {insight && (
            <div style={{ marginBottom: 16 }}>
              <AIInsight data={insight} title="Genel Sağlık Değerlendirmesi" />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card>
              <CardHeader title="Son Belirtiler" subtitle={`${symptoms.length} kayıt`} icon={<Icon.Heart />} />
              {symptoms.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--mt-muted)" }}>Henüz belirti analizi yapılmadı.</p>
              ) : (
                <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {symptoms.slice(-5).reverse().map((s) => (
                    <li key={s.id} style={{ paddingBottom: 10, borderBottom: "1px solid var(--mt-border)" }}>
                      <p style={{ fontSize: 12, color: "var(--mt-muted)", fontWeight: 600 }}>
                        {new Date(s.date + "T00:00:00").toLocaleDateString("tr-TR")}
                      </p>
                      <p style={{ fontSize: 13, color: "var(--mt-text)", marginTop: 4, lineHeight: 1.55 }}>
                        {s.detected_symptoms?.summary || s.original_text.slice(0, 80)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="Veri Özeti" subtitle="Son 7 gün" icon={<Icon.Chart />} />
              <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { k: "Ort. Uyku", v: avg(healthData.slice(-7).map((h) => h.sleep_hours)) },
                  { k: "Ort. Stres", v: avg(healthData.slice(-7).map((h) => h.stress_level)) },
                  { k: "Ort. Ağrı", v: avg(healthData.slice(-7).map((h) => h.pain_level)) },
                ].map((row) => (
                  <li key={row.k} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, borderBottom: "1px solid var(--mt-border)" }}>
                    <span style={{ fontSize: 13, color: "var(--mt-text2)" }}>{row.k}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mt-text)" }}>{row.v !== null ? row.v.toFixed(1) : "—"}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <p style={{ fontSize: 11, color: "var(--mt-muted)", textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
            Bu rapor MindTrack tarafından üretilmiştir ve tıbbi tanı niteliği taşımaz.
            <br />
            Lütfen değerlendirme için bir sağlık profesyoneline danışın.
          </p>
        </>
      )}
    </PageShell>
  );
}

function avg(arr: (number | null | undefined)[]): number | null {
  const v = arr.filter((x): x is number => x !== null && x !== undefined);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
