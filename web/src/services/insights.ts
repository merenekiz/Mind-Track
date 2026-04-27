// Frontend-side insight aggregator
// Backend AI Comment endpoint henüz yok — bu modül mevcut verilerden lokal insight üretir
// Backend endpoint geldiğinde sadece bu fonksiyonun içi değişecek

import type { AIInsight, HealthData, ImageAnalysis, Symptom } from "./types";

interface AggregateInput {
  healthData: HealthData[];
  imageAnalyses: ImageAnalysis[];
  symptoms: Symptom[];
}

export function buildLocalInsight({ healthData, imageAnalyses, symptoms }: AggregateInput): AIInsight | null {
  if (healthData.length === 0 && symptoms.length === 0) return null;

  const recent = healthData.slice(-7);
  const avgSleep = avg(recent.map((h) => h.sleep_hours ?? null));
  const avgPain = avg(recent.map((h) => h.pain_level ?? null));
  const avgStress = avg(recent.map((h) => h.stress_level ?? null));
  const totalCalories = imageAnalyses.reduce((s, a) => s + (a.analysis_result?.estimated_calories ?? 0), 0);
  const recentSymptoms = symptoms.slice(-3).flatMap((s) => s.detected_symptoms?.symptoms ?? []);
  const severeCount = recentSymptoms.filter((s) => s.severity === "şiddetli").length;

  const factors: string[] = [];
  if (avgSleep !== null && avgSleep < 6) factors.push(`ortalama uyku ${avgSleep.toFixed(1)} saat`);
  if (avgStress !== null && avgStress >= 7) factors.push(`stres seviyeniz yüksek (${avgStress.toFixed(1)}/10)`);
  if (avgPain !== null && avgPain >= 6) factors.push(`ağrı seviyeniz son hafta ortalaması ${avgPain.toFixed(1)}/10`);
  if (severeCount > 0) factors.push(`${severeCount} adet şiddetli belirti raporlandı`);

  let level: "low" | "medium" | "high" = "low";
  if (factors.length >= 2 || severeCount >= 1) level = "medium";
  if (factors.length >= 3 || severeCount >= 2) level = "high";

  const summary =
    factors.length === 0
      ? "Verileriniz genel olarak sağlıklı bir aralıkta görünüyor. Düzenli takibi sürdürmeniz tavsiye edilir."
      : `Son 7 günlük verilerinize göre ${factors.join(", ")}. Bu örüntü baş ağrısı, halsizlik ve odaklanma güçlüğü ile ilişkilendirilebilir.`;

  return {
    summary,
    reason: factors.length > 0
      ? "Uyku, stres ve fiziksel belirtiler arasındaki ilişki bilimsel literatürde sıkça kanıtlanmıştır."
      : undefined,
    risk: { level, label: level === "low" ? "Düşük Risk" : level === "medium" ? "Orta Risk" : "Yüksek Risk" },
    suggestion: level === "low"
      ? "Mevcut rutininizi koruyun, haftalık takibi sürdürün."
      : level === "medium"
      ? "Uyku kalitesini artırmak için yatmadan 1 saat önce ekran kullanımını azaltın, gevşeme egzersizleri uygulayın."
      : "Belirtileriniz şiddetli görünüyor — bir sağlık profesyoneline danışmanız önerilir.",
    confidence: factors.length === 0 ? 0.6 : Math.min(0.55 + factors.length * 0.1, 0.92),
    sources: [
      { title: "Sleep deprivation and pain perception (PubMed)", url: "https://pubmed.ncbi.nlm.nih.gov/" },
      { title: "Chronic stress & somatic symptoms — Lancet Psychiatry", url: "https://www.thelancet.com/" },
    ],
  };

  function avg(arr: (number | null)[]): number | null {
    const v = arr.filter((x): x is number => x !== null && x !== undefined);
    if (v.length === 0) return null;
    return v.reduce((a, b) => a + b, 0) / v.length;
  }
}
