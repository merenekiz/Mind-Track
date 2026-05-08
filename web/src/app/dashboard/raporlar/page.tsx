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
import type { HealthData, ImageAnalysis, Symptom, AIAnalysisResult } from "@/services/types";

export default function RaporlarPage() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [images, setImages] = useState<ImageAnalysis[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalyses, setAIAnalyses] = useState<AIAnalysisResult[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [hd, img, sym, ai] = await Promise.all([
        api.getHealthData().catch(() => []),
        api.getImageAnalyses().catch(() => []),
        api.getSymptoms().catch(() => []),
        api.getAIAnalyses(10).catch(() => []),
      ]);
      setHealthData(hd || []);
      setImages(img || []);
      setSymptoms(sym || []);
      setAIAnalyses(ai || []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  const handleGenerateAI = async () => {
    setGenError(null);
    setGenerating(true);
    try {
      const result = await api.generateAIAnalysis({ days_back: 7, include_rag: true });
      setAIAnalyses((prev) => [result, ...prev]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "AI analizi üretilemedi";
      setGenError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const latestAI = aiAnalyses[0];

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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            onClick={handleGenerateAI}
            disabled={generating || (healthData.length === 0 && symptoms.length === 0)}
            iconLeft={<Icon.Sparkle />}
          >
            {generating ? "AI üretiyor..." : "AI Bilimsel Rapor"}
          </Button>
          <Button onClick={handleExport} variant="ghost" iconLeft={<Icon.Document />}>
            JSON
          </Button>
        </div>
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

          {genError && (
            <Card style={{ marginBottom: 16, borderColor: "var(--danger)" }}>
              <p style={{ fontSize: 13, color: "var(--danger)" }}>{genError}</p>
            </Card>
          )}

          {latestAI ? (
            <Card style={{ marginBottom: 16 }}>
              <CardHeader
                title="AI Bilimsel Sağlık Yorumu"
                subtitle={`${new Date(latestAI.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} · ${latestAI.data_used.health_count} sağlık kaydı, ${latestAI.data_used.symptom_count} belirti`}
                icon={<Icon.Sparkle />}
              />

              <p style={{ fontSize: 14, color: "var(--mt-text)", lineHeight: 1.65, marginBottom: 16 }}>
                {latestAI.summary}
              </p>

              {latestAI.recommendations.items?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--mt-muted)", marginBottom: 10 }}>
                    Öneriler
                  </p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {latestAI.recommendations.items.map((rec, i) => (
                      <li key={i} style={{ padding: 12, background: "var(--mt-surface2)", borderRadius: 12, borderLeft: `3px solid ${rec.priority === "yüksek" ? "var(--danger)" : rec.priority === "orta" ? "var(--warning)" : "var(--mt-secondary)"}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mt-text)" }}>{rec.title}</span>
                          {rec.priority && (
                            <Badge tone={rec.priority === "yüksek" ? "danger" : rec.priority === "orta" ? "warn" : "primary"}>
                              {rec.priority}
                            </Badge>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: "var(--mt-text2)", lineHeight: 1.6 }}>{rec.detail}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latestAI.recommendations.patterns && latestAI.recommendations.patterns.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--mt-muted)", marginBottom: 8 }}>
                    Tespit Edilen Örüntüler
                  </p>
                  <ul style={{ paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                    {latestAI.recommendations.patterns.map((p, i) => (
                      <li key={i} style={{ fontSize: 12, color: "var(--mt-text2)", lineHeight: 1.6 }}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {latestAI.recommendations.should_consult_doctor && (
                <Card variant="gradient" style={{ marginBottom: 16, padding: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--warning)", marginBottom: 4 }}>
                    ⚠️ Doktor Önerisi
                  </p>
                  <p style={{ fontSize: 12, color: "var(--mt-text)", lineHeight: 1.6 }}>
                    {latestAI.recommendations.consult_reason || "Bu belirtiler için bir sağlık uzmanına danışmanız önerilir."}
                  </p>
                </Card>
              )}

              {latestAI.scientific_references?.items && latestAI.scientific_references.items.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--mt-muted)", marginBottom: 8 }}>
                    Bilimsel Referanslar (PubMed)
                  </p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {latestAI.scientific_references.items.map((ref, i) => (
                      <li key={i} style={{ fontSize: 12, color: "var(--mt-text2)", display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pubmed_id}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--mt-secondary)", textDecoration: "underline", flex: 1 }}
                        >
                          {ref.title}
                        </a>
                        {typeof ref.similarity === "number" && (
                          <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--mt-muted)" }}>
                            %{(ref.similarity * 100).toFixed(0)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ) : insight && (
            <div style={{ marginBottom: 16 }}>
              <AIInsight data={insight} title="Genel Sağlık Değerlendirmesi (Yerel)" />
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
