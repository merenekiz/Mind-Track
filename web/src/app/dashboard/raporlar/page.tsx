"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import PageShell from "@/components/ui/PageShell";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icons";
import type { HealthData, ImageAnalysis, Symptom, AIAnalysisResult } from "@/services/types";

type RangeDays = 7 | 14 | 30;

export default function RaporlarPage() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [images, setImages] = useState<ImageAnalysis[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [aiAnalyses, setAIAnalyses] = useState<AIAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);

  const [range, setRange] = useState<RangeDays>(7);
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

  // Filtreli veri (son N gün)
  const filtered = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - range);
    const inRange = (s: string) => new Date(s + "T00:00:00") >= cutoff;
    return {
      healthData: healthData.filter((h) => inRange(h.date)),
      symptoms: symptoms.filter((s) => inRange(s.date)),
      images: images.filter((i) => new Date(i.created_at) >= cutoff),
    };
  }, [healthData, symptoms, images, range]);

  const latestAI = aiAnalyses[0];
  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  const handleGenerateAI = async () => {
    setGenError(null);
    setGenerating(true);
    try {
      const result = await api.generateAIAnalysis({ days_back: range, include_rag: true });
      setAIAnalyses((prev) => [result, ...prev]);
    } catch (e: unknown) {
      setGenError(e instanceof Error ? e.message : "AI analizi üretilemedi");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) {
      alert("Pop-up engellenmiş. Lütfen pop-up'lara izin verin.");
      return;
    }
    win.document.write(buildReportHTML({
      user: { name: user?.full_name || "—", email: user?.email || "—" },
      today,
      range,
      healthData: filtered.healthData,
      symptoms: filtered.symptoms,
      images: filtered.images,
      ai: latestAI,
    }));
    win.document.close();
    // Yazdırma diyaloğunu otomatik aç
    setTimeout(() => {
      win.focus();
      win.print();
    }, 500);
  };

  return (
    <PageShell
      title="Raporlar"
      subtitle="Sağlık verilerinizi profesyonel PDF olarak indirin"
      action={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {/* Tarih aralığı */}
          <div style={{ display: "flex", gap: 4, background: "var(--n-800)", padding: 4, borderRadius: "var(--r-full)", border: "1px solid var(--n-700)" }}>
            {([7, 14, 30] as RangeDays[]).map((d) => (
              <button
                key={d}
                onClick={() => setRange(d)}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: "var(--r-full)",
                  background: range === d ? "var(--primary-500)" : "transparent",
                  color: range === d ? "#fff" : "var(--n-300)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {d} gün
              </button>
            ))}
          </div>
          <Button
            onClick={handleGenerateAI}
            disabled={generating || (filtered.healthData.length === 0 && filtered.symptoms.length === 0)}
            iconLeft={<Icon.Sparkle />}
          >
            {generating ? "AI üretiyor..." : "AI Bilimsel Rapor"}
          </Button>
          <Button onClick={handleDownloadPDF} variant="ghost" iconLeft={<Icon.Document />}>
            PDF İndir
          </Button>
        </div>
      }
    >
      {loading ? null : healthData.length === 0 && symptoms.length === 0 ? (
        <EmptyState
          icon={<Icon.Document />}
          title="Rapor için yeterli veri yok"
          description="Birkaç günlük kayıt ve belirti analizi sonrası rapor üretilebilir."
        />
      ) : (
        <>
          {/* Üst kart — özet */}
          <Card variant="gradient" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--mt-primary-light)" }}>
                  Hekim Raporu — Son {range} gün
                </p>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--mt-text)", marginTop: 6 }}>
                  {user?.full_name} — {today}
                </h2>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Badge tone="primary">{filtered.healthData.length} sağlık kaydı</Badge>
                <Badge tone="ai">{filtered.images.length} görsel analiz</Badge>
                <Badge tone="success">{filtered.symptoms.length} belirti analizi</Badge>
              </div>
            </div>
          </Card>

          {genError && (
            <Card style={{ marginBottom: 16, borderColor: "var(--danger)" }}>
              <p style={{ fontSize: 13, color: "var(--danger)" }}>{genError}</p>
            </Card>
          )}

          {/* AI Analiz kartı */}
          {latestAI && (
            <Card style={{ marginBottom: 16 }}>
              <CardHeader
                title="AI Bilimsel Sağlık Yorumu"
                subtitle={`${new Date(latestAI.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}
                icon={<Icon.Sparkle />}
              />
              <p style={{ fontSize: 14, color: "var(--mt-text)", lineHeight: 1.65, marginBottom: 16 }}>
                {latestAI.summary}
              </p>

              {latestAI.recommendations.items?.length > 0 && (
                <ul className="mt-scrollable-list" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {latestAI.recommendations.items.map((rec, i) => (
                    <li
                      key={i}
                      style={{
                        padding: 12,
                        background: "var(--mt-surface2)",
                        borderRadius: 12,
                        borderLeft: `3px solid ${rec.priority === "yüksek" ? "var(--danger)" : rec.priority === "orta" ? "var(--warning)" : "var(--mt-secondary)"}`,
                      }}
                    >
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
              )}

              {latestAI.scientific_references?.items && latestAI.scientific_references.items.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--mt-muted)", marginBottom: 8 }}>
                    Bilimsel Referanslar (PubMed)
                  </p>
                  <ul className="mt-scrollable-list mt-scrollable-list-sm" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {latestAI.scientific_references.items.map((ref, i) => (
                      <li key={i} style={{ fontSize: 12, display: "flex", justifyContent: "space-between", gap: 8 }}>
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
          )}

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

// ─────────────────────────────────────────────────────────────────────────────
// PDF için HTML şablonu — yeni pencerede açılır, browser print → PDF
// ─────────────────────────────────────────────────────────────────────────────
function buildReportHTML(data: {
  user: { name: string; email: string };
  today: string;
  range: number;
  healthData: HealthData[];
  symptoms: Symptom[];
  images: ImageAnalysis[];
  ai: AIAnalysisResult | undefined;
}): string {
  const { user, today, range, healthData, symptoms, images, ai } = data;

  const fmtDate = (s: string) => new Date(s + "T00:00:00").toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const escape = (s: string) => s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const healthRows = healthData.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:#888;padding:20px">Bu dönemde sağlık verisi yok</td></tr>` :
    healthData.slice(0, 30).map(h => `
      <tr>
        <td>${fmtDate(h.date)}</td>
        <td>${h.pain_level ?? "—"}</td>
        <td>${h.sleep_hours ?? "—"}</td>
        <td>${h.stress_level ?? "—"}</td>
        <td>${escape(String(h.mood ?? "—"))}</td>
        <td>${escape((h.notes ?? "").slice(0, 60))}</td>
      </tr>
    `).join("");

  const symptomRows = symptoms.length === 0 ? `<tr><td colspan="3" style="text-align:center;color:#888;padding:20px">Bu dönemde belirti analizi yok</td></tr>` :
    symptoms.slice(0, 20).map(s => {
      const detected = (s.detected_symptoms?.symptoms || []).slice(0, 5).map(d => d.name).join(", ");
      return `
      <tr>
        <td>${fmtDate(s.date)}</td>
        <td>${escape(s.original_text.slice(0, 80))}</td>
        <td>${escape(detected)}</td>
      </tr>
    `;
    }).join("");

  const aiBlock = !ai ? "" : `
    <section class="block ai">
      <h2>🤖 AI Bilimsel Sağlık Yorumu</h2>
      <p class="meta">${new Date(ai.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
      <p class="summary">${escape(ai.summary)}</p>

      ${(ai.recommendations?.items || []).length > 0 ? `
        <h3>Öneriler</h3>
        <ol class="recs">
          ${(ai.recommendations.items || []).map(rec => `
            <li class="rec ${rec.priority === "yüksek" ? "high" : rec.priority === "orta" ? "med" : "low"}">
              <div class="rec-head">
                <strong>${escape(rec.title)}</strong>
                ${rec.priority ? `<span class="badge">${escape(String(rec.priority))}</span>` : ""}
              </div>
              <p>${escape(rec.detail)}</p>
            </li>
          `).join("")}
        </ol>
      ` : ""}

      ${(ai.recommendations?.patterns || []).length > 0 ? `
        <h3>Tespit Edilen Örüntüler</h3>
        <ul class="patterns">
          ${(ai.recommendations.patterns || []).map(p => `<li>${escape(p)}</li>`).join("")}
        </ul>
      ` : ""}

      ${ai.recommendations?.should_consult_doctor ? `
        <div class="warning">
          <strong>⚠ Doktor Önerisi:</strong> ${escape(ai.recommendations.consult_reason || "Bu belirtiler için bir sağlık uzmanına danışmanız önerilir.")}
        </div>
      ` : ""}

      ${(ai.scientific_references?.items || []).length > 0 ? `
        <h3>Bilimsel Referanslar (PubMed)</h3>
        <ul class="refs">
          ${(ai.scientific_references!.items || []).map(ref => `
            <li>
              <span>${escape(ref.title)}</span>
              <small>PMID: ${ref.pubmed_id}${ref.similarity ? ` · %${Math.round(ref.similarity * 100)} benzerlik` : ""}</small>
            </li>
          `).join("")}
        </ul>
      ` : ""}
    </section>
  `;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>MindTrack Sağlık Raporu — ${escape(user.name)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    color: #1a1a2e;
    line-height: 1.5;
    font-size: 11pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body { padding: 20px; }
  header.doc {
    border-bottom: 3px solid #7C5AED;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  header.doc h1 {
    font-size: 22pt;
    margin: 0 0 6px 0;
    color: #7C5AED;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  header.doc .sub {
    font-size: 9pt;
    color: #666;
    margin: 0;
  }
  .summary-box {
    background: linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%);
    border: 1px solid #e0d4ff;
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 24px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .summary-box .stat {
    text-align: center;
  }
  .summary-box .stat .num {
    font-size: 20pt;
    font-weight: 700;
    color: #7C5AED;
    display: block;
  }
  .summary-box .stat .lbl {
    font-size: 8pt;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 2px;
  }
  section.block {
    margin-bottom: 24px;
    page-break-inside: avoid;
  }
  section.block h2 {
    font-size: 13pt;
    color: #1a1a2e;
    border-bottom: 2px solid #e5e5e5;
    padding-bottom: 6px;
    margin: 0 0 12px 0;
  }
  section.block h3 {
    font-size: 11pt;
    color: #444;
    margin: 16px 0 8px 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
  }
  thead {
    background: #7C5AED;
    color: #fff;
  }
  thead th {
    padding: 8px 10px;
    text-align: left;
    font-weight: 600;
    font-size: 9pt;
  }
  tbody td {
    padding: 8px 10px;
    border-bottom: 1px solid #eee;
  }
  tbody tr:nth-child(even) {
    background: #fafafa;
  }
  .ai .meta {
    font-size: 9pt;
    color: #888;
    margin: 0 0 12px 0;
  }
  .ai .summary {
    background: #f9fafb;
    border-left: 3px solid #7C5AED;
    padding: 12px 14px;
    border-radius: 0 6px 6px 0;
    font-size: 10.5pt;
    line-height: 1.65;
    margin: 0 0 16px 0;
  }
  .recs {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .rec {
    padding: 10px 14px;
    margin-bottom: 8px;
    border-radius: 6px;
    background: #fafafa;
    border-left: 3px solid #2DAFFE;
  }
  .rec.high { border-left-color: #FF5C7A; }
  .rec.med { border-left-color: #F4B740; }
  .rec-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  .rec-head strong {
    font-size: 10.5pt;
    color: #1a1a2e;
  }
  .rec p {
    margin: 0;
    font-size: 9.5pt;
    color: #555;
    line-height: 1.55;
  }
  .badge {
    background: #e0e7ff;
    color: #4338ca;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
  .rec.high .badge { background: #fee2e2; color: #b91c1c; }
  .rec.med .badge { background: #fef3c7; color: #92400e; }
  .patterns {
    padding-left: 18px;
    margin: 0;
    color: #444;
    font-size: 10pt;
  }
  .patterns li { margin-bottom: 4px; }
  .warning {
    background: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 6px;
    padding: 10px 14px;
    margin: 12px 0;
    font-size: 10pt;
    color: #78350f;
  }
  .refs {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 9.5pt;
  }
  .refs li {
    padding: 6px 0;
    border-bottom: 1px dashed #eee;
  }
  .refs li small {
    display: block;
    color: #888;
    font-size: 8.5pt;
    margin-top: 2px;
  }
  footer {
    margin-top: 32px;
    padding-top: 14px;
    border-top: 1px solid #e5e5e5;
    text-align: center;
    font-size: 8.5pt;
    color: #888;
    line-height: 1.6;
  }
  .print-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #7C5AED;
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(124,94,237,0.3);
  }
  @media print {
    .print-btn { display: none; }
    body { padding: 0; }
  }
</style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">PDF Olarak Kaydet</button>

  <header class="doc">
    <h1>MindTrack Sağlık Raporu</h1>
    <p class="sub">
      <strong>Hasta:</strong> ${escape(user.name)} &nbsp;·&nbsp;
      <strong>E-posta:</strong> ${escape(user.email)} &nbsp;·&nbsp;
      <strong>Rapor Tarihi:</strong> ${escape(today)} &nbsp;·&nbsp;
      <strong>Dönem:</strong> Son ${range} gün
    </p>
  </header>

  <div class="summary-box">
    <div class="stat">
      <span class="num">${healthData.length}</span>
      <div class="lbl">Sağlık Kaydı</div>
    </div>
    <div class="stat">
      <span class="num">${symptoms.length}</span>
      <div class="lbl">Belirti Analizi</div>
    </div>
    <div class="stat">
      <span class="num">${images.length}</span>
      <div class="lbl">Beslenme Analizi</div>
    </div>
  </div>

  <section class="block">
    <h2>📊 Günlük Sağlık Verileri</h2>
    <table>
      <thead>
        <tr>
          <th>Tarih</th>
          <th>Ağrı</th>
          <th>Uyku (sa)</th>
          <th>Stres</th>
          <th>Ruh Hali</th>
          <th>Notlar</th>
        </tr>
      </thead>
      <tbody>
        ${healthRows}
      </tbody>
    </table>
  </section>

  <section class="block">
    <h2>🩺 Belirti Analizleri</h2>
    <table>
      <thead>
        <tr>
          <th style="width:14%">Tarih</th>
          <th style="width:46%">Hasta Beyanı</th>
          <th style="width:40%">Tespit Edilen Belirtiler</th>
        </tr>
      </thead>
      <tbody>
        ${symptomRows}
      </tbody>
    </table>
  </section>

  ${aiBlock}

  <footer>
    Bu rapor MindTrack uygulaması tarafından üretilmiştir ve <strong>tıbbi tanı niteliği taşımaz</strong>.<br>
    Sağlık kararları için lütfen bir sağlık profesyoneline danışınız.
  </footer>
</body>
</html>`;
}
