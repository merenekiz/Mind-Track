"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icons";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

type MealAnalysisResult = {
  category?: string;
  item_name?: string;
  estimated_calories?: number | null;
  caffeine_mg?: number | null;
  nutrients?: Record<string, number> | null;
  description?: string;
  health_notes?: string | null;
};

type MealState = {
  photos: File[];
  previews: string[];
  results: MealAnalysisResult[];
  analyzing: boolean;
  progress: string;
  error: string;
};

const emptyMeal = (): MealState => ({
  photos: [], previews: [], results: [], analyzing: false, progress: "", error: "",
});

const MEALS: { key: MealType; label: string; emoji: string; hint: string }[] = [
  { key: "breakfast", label: "Kahvaltı", emoji: "🥐", hint: "Sabah yedikleriniz" },
  { key: "lunch", label: "Öğle", emoji: "🥗", hint: "Öğle yemeği" },
  { key: "dinner", label: "Akşam", emoji: "🍲", hint: "Akşam yemeği" },
  { key: "snack", label: "Atıştırmalık", emoji: "☕", hint: "Ara öğünler & içecekler" },
];

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
  const fileInputs = useRef<Record<MealType, HTMLInputElement | null>>({
    breakfast: null, lunch: null, dinner: null, snack: null,
  });
  const [activeMeal, setActiveMeal] = useState<MealType>("breakfast");

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
  const [meals, setMeals] = useState<Record<MealType, MealState>>({
    breakfast: emptyMeal(),
    lunch: emptyMeal(),
    dinner: emptyMeal(),
    snack: emptyMeal(),
  });

  const updateMeal = (key: MealType, patch: Partial<MealState>) =>
    setMeals((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  // Semptom metin analizi
  const [symptomText, setSymptomText] = useState("");
  const [symptomAnalyzing, setSymptomAnalyzing] = useState(false);
  const [symptomError, setSymptomError] = useState("");
  const [symptomResult, setSymptomResult] = useState<{
    symptoms?: { name: string; severity?: string | null; body_region?: string | null; duration?: string | null }[];
    summary?: string;
    suggested_categories?: string[];
  } | null>(null);

  if (!user) return null;

  const toggleBodyRegion = (regionId: string) => {
    setSelectedBodyRegions((prev) =>
      prev.includes(regionId)
        ? prev.filter((r) => r !== regionId)
        : [...prev, regionId]
    );
  };

  const handlePhotoSelect = async (mealKey: MealType, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const previews: string[] = [];
    for (const file of newFiles) {
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      previews.push(preview);
    }

    const current = meals[mealKey];
    updateMeal(mealKey, {
      photos: [...current.photos, ...newFiles],
      previews: [...current.previews, ...previews],
      analyzing: true,
      progress: `Analiz ediliyor 0/${newFiles.length}...`,
      error: "",
    });

    // Reset input so the same file can be re-selected if needed
    e.target.value = "";

    try {
      const results = await api.bulkUploadAndAnalyzeImages(newFiles, { mealType: mealKey });
      const analysisResults = (results as { analysis_result: MealAnalysisResult }[]).map(
        (r) => r.analysis_result,
      );
      setMeals((prev) => ({
        ...prev,
        [mealKey]: {
          ...prev[mealKey],
          results: [...prev[mealKey].results, ...analysisResults],
          analyzing: false,
          progress: "",
        },
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Görsel analizi başarısız";
      updateMeal(mealKey, { analyzing: false, progress: "", error: message });
    }
  };

  const removePhoto = (mealKey: MealType, index: number) => {
    const current = meals[mealKey];
    updateMeal(mealKey, {
      photos: current.photos.filter((_, i) => i !== index),
      previews: current.previews.filter((_, i) => i !== index),
      results: current.results.filter((_, i) => i !== index),
    });
  };

  const mealCalories = (m: MealState) =>
    m.results.reduce((sum, r) => sum + (r.estimated_calories || 0), 0);
  const totalCalories = (Object.values(meals) as MealState[]).reduce(
    (sum, m) => sum + mealCalories(m),
    0,
  );
  const totalPhotos = (Object.values(meals) as MealState[]).reduce(
    (sum, m) => sum + m.previews.length,
    0,
  );

  const handleAnalyzeSymptom = async () => {
    if (!symptomText.trim() || symptomText.trim().length < 3) {
      setSymptomError("En az 3 karakter girin");
      return;
    }
    setSymptomError("");
    setSymptomAnalyzing(true);
    try {
      const result = await api.createSymptom({ text: symptomText.trim(), date });
      setSymptomResult(result.detected_symptoms);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Semptom analizi başarısız";
      setSymptomError(message);
    } finally {
      setSymptomAnalyzing(false);
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
      <header className="lm-topbar">
        <h1>
          Yeni kayıt <span className="date-sub">{todayFormatted}</span>
        </h1>
        <div className="actions">
          <button type="button" onClick={() => router.back()} className="lm-btn lm-btn-secondary">
            ← Geri
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="lm-content flex-1 overflow-y-auto">
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>

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

                {/* ═══ Beslenme — Öğün Bazlı ═══ */}
                <div className="bg-mt-surface border border-mt-border mt-card" style={{ borderRadius: 16, padding: 36 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
                    <h2 className="flex items-center" style={{ fontSize: 18, fontWeight: 700, gap: 16 }}>
                      <div className="bg-mt-accent4/10 flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 12 }}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" className="text-mt-accent4">
                          <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                          <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
                        </svg>
                      </div>
                      Beslenme — Öğünler
                    </h2>
                    {totalPhotos > 0 && (
                      <div className="bg-mt-warn/10 border border-mt-warn/20 inline-flex items-center" style={{ padding: "8px 16px", borderRadius: 999, gap: 10 }}>
                        <span className="text-mt-text2" style={{ fontSize: 12, fontWeight: 500 }}>Günlük Toplam</span>
                        <span className="text-mt-warn" style={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                          {totalCalories} <span style={{ fontSize: 11, fontWeight: 500 }}>kcal</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Meal Tabs */}
                  <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 24 }}>
                    {MEALS.map((meal) => {
                      const m = meals[meal.key];
                      const cals = mealCalories(m);
                      const isActive = activeMeal === meal.key;
                      return (
                        <button
                          key={meal.key}
                          type="button"
                          onClick={() => setActiveMeal(meal.key)}
                          className="border transition-all"
                          style={{
                            padding: "10px 16px",
                            borderRadius: 12,
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            background: isActive ? "var(--mt-accent4)" : "var(--mt-surface2)",
                            borderColor: isActive ? "var(--mt-accent4)" : "var(--mt-border)",
                            color: isActive ? "#0A0E1A" : "var(--mt-text2)",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          <span style={{ fontSize: 18 }}>{meal.emoji}</span>
                          {meal.label}
                          {m.previews.length > 0 && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 999,
                                background: isActive ? "rgba(0,0,0,0.18)" : "var(--mt-surface3)",
                                color: isActive ? "#0A0E1A" : "var(--mt-text)",
                              }}
                            >
                              {m.previews.length}{cals > 0 ? ` · ${cals}kcal` : ""}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Meal Panel */}
                  {(() => {
                    const meal = MEALS.find((m) => m.key === activeMeal)!;
                    const state = meals[activeMeal];
                    return (
                      <div>
                        <p className="text-mt-muted" style={{ fontSize: 12, marginBottom: 14 }}>
                          {meal.emoji} {meal.label} — {meal.hint}
                        </p>

                        {/* Previews */}
                        {state.previews.length > 0 && (
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
                              {state.previews.map((preview, i) => (
                                <div key={i} style={{ position: "relative" }}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={preview}
                                    alt={`${meal.label} ${i + 1}`}
                                    style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 10, border: "1px solid var(--mt-border)" }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removePhoto(activeMeal, i)}
                                    className="bg-mt-accent3 text-white flex items-center justify-center"
                                    style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", fontSize: 12, fontWeight: 700, border: "2px solid var(--mt-surface)" }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Upload Dropzone */}
                        <div
                          className="border-2 border-dashed border-mt-border hover:border-mt-accent4/50 transition-all"
                          style={{ borderRadius: 16, padding: state.previews.length > 0 ? 20 : 36, textAlign: "center", cursor: "pointer" }}
                          onClick={() => fileInputs.current[activeMeal]?.click()}
                        >
                          <input
                            ref={(el) => { fileInputs.current[activeMeal] = el; }}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handlePhotoSelect(activeMeal, e)}
                            style={{ display: "none" }}
                          />
                          {state.previews.length > 0 ? (
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 600 }}>+ Bu öğüne fotoğraf ekle</p>
                              <p className="text-mt-muted" style={{ fontSize: 12, marginTop: 4 }}>
                                {state.previews.length} fotoğraf · {mealCalories(state)} kcal
                              </p>
                            </div>
                          ) : (
                            <div>
                              <div className="flex justify-center" style={{ marginBottom: 16 }}>
                                <div className="bg-mt-accent4/10 flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 14 }}>
                                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" className="text-mt-accent4">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                  </svg>
                                </div>
                              </div>
                              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{meal.label} fotoğrafı yükle</p>
                              <p className="text-mt-muted" style={{ fontSize: 12 }}>
                                Birden fazla seçebilirsiniz — Gemini Vision her birini ayrı analiz eder
                              </p>
                              <p className="text-mt-muted" style={{ fontSize: 10, marginTop: 10 }}>PNG, JPG, HEIC, WebP — Maks 10MB</p>
                            </div>
                          )}
                        </div>

                        {/* Status */}
                        {state.analyzing && (
                          <div className="flex items-center bg-mt-accent4/8 border border-mt-accent4/20" style={{ padding: "14px 20px", borderRadius: 12, marginTop: 16, gap: 12 }}>
                            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="var(--mt-accent4)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span className="text-mt-accent4" style={{ fontSize: 13, fontWeight: 500 }}>
                              {state.progress || `${meal.label} fotoğrafları analiz ediliyor...`}
                            </span>
                          </div>
                        )}

                        {state.error && (
                          <div className="bg-mt-accent3/10 border border-mt-accent3/20 text-mt-accent3" style={{ padding: "14px 20px", borderRadius: 12, marginTop: 16, fontSize: 13 }}>
                            {state.error}
                          </div>
                        )}

                        {/* Per-meal results */}
                        {state.results.map((result, idx) => (
                          <div key={idx} className="bg-mt-surface2 border border-mt-border" style={{ borderRadius: 14, padding: 22, marginTop: 14 }}>
                            <div className="flex items-center" style={{ gap: 12, marginBottom: 14 }}>
                              <div className="bg-mt-accent4/15 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 9 }}>
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" className="text-mt-accent4">
                                  <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
                                </svg>
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 13, fontWeight: 700 }}>{result.item_name || `${meal.label} #${idx + 1}`}</p>
                                <p className="text-mt-muted" style={{ fontSize: 10 }}>Gemini Vision</p>
                              </div>
                              {result.estimated_calories != null && (
                                <span className="text-mt-warn" style={{ fontSize: 16, fontWeight: 800 }}>
                                  {result.estimated_calories} <span style={{ fontSize: 10, fontWeight: 400 }}>kcal</span>
                                </span>
                              )}
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {result.category && (
                                <div className="flex justify-between" style={{ paddingBottom: 8, borderBottom: "1px solid var(--mt-border)" }}>
                                  <span className="text-mt-text2" style={{ fontSize: 12 }}>Kategori</span>
                                  <span className="text-mt-accent4" style={{ fontSize: 12, fontWeight: 600 }}>
                                    {result.category === "food" ? "Yiyecek" : result.category === "drink" ? "İçecek" : "Diğer"}
                                  </span>
                                </div>
                              )}
                              {result.caffeine_mg != null && (
                                <div className="flex justify-between" style={{ paddingBottom: 8, borderBottom: "1px solid var(--mt-border)" }}>
                                  <span className="text-mt-text2" style={{ fontSize: 12 }}>Kafein</span>
                                  <span className="text-mt-accent2" style={{ fontSize: 12, fontWeight: 700 }}>{result.caffeine_mg} mg</span>
                                </div>
                              )}
                              {result.nutrients && (
                                <div style={{ paddingBottom: 8, borderBottom: "1px solid var(--mt-border)" }}>
                                  <span className="text-mt-text2 block" style={{ fontSize: 12, marginBottom: 6 }}>Besin Değerleri</span>
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                    {Object.entries(result.nutrients).map(([key, val]) => (
                                      <div key={key} className="flex justify-between bg-mt-surface border border-mt-border" style={{ padding: "5px 10px", borderRadius: 7 }}>
                                        <span className="text-mt-muted" style={{ fontSize: 10 }}>{key.replace(/_/g, " ").replace(" g", "")}</span>
                                        <span style={{ fontSize: 10, fontWeight: 700 }}>{val}g</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {result.description && (
                                <p className="text-mt-text2" style={{ fontSize: 12, lineHeight: 1.55 }}>{result.description}</p>
                              )}
                              {result.health_notes && (
                                <div className="bg-mt-accent/8 border border-mt-accent/15" style={{ padding: "8px 12px", borderRadius: 9 }}>
                                  <p className="text-mt-accent" style={{ fontSize: 11, lineHeight: 1.5 }}>{result.health_notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Per-meal summary footer */}
                  {totalPhotos > 0 && (
                    <div className="bg-mt-surface2 border border-mt-border" style={{ borderRadius: 12, padding: 16, marginTop: 20 }}>
                      <p className="text-mt-muted" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, marginBottom: 10 }}>ÖĞÜN DAĞILIMI</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
                        {MEALS.map((meal) => {
                          const m = meals[meal.key];
                          const cals = mealCalories(m);
                          return (
                            <div key={meal.key} className="bg-mt-surface border border-mt-border" style={{ padding: "10px 12px", borderRadius: 10 }}>
                              <p style={{ fontSize: 11, color: "var(--mt-muted)" }}>
                                <span style={{ marginRight: 4 }}>{meal.emoji}</span>
                                {meal.label}
                              </p>
                              <p style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: cals > 0 ? "var(--mt-warn)" : "var(--mt-muted)" }}>
                                {cals > 0 ? `${cals} kcal` : "—"}
                              </p>
                              <p style={{ fontSize: 10, color: "var(--mt-muted)", marginTop: 2 }}>
                                {m.previews.length} fotoğraf
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* ═══ Semptom Metin Analizi ═══ */}
                <div className="bg-mt-surface border border-mt-border mt-card" style={{ borderRadius: 16, padding: 36 }}>
                  <h2 className="flex items-center" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, gap: 16 }}>
                    <div className="bg-mt-purple/10 flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 12 }}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" className="text-mt-purple">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    Semptom Metni
                  </h2>
                  <p className="text-mt-muted" style={{ fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                    Bugün hissettiklerinizi kendi cümlelerinizle yazın — AI semptomları otomatik tespit edip kategorize edecek.
                  </p>

                  <textarea
                    value={symptomText}
                    onChange={(e) => setSymptomText(e.target.value)}
                    maxLength={2000}
                    rows={5}
                    className="w-full bg-mt-surface2 border border-mt-border text-mt-text placeholder:text-mt-muted resize-y"
                    style={{ borderRadius: 12, padding: "16px 20px", fontSize: 14, lineHeight: 1.7 }}
                    placeholder="Örnek: Sabah uyandığımdan beri başım çok ağrıyor, midem bulanıyor ve halsizim. Geçen geceki kötü uykudan dolayı olabilir."
                  />
                  <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
                    <p className="text-mt-muted" style={{ fontSize: 11 }}>{symptomText.length}/2000</p>
                    <button
                      type="button"
                      onClick={handleAnalyzeSymptom}
                      disabled={symptomAnalyzing || symptomText.trim().length < 3}
                      className="bg-mt-purple text-white font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center"
                      style={{ height: 42, padding: "0 22px", borderRadius: 10, fontSize: 13, gap: 10 }}
                    >
                      {symptomAnalyzing ? (
                        <>
                          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Analiz ediliyor...
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path d="M9.663 17h4.673M12 3v1M3.34 7h.01M20.66 7h-.01M5.35 19l.78-.78M18.65 19l-.78-.78M12 21v-1M19 12h1M4 12H3M7.05 4.05l.78.78M16.95 4.05l-.78.78" />
                          </svg>
                          AI ile Analiz Et
                        </>
                      )}
                    </button>
                  </div>

                  {symptomError && (
                    <div className="bg-mt-accent3/10 border border-mt-accent3/20 text-mt-accent3" style={{ padding: "14px 20px", borderRadius: 12, marginTop: 16, fontSize: 13 }}>
                      {symptomError}
                    </div>
                  )}

                  {symptomResult && !symptomAnalyzing && (
                    <div className="bg-mt-surface2 border border-mt-border" style={{ borderRadius: 16, padding: 24, marginTop: 20 }}>
                      <div className="flex items-center" style={{ gap: 12, marginBottom: 16 }}>
                        <div className="bg-mt-purple/15 flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10 }}>
                          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" className="text-mt-purple">
                            <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
                          </svg>
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700 }}>AI Semptom Analizi</p>
                          <p className="text-mt-muted" style={{ fontSize: 11 }}>Gemini 2.5 Flash</p>
                        </div>
                      </div>

                      {symptomResult.summary && (
                        <p className="text-mt-text2" style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>{symptomResult.summary}</p>
                      )}

                      {symptomResult.symptoms && symptomResult.symptoms.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <p className="text-mt-muted" style={{ fontSize: 11, marginBottom: 10, letterSpacing: 0.5 }}>TESPİT EDİLEN SEMPTOMLAR</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {symptomResult.symptoms.map((sym, i) => (
                              <div key={i} className="bg-mt-surface border border-mt-border" style={{ padding: "12px 16px", borderRadius: 10 }}>
                                <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                                  <span style={{ fontSize: 13, fontWeight: 600 }}>{sym.name}</span>
                                  {sym.severity && (
                                    <span
                                      className="border"
                                      style={{
                                        fontSize: 10,
                                        padding: "3px 10px",
                                        borderRadius: 6,
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: 0.5,
                                        color: sym.severity === "şiddetli" ? "var(--mt-accent3)" : sym.severity === "orta" ? "var(--mt-warn)" : "var(--mt-accent4)",
                                        borderColor: sym.severity === "şiddetli" ? "var(--mt-accent3)" : sym.severity === "orta" ? "var(--mt-warn)" : "var(--mt-accent4)",
                                      }}
                                    >
                                      {sym.severity}
                                    </span>
                                  )}
                                </div>
                                <div className="flex" style={{ gap: 16, fontSize: 11 }} >
                                  {sym.body_region && (
                                    <span className="text-mt-muted">📍 {sym.body_region}</span>
                                  )}
                                  {sym.duration && (
                                    <span className="text-mt-muted">⏱ {sym.duration}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {symptomResult.suggested_categories && symptomResult.suggested_categories.length > 0 && (
                        <div>
                          <p className="text-mt-muted" style={{ fontSize: 11, marginBottom: 10, letterSpacing: 0.5 }}>KATEGORİLER</p>
                          <div className="flex flex-wrap" style={{ gap: 8 }}>
                            {symptomResult.suggested_categories.map((cat, i) => (
                              <span key={i} className="bg-mt-purple/10 text-mt-purple border border-mt-purple/30" style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
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
                      ...(totalPhotos > 0 ? [{ label: "Beslenme", value: `${totalPhotos} fotoğraf · ${totalCalories} kcal`, color: "var(--mt-warn)" }] : []),
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

                  <div style={{ marginTop: 32 }}>
                    <Button type="submit" loading={submitting} fullWidth size="lg" iconLeft={<Icon.Sparkle />}>
                      {submitting ? "Kaydediliyor…" : "Günlük Kaydı Oluştur"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
