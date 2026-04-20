"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const moodOptions = [
  { value: "very_bad", label: "Çok Kötü", emoji: "😞" },
  { value: "bad", label: "Kötü", emoji: "😔" },
  { value: "neutral", label: "Normal", emoji: "😐" },
  { value: "good", label: "İyi", emoji: "🙂" },
  { value: "very_good", label: "Çok İyi", emoji: "😊" },
];

const painTypeOptions = [
  { value: "bulanti", label: "Bulantı" },
  { value: "bas_donmesi", label: "Baş Dönmesi" },
  { value: "carpinti", label: "Çarpıntı" },
  { value: "siskinlik", label: "Şişkinlik" },
  { value: "bas_agrisi", label: "Baş Ağrısı" },
];

const bodyRegions = [
  { id: "head", label: "Baş", x: 85, y: 22, w: 30, h: 30 },
  { id: "neck", label: "Boyun", x: 85, y: 55, w: 20, h: 15 },
  { id: "chest", label: "Göğüs", x: 85, y: 85, w: 50, h: 40 },
  { id: "left_arm", label: "Sol Kol", x: 30, y: 95, w: 20, h: 60 },
  { id: "right_arm", label: "Sağ Kol", x: 140, y: 95, w: 20, h: 60 },
  { id: "stomach", label: "Karın", x: 85, y: 130, w: 45, h: 35 },
  { id: "left_leg", label: "Sol Bacak", x: 65, y: 185, w: 22, h: 70 },
  { id: "right_leg", label: "Sağ Bacak", x: 105, y: 185, w: 22, h: 70 },
  { id: "back", label: "Sırt", x: 85, y: 108, w: 50, h: 30 },
];

function painColor(v: number) {
  if (v >= 7) return "var(--mt-accent3)";
  if (v >= 4) return "var(--mt-warn)";
  return "var(--mt-accent4)";
}

function stressColor(v: number) {
  if (v >= 7) return "var(--mt-accent3)";
  if (v >= 5) return "var(--mt-warn)";
  return "var(--mt-accent4)";
}


export default function NewHealthDataPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split("T")[0];
  const todayFormatted = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [date, setDate] = useState(today);
  const [painLevel, setPainLevel] = useState(0);
  const [painType, setPainType] = useState("");
  const [selectedBodyRegions, setSelectedBodyRegions] = useState<string[]>([]);
  const [bodyMapNotes, setBodyMapNotes] = useState("");
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [stressLevel, setStressLevel] = useState(5);
  const [waterIntake, setWaterIntake] = useState(2);
  const [activityMinutes, setActivityMinutes] = useState(30);
  const [dayIntensity, setDayIntensity] = useState(5);
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");
  const [nutritionPhoto, setNutritionPhoto] = useState<File | null>(null);
  const [nutritionPreview, setNutritionPreview] = useState<string | null>(null);
  const [imageAnalyzing, setImageAnalyzing] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<{
    category?: string;
    item_name?: string;
    estimated_calories?: number | null;
    caffeine_mg?: number | null;
    nutrients?: Record<string, number> | null;
    description?: string;
    health_notes?: string | null;
  } | null>(null);
  const [imageAnalysisError, setImageAnalysisError] = useState("");

  if (!user) return null;

  const toggleBodyRegion = (regionId: string) => {
    setSelectedBodyRegions((prev) =>
      prev.includes(regionId)
        ? prev.filter((r) => r !== regionId)
        : [...prev, regionId]
    );
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNutritionPhoto(file);
    setImageAnalysisError("");
    setImageAnalysisResult(null);

    // Preview
    const reader = new FileReader();
    reader.onload = () => setNutritionPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Gemini Vision analizi
    setImageAnalyzing(true);
    try {
      const result = await api.uploadAndAnalyzeImage(file);
      setImageAnalysisResult(result.analysis_result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Görsel analizi başarısız";
      setImageAnalysisError(message);
    } finally {
      setImageAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        date,
        pain_level: painLevel,
        sleep_hours: sleepHours,
        sleep_quality: sleepQuality,
        stress_level: stressLevel,
        water_intake: waterIntake,
        activity_minutes: activityMinutes,
        day_intensity: dayIntensity,
      };
      if (painType) payload.pain_type = painType;
      if (selectedBodyRegions.length > 0) {
        payload.pain_body_map = {
          regions: selectedBodyRegions,
          notes: bodyMapNotes.trim() || undefined,
        };
      }
      if (mood) payload.mood = mood;
      if (notes.trim()) payload.notes = notes.trim();
      // nutrition_photo_url will be handled when image upload endpoint is ready
      await api.createHealthData(payload);
      router.push("/dashboard");
    } catch {
      setError("Kayıt oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <header
        className="bg-mt-surface border-b border-mt-border flex items-center justify-between shrink-0"
        style={{ height: 76, padding: "0 48px" }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Yeni Kayıt</h1>
          <p className="text-mt-muted" style={{ fontSize: 13, marginTop: 4 }}>
            Günlük sağlık verinizi girin
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="border border-mt-border text-mt-text2 hover:border-mt-accent hover:text-mt-accent transition-all inline-flex items-center"
          style={{ height: 44, padding: "0 24px", borderRadius: 12, fontSize: 14, fontWeight: 500, gap: 10 }}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Geri
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: 48 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Date */}
          <div
            className="bg-mt-accent/8 border border-mt-accent/15 inline-flex items-center"
            style={{ padding: "16px 24px", borderRadius: 12, gap: 12, marginBottom: 40 }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" className="text-mt-accent">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span className="text-mt-accent" style={{ fontSize: 14, fontWeight: 500 }}>{todayFormatted}</span>
          </div>

          {error && (
            <div
              className="bg-mt-accent3/10 border border-mt-accent3/20 text-mt-accent3 flex items-center"
              style={{ padding: "16px 24px", borderRadius: 12, marginBottom: 40, fontSize: 14, gap: 12 }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}>
              {/* Form — 2/3 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {/* ═══ Davranışsal Veriler ═══ */}
                <div className="bg-mt-surface border border-mt-border mt-card" style={{ borderRadius: 16, padding: 36 }}>
                  <h2 className="flex items-center" style={{ fontSize: 18, fontWeight: 700, marginBottom: 40, gap: 16 }}>
                    <div className="bg-mt-accent/10 flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 12 }}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" className="text-mt-accent">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                      </svg>
                    </div>
                    Davranışsal Veriler
                  </h2>

                  <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
                    {/* Uyku */}
                    <div>
                      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                        <label className="text-mt-text2" style={{ fontSize: 14, fontWeight: 500 }}>Uyku Süresi</label>
                        <span className="text-mt-accent" style={{ fontSize: 32, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                          {sleepHours.toFixed(1)}
                          <span className="text-mt-muted" style={{ fontSize: 12, fontWeight: 400, marginLeft: 6 }}>sa</span>
                        </span>
                      </div>
                      <input type="range" min="0" max="12" step="0.5" value={sleepHours}
                        onChange={(e) => setSleepHours(parseFloat(e.target.value))} className="w-full" />
                      <div className="flex justify-between text-mt-muted" style={{ fontSize: 11, marginTop: 12 }}>
                        <span>0 sa</span><span>6 sa</span><span>12 sa</span>
                      </div>
                    </div>

                    {/* Stres */}
                    <div>
                      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                        <label className="text-mt-text2" style={{ fontSize: 14, fontWeight: 500 }}>Stres Seviyesi</label>
                        <span style={{ fontSize: 32, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1, color: stressColor(stressLevel) }}>
                          {stressLevel}
                          <span className="text-mt-muted" style={{ fontSize: 12, fontWeight: 400, marginLeft: 6 }}>/10</span>
                        </span>
                      </div>
                      <input type="range" min="1" max="10" step="1" value={stressLevel}
                        onChange={(e) => setStressLevel(parseInt(e.target.value))} className="w-full" />
                      <div className="flex justify-between text-mt-muted" style={{ fontSize: 11, marginTop: 12 }}>
                        <span>Düşük</span><span>Orta</span><span>Yüksek</span>
                      </div>
                    </div>

                    {/* Uyku Kalitesi */}
                    <div>
                      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                        <label className="text-mt-text2" style={{ fontSize: 14, fontWeight: 500 }}>Uyku Kalitesi</label>
                        <span className="text-mt-purple" style={{ fontSize: 32, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                          {sleepQuality}
                          <span className="text-mt-muted" style={{ fontSize: 12, fontWeight: 400, marginLeft: 6 }}>/5</span>
                        </span>
                      </div>
                      <input type="range" min="1" max="5" step="1" value={sleepQuality}
                        onChange={(e) => setSleepQuality(parseInt(e.target.value))} className="w-full" />
                      <div className="flex justify-between text-mt-muted" style={{ fontSize: 11, marginTop: 12 }}>
                        <span>Çok Kötü</span><span>Orta</span><span>Mükemmel</span>
                      </div>
                    </div>

                    {/* Su Tüketimi */}
                    <div>
                      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                        <label className="text-mt-text2" style={{ fontSize: 14, fontWeight: 500 }}>Su Tüketimi</label>
                        <span style={{ fontSize: 32, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1, color: "var(--mt-accent2)" }}>
                          {waterIntake.toFixed(1)}
                          <span className="text-mt-muted" style={{ fontSize: 12, fontWeight: 400, marginLeft: 6 }}>L</span>
                        </span>
                      </div>
                      <input type="range" min="0" max="12" step="0.5" value={waterIntake}
                        onChange={(e) => setWaterIntake(parseFloat(e.target.value))} className="w-full" />
                      <div className="flex justify-between text-mt-muted" style={{ fontSize: 11, marginTop: 12 }}>
                        <span>0 L</span><span>6 L</span><span>12 L</span>
                      </div>
                    </div>

                    {/* Günlük Aktivite */}
                    <div>
                      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                        <label className="text-mt-text2" style={{ fontSize: 14, fontWeight: 500 }}>Günlük Aktivite</label>
                        <span className="text-mt-accent4" style={{ fontSize: 32, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                          {activityMinutes}
                          <span className="text-mt-muted" style={{ fontSize: 12, fontWeight: 400, marginLeft: 6 }}>dk</span>
                        </span>
                      </div>
                      <input type="range" min="0" max="180" step="5" value={activityMinutes}
                        onChange={(e) => setActivityMinutes(parseInt(e.target.value))} className="w-full" />
                      <div className="flex justify-between text-mt-muted" style={{ fontSize: 11, marginTop: 12 }}>
                        <span>0 dk</span><span>90 dk</span><span>180 dk</span>
                      </div>
                    </div>

                    {/* Günün Yoğunluğu */}
                    <div>
                      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                        <label className="text-mt-text2" style={{ fontSize: 14, fontWeight: 500 }}>Günün Yoğunluğu</label>
                        <span className="text-mt-warn" style={{ fontSize: 32, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                          {dayIntensity}
                          <span className="text-mt-muted" style={{ fontSize: 12, fontWeight: 400, marginLeft: 6 }}>/10</span>
                        </span>
                      </div>
                      <input type="range" min="1" max="10" step="1" value={dayIntensity}
                        onChange={(e) => setDayIntensity(parseInt(e.target.value))} className="w-full" />
                      <div className="flex justify-between text-mt-muted" style={{ fontSize: 11, marginTop: 12 }}>
                        <span>Hafif</span><span>Orta</span><span>Çok Yoğun</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══ Semptomlar ═══ */}
                <div className="bg-mt-surface border border-mt-border mt-card" style={{ borderRadius: 16, padding: 36 }}>
                  <h2 className="flex items-center" style={{ fontSize: 18, fontWeight: 700, marginBottom: 40, gap: 16 }}>
                    <div className="bg-mt-accent3/10 flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 12 }}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" className="text-mt-accent3">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                      </svg>
                    </div>
                    Semptomlar
                  </h2>

                  {/* Ağrı Şiddeti */}
                  <div style={{ marginBottom: 48 }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                      <label className="text-mt-text2" style={{ fontSize: 14, fontWeight: 500 }}>Ağrı Şiddeti</label>
                      <span style={{ fontSize: 32, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1, color: painColor(painLevel) }}>
                        {painLevel}
                        <span className="text-mt-muted" style={{ fontSize: 12, fontWeight: 400, marginLeft: 6 }}>/10</span>
                      </span>
                    </div>
                    <input type="range" min="0" max="10" step="1" value={painLevel}
                      onChange={(e) => setPainLevel(parseInt(e.target.value))} className="w-full" />
                    <div className="flex justify-between text-mt-muted" style={{ fontSize: 11, marginTop: 12 }}>
                      <span>Yok</span><span>Orta</span><span>Çok Şiddetli</span>
                    </div>
                  </div>

                  {/* Ağrı Türü */}
                  <div style={{ marginBottom: 48 }}>
                    <label className="block text-mt-text2" style={{ fontSize: 14, fontWeight: 500, marginBottom: 20 }}>Ağrı Türü</label>
                    <div className="flex flex-wrap" style={{ gap: 12 }}>
                      {painTypeOptions.map((pt) => (
                        <button
                          key={pt.value}
                          type="button"
                          onClick={() => setPainType(painType === pt.value ? "" : pt.value)}
                          className={`border transition-all ${
                            painType === pt.value
                              ? "bg-mt-accent3/10 border-mt-accent3 text-mt-accent3"
                              : "border-mt-border text-mt-text2 hover:border-mt-border2 hover:text-mt-text"
                          }`}
                          style={{ height: 44, padding: "0 24px", borderRadius: 12, fontSize: 13, fontWeight: 500 }}
                        >
                          {pt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vücut Isı Haritası */}
                  <div style={{ marginBottom: 48 }}>
                    <label className="block text-mt-text2" style={{ fontSize: 14, fontWeight: 500, marginBottom: 20 }}>Ağrı Bölgesi</label>
                    <div className="bg-mt-surface2 border border-mt-border" style={{ borderRadius: 16, padding: 32 }}>
                      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
                        {/* SVG Human Silhouette */}
                        <div style={{ position: "relative", width: 200, height: 320, flexShrink: 0 }}>
                          <svg viewBox="0 0 200 320" width="200" height="320" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Head */}
                            <circle cx="100" cy="35" r="25" stroke="var(--mt-border2)" strokeWidth="1.5"
                              fill={selectedBodyRegions.includes("head") ? "var(--mt-accent3)" : "var(--mt-surface3)"}
                              opacity={selectedBodyRegions.includes("head") ? 0.6 : 0.4}
                              style={{ cursor: "pointer" }}
                              onClick={() => toggleBodyRegion("head")} />
                            {/* Neck */}
                            <rect x="90" y="58" width="20" height="18" rx="4" stroke="var(--mt-border2)" strokeWidth="1.5"
                              fill={selectedBodyRegions.includes("neck") ? "var(--mt-accent3)" : "var(--mt-surface3)"}
                              opacity={selectedBodyRegions.includes("neck") ? 0.6 : 0.4}
                              style={{ cursor: "pointer" }}
                              onClick={() => toggleBodyRegion("neck")} />
                            {/* Torso - Chest */}
                            <path d="M60 76 Q60 72 65 72 L135 72 Q140 72 140 76 L140 130 Q140 135 135 135 L65 135 Q60 135 60 130 Z"
                              stroke="var(--mt-border2)" strokeWidth="1.5"
                              fill={selectedBodyRegions.includes("chest") ? "var(--mt-accent3)" : "var(--mt-surface3)"}
                              opacity={selectedBodyRegions.includes("chest") ? 0.6 : 0.4}
                              style={{ cursor: "pointer" }}
                              onClick={() => toggleBodyRegion("chest")} />
                            {/* Stomach */}
                            <path d="M65 135 L135 135 L130 175 Q100 185 70 175 Z"
                              stroke="var(--mt-border2)" strokeWidth="1.5"
                              fill={selectedBodyRegions.includes("stomach") ? "var(--mt-accent3)" : "var(--mt-surface3)"}
                              opacity={selectedBodyRegions.includes("stomach") ? 0.6 : 0.4}
                              style={{ cursor: "pointer" }}
                              onClick={() => toggleBodyRegion("stomach")} />
                            {/* Left Arm */}
                            <path d="M60 76 L35 90 L25 155 L40 158 L48 100 L60 90"
                              stroke="var(--mt-border2)" strokeWidth="1.5"
                              fill={selectedBodyRegions.includes("left_arm") ? "var(--mt-accent3)" : "var(--mt-surface3)"}
                              opacity={selectedBodyRegions.includes("left_arm") ? 0.6 : 0.4}
                              style={{ cursor: "pointer" }}
                              onClick={() => toggleBodyRegion("left_arm")} />
                            {/* Right Arm */}
                            <path d="M140 76 L165 90 L175 155 L160 158 L152 100 L140 90"
                              stroke="var(--mt-border2)" strokeWidth="1.5"
                              fill={selectedBodyRegions.includes("right_arm") ? "var(--mt-accent3)" : "var(--mt-surface3)"}
                              opacity={selectedBodyRegions.includes("right_arm") ? 0.6 : 0.4}
                              style={{ cursor: "pointer" }}
                              onClick={() => toggleBodyRegion("right_arm")} />
                            {/* Left Leg */}
                            <path d="M70 175 L65 280 L55 280 L50 285 L75 285 L78 280 L80 175"
                              stroke="var(--mt-border2)" strokeWidth="1.5"
                              fill={selectedBodyRegions.includes("left_leg") ? "var(--mt-accent3)" : "var(--mt-surface3)"}
                              opacity={selectedBodyRegions.includes("left_leg") ? 0.6 : 0.4}
                              style={{ cursor: "pointer" }}
                              onClick={() => toggleBodyRegion("left_leg")} />
                            {/* Right Leg */}
                            <path d="M120 175 L125 280 L115 280 L112 285 L140 285 L145 280 L135 280 L130 175"
                              stroke="var(--mt-border2)" strokeWidth="1.5"
                              fill={selectedBodyRegions.includes("right_leg") ? "var(--mt-accent3)" : "var(--mt-surface3)"}
                              opacity={selectedBodyRegions.includes("right_leg") ? 0.6 : 0.4}
                              style={{ cursor: "pointer" }}
                              onClick={() => toggleBodyRegion("right_leg")} />
                            {/* Back indicator */}
                            <rect x="75" y="100" width="50" height="30" rx="4" stroke="var(--mt-border2)" strokeWidth="1" strokeDasharray="4 2"
                              fill={selectedBodyRegions.includes("back") ? "var(--mt-accent3)" : "transparent"}
                              opacity={selectedBodyRegions.includes("back") ? 0.4 : 0.2}
                              style={{ cursor: "pointer" }}
                              onClick={() => toggleBodyRegion("back")} />
                            {selectedBodyRegions.includes("back") && (
                              <text x="100" y="119" textAnchor="middle" fill="var(--mt-accent3)" fontSize="9" fontWeight="600">Sırt</text>
                            )}
                          </svg>
                        </div>

                        {/* Selected Regions & Notes */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="text-mt-muted" style={{ fontSize: 12, marginBottom: 16 }}>
                            Ağrı hissettiğiniz bölgelere tıklayın
                          </p>

                          {selectedBodyRegions.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                              <div className="flex flex-wrap" style={{ gap: 8 }}>
                                {selectedBodyRegions.map((regionId) => {
                                  const region = bodyRegions.find((r) => r.id === regionId);
                                  return (
                                    <span
                                      key={regionId}
                                      className="bg-mt-accent3/15 text-mt-accent3 border border-mt-accent3/30 inline-flex items-center"
                                      style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, gap: 8 }}
                                    >
                                      {region?.label}
                                      <button type="button" onClick={() => toggleBodyRegion(regionId)} style={{ opacity: 0.7 }}>×</button>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <textarea
                            value={bodyMapNotes}
                            onChange={(e) => setBodyMapNotes(e.target.value)}
                            maxLength={500}
                            rows={4}
                            className="w-full bg-mt-surface border border-mt-border text-mt-text placeholder:text-mt-muted resize-y"
                            style={{ borderRadius: 10, padding: "12px 16px", fontSize: 13, lineHeight: 1.6 }}
                            placeholder="Ağrı hakkında detay ekleyebilirsiniz..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ruh Hali */}
                  <div style={{ marginBottom: 48 }}>
                    <label className="block text-mt-text2" style={{ fontSize: 14, fontWeight: 500, marginBottom: 20 }}>Ruh Hali</label>
                    <div className="flex flex-wrap" style={{ gap: 12 }}>
                      {moodOptions.map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setMood(mood === m.value ? "" : m.value)}
                          className={`border transition-all ${
                            mood === m.value
                              ? "bg-mt-accent/10 border-mt-accent text-mt-accent"
                              : "border-mt-border text-mt-text2 hover:border-mt-border2 hover:text-mt-text"
                          }`}
                          style={{ height: 52, padding: "0 28px", borderRadius: 12, fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}
                        >
                          <span style={{ fontSize: 20 }}>{m.emoji}</span>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notlar */}
                  <div>
                    <label className="block text-mt-text2" style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Notlar</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      maxLength={1000}
                      rows={5}
                      className="w-full bg-mt-surface2 border border-mt-border text-mt-text placeholder:text-mt-muted resize-y"
                      style={{ borderRadius: 12, padding: "16px 20px", fontSize: 14, lineHeight: 1.7 }}
                      placeholder="Bugün nasıl hissediyorsunuz? Ek bilgi ekleyebilirsiniz..."
                    />
                    <p className="text-right text-mt-muted" style={{ fontSize: 11, marginTop: 8 }}>{notes.length}/1000</p>
                  </div>
                </div>

                {/* ═══ Beslenme ═══ */}
                <div className="bg-mt-surface border border-mt-border mt-card" style={{ borderRadius: 16, padding: 36 }}>
                  <h2 className="flex items-center" style={{ fontSize: 18, fontWeight: 700, marginBottom: 40, gap: 16 }}>
                    <div className="bg-mt-accent4/10 flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 12 }}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" className="text-mt-accent4">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                        <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
                      </svg>
                    </div>
                    Beslenme
                  </h2>

                  <div
                    className="border-2 border-dashed border-mt-border hover:border-mt-accent4/50 transition-all"
                    style={{ borderRadius: 16, padding: 40, textAlign: "center", cursor: "pointer" }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      style={{ display: "none" }}
                    />

                    {nutritionPreview ? (
                      <div>
                        <img
                          src={nutritionPreview}
                          alt="Beslenme fotoğrafı"
                          style={{ maxWidth: 300, maxHeight: 200, borderRadius: 12, margin: "0 auto 20px", objectFit: "cover" }}
                        />
                        <p className="text-mt-accent4" style={{ fontSize: 13, fontWeight: 500 }}>{nutritionPhoto?.name}</p>
                        <p className="text-mt-muted" style={{ fontSize: 12, marginTop: 8 }}>Değiştirmek için tıklayın</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-center" style={{ marginBottom: 20 }}>
                          <div className="bg-mt-accent4/10 flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 16 }}>
                            <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" className="text-mt-accent4">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                          </div>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Beslenme Fotoğrafı Yükle</p>
                        <p className="text-mt-muted" style={{ fontSize: 13 }}>
                          Yediğiniz yemeğin fotoğrafını yükleyin — AI ile analiz edilecek
                        </p>
                        <p className="text-mt-muted" style={{ fontSize: 11, marginTop: 12 }}>PNG, JPG, HEIC — Maks 10MB</p>
                      </div>
                    )}
                  </div>

                  {/* Analiz Durumu */}
                  {imageAnalyzing && (
                    <div className="flex items-center bg-mt-accent4/8 border border-mt-accent4/20" style={{ padding: "16px 24px", borderRadius: 12, marginTop: 20, gap: 12 }}>
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="var(--mt-accent4)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-mt-accent4" style={{ fontSize: 14, fontWeight: 500 }}>Gemini Vision ile analiz ediliyor...</span>
                    </div>
                  )}

                  {imageAnalysisError && (
                    <div className="bg-mt-accent3/10 border border-mt-accent3/20 text-mt-accent3" style={{ padding: "16px 24px", borderRadius: 12, marginTop: 20, fontSize: 13 }}>
                      {imageAnalysisError}
                    </div>
                  )}

                  {/* Analiz Sonucu */}
                  {imageAnalysisResult && !imageAnalyzing && (
                    <div className="bg-mt-surface2 border border-mt-border" style={{ borderRadius: 16, padding: 28, marginTop: 20 }}>
                      <div className="flex items-center" style={{ gap: 12, marginBottom: 20 }}>
                        <div className="bg-mt-accent4/15 flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10 }}>
                          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" className="text-mt-accent4">
                            <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
                          </svg>
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700 }}>AI Analiz Sonucu</p>
                          <p className="text-mt-muted" style={{ fontSize: 11 }}>Gemini Vision</p>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {imageAnalysisResult.item_name && (
                          <div className="flex justify-between" style={{ paddingBottom: 12, borderBottom: "1px solid var(--mt-border)" }}>
                            <span className="text-mt-text2" style={{ fontSize: 13 }}>Tanım</span>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{imageAnalysisResult.item_name}</span>
                          </div>
                        )}
                        {imageAnalysisResult.category && (
                          <div className="flex justify-between" style={{ paddingBottom: 12, borderBottom: "1px solid var(--mt-border)" }}>
                            <span className="text-mt-text2" style={{ fontSize: 13 }}>Kategori</span>
                            <span className="text-mt-accent4" style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>
                              {imageAnalysisResult.category === "food" ? "Yiyecek" : imageAnalysisResult.category === "drink" ? "Icecek" : "Diger"}
                            </span>
                          </div>
                        )}
                        {imageAnalysisResult.estimated_calories != null && (
                          <div className="flex justify-between" style={{ paddingBottom: 12, borderBottom: "1px solid var(--mt-border)" }}>
                            <span className="text-mt-text2" style={{ fontSize: 13 }}>Tahmini Kalori</span>
                            <span className="text-mt-warn" style={{ fontSize: 13, fontWeight: 700 }}>{imageAnalysisResult.estimated_calories} kcal</span>
                          </div>
                        )}
                        {imageAnalysisResult.caffeine_mg != null && (
                          <div className="flex justify-between" style={{ paddingBottom: 12, borderBottom: "1px solid var(--mt-border)" }}>
                            <span className="text-mt-text2" style={{ fontSize: 13 }}>Kafein</span>
                            <span className="text-mt-accent2" style={{ fontSize: 13, fontWeight: 700 }}>{imageAnalysisResult.caffeine_mg} mg</span>
                          </div>
                        )}
                        {imageAnalysisResult.nutrients && (
                          <div style={{ paddingBottom: 12, borderBottom: "1px solid var(--mt-border)" }}>
                            <span className="text-mt-text2 block" style={{ fontSize: 13, marginBottom: 10 }}>Besin Degerleri</span>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              {Object.entries(imageAnalysisResult.nutrients).map(([key, val]) => (
                                <div key={key} className="flex justify-between bg-mt-surface border border-mt-border" style={{ padding: "8px 14px", borderRadius: 8 }}>
                                  <span className="text-mt-muted" style={{ fontSize: 11 }}>{key.replace(/_/g, " ").replace(" g", "")}</span>
                                  <span style={{ fontSize: 11, fontWeight: 700 }}>{val}g</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {imageAnalysisResult.description && (
                          <p className="text-mt-text2" style={{ fontSize: 13, lineHeight: 1.6 }}>{imageAnalysisResult.description}</p>
                        )}
                        {imageAnalysisResult.health_notes && (
                          <div className="bg-mt-accent/8 border border-mt-accent/15" style={{ padding: "12px 16px", borderRadius: 10, marginTop: 4 }}>
                            <p className="text-mt-accent" style={{ fontSize: 12, lineHeight: 1.5 }}>{imageAnalysisResult.health_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ═══ Summary — 1/3 ═══ */}
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                {/* Tarih */}
                <div className="bg-mt-surface border border-mt-border mt-card" style={{ borderRadius: 16, padding: 32 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Kayıt Tarihi</h3>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-mt-surface2 border border-mt-border text-mt-text"
                    style={{ height: 52, borderRadius: 12, padding: "0 20px", fontSize: 14 }}
                    required
                  />
                </div>

                {/* Özet */}
                <div className="bg-mt-surface border border-mt-border mt-card" style={{ borderRadius: 16, padding: 32, position: "sticky", top: 40 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 28 }}>Kayıt Özeti</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[
                      { label: "Ağrı Şiddeti", value: `${painLevel}/10`, color: painColor(painLevel) },
                      ...(painType ? [{ label: "Ağrı Türü", value: painTypeOptions.find((p) => p.value === painType)?.label || "", color: painColor(painLevel) }] : []),
                      { label: "Uyku Süresi", value: `${sleepHours.toFixed(1)} sa`, color: "var(--mt-accent)" },
                      { label: "Uyku Kalitesi", value: `${sleepQuality}/5`, color: "var(--mt-purple)" },
                      { label: "Stres Seviyesi", value: `${stressLevel}/10`, color: stressColor(stressLevel) },
                      { label: "Su Tüketimi", value: `${waterIntake.toFixed(1)} L`, color: "var(--mt-accent2)" },
                      { label: "Aktivite", value: `${activityMinutes} dk`, color: "var(--mt-accent4)" },
                      { label: "Gün Yoğunluğu", value: `${dayIntensity}/10`, color: "var(--mt-warn)" },
                      ...(mood ? [{ label: "Ruh Hali", value: moodOptions.find((m) => m.value === mood)?.label || "", color: "var(--mt-accent2)" }] : []),
                      ...(selectedBodyRegions.length > 0 ? [{ label: "Ağrı Bölgesi", value: `${selectedBodyRegions.length} bölge`, color: painColor(painLevel) }] : []),
                    ].map((row, i, arr) => (
                      <div
                        key={row.label}
                        className={`flex items-center justify-between ${i < arr.length - 1 ? "border-b border-mt-border/50" : ""}`}
                        style={{ paddingBottom: i < arr.length - 1 ? 16 : 0 }}
                      >
                        <span className="text-mt-text2" style={{ fontSize: 13 }}>{row.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: row.color }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-mt-accent text-black font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ height: 52, borderRadius: 12, fontSize: 15, marginTop: 32 }}
                  >
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Kaydediliyor...
                      </span>
                    ) : "Günlük Kaydı Oluştur"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
