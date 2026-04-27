import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import Slider from "@react-native-community/slider";
import { launchImageLibrary, launchCamera, type Asset } from "react-native-image-picker";
import { api } from "../lib/api";
import { useTheme } from "../context/ThemeContext";
import type { ThemeColors } from "../lib/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Props = { navigation: NativeStackNavigationProp<any> };

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
  { id: "head", label: "Baş" },
  { id: "neck", label: "Boyun" },
  { id: "chest", label: "Göğüs" },
  { id: "back", label: "Sırt" },
  { id: "stomach", label: "Karın" },
  { id: "left_arm", label: "Sol Kol" },
  { id: "right_arm", label: "Sağ Kol" },
  { id: "left_leg", label: "Sol Bacak" },
  { id: "right_leg", label: "Sağ Bacak" },
];

function painColor(v: number, c: ThemeColors) {
  if (v >= 7) return c.accent3;
  if (v >= 4) return c.warn;
  return c.accent4;
}

function stressColor(v: number, c: ThemeColors) {
  if (v >= 7) return c.accent3;
  if (v >= 5) return c.warn;
  return c.accent4;
}

export default function NewHealthDataScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const today = new Date().toISOString().split("T")[0];
  const todayFormatted = new Date().toLocaleDateString("tr-TR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

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
  const [loading, setLoading] = useState(false);

  // Beslenme — öğün bazlı
  type MealKey = "breakfast" | "lunch" | "dinner" | "snack";
  type MealAnalysis = {
    category?: string;
    item_name?: string;
    estimated_calories?: number | null;
    caffeine_mg?: number | null;
    description?: string;
    health_notes?: string | null;
  };
  type MealState = { uris: string[]; results: MealAnalysis[]; analyzing: boolean; error: string };
  const emptyMeal = (): MealState => ({ uris: [], results: [], analyzing: false, error: "" });

  const MEALS: { key: MealKey; label: string; emoji: string }[] = [
    { key: "breakfast", label: "Kahvaltı", emoji: "🥐" },
    { key: "lunch", label: "Öğle", emoji: "🥗" },
    { key: "dinner", label: "Akşam", emoji: "🍲" },
    { key: "snack", label: "Atıştırmalık", emoji: "☕" },
  ];

  const [meals, setMeals] = useState<Record<MealKey, MealState>>({
    breakfast: emptyMeal(),
    lunch: emptyMeal(),
    dinner: emptyMeal(),
    snack: emptyMeal(),
  });
  const [activeMeal, setActiveMeal] = useState<MealKey>("breakfast");

  const mealCalories = (m: MealState) =>
    m.results.reduce((sum, r) => sum + (r.estimated_calories || 0), 0);

  const uploadAssets = async (mealKey: MealKey, assets: Asset[]) => {
    const valid = assets.filter((a) => a.uri && a.fileName && a.type);
    if (valid.length === 0) return;

    const uris = valid.map((a) => a.uri!);
    setMeals((prev) => ({
      ...prev,
      [mealKey]: { ...prev[mealKey], uris: [...prev[mealKey].uris, ...uris], analyzing: true, error: "" },
    }));

    try {
      const payload = valid.map((a) => ({
        uri: a.uri!,
        fileName: a.fileName!,
        mimeType: a.type!,
      }));
      const results = await api.bulkUploadAndAnalyzeImages(payload, { mealType: mealKey });
      const mapped: MealAnalysis[] = (results as any[]).map((r) => ({
        category: r.category,
        item_name: r.analysis_result?.item_name,
        estimated_calories: r.analysis_result?.estimated_calories,
        caffeine_mg: r.analysis_result?.caffeine_mg,
        description: r.analysis_result?.description,
        health_notes: r.analysis_result?.health_notes,
      }));
      setMeals((prev) => ({
        ...prev,
        [mealKey]: { ...prev[mealKey], results: [...prev[mealKey].results, ...mapped], analyzing: false },
      }));
    } catch (err: any) {
      setMeals((prev) => ({
        ...prev,
        [mealKey]: {
          ...prev[mealKey],
          uris: prev[mealKey].uris.slice(0, prev[mealKey].uris.length - uris.length),
          analyzing: false,
          error: err?.message || "Görsel analizi başarısız",
        },
      }));
    }
  };

  const pickFromLibrary = async (mealKey: MealKey) => {
    const res = await launchImageLibrary({
      mediaType: "photo",
      selectionLimit: 0,
      quality: 0.8,
    });
    if (res.didCancel || !res.assets) return;
    await uploadAssets(mealKey, res.assets);
  };

  const pickFromCamera = async (mealKey: MealKey) => {
    const res = await launchCamera({
      mediaType: "photo",
      quality: 0.8,
      saveToPhotos: false,
    });
    if (res.didCancel || !res.assets) return;
    await uploadAssets(mealKey, res.assets);
  };

  const promptPickSource = (mealKey: MealKey, mealLabel: string) => {
    Alert.alert(`${mealLabel} fotoğrafı`, "Kaynak seçin", [
      { text: "Kamera", onPress: () => pickFromCamera(mealKey) },
      { text: "Galeri", onPress: () => pickFromLibrary(mealKey) },
      { text: "Vazgeç", style: "cancel" },
    ]);
  };
  const totalCalories = (Object.values(meals) as MealState[]).reduce(
    (sum, m) => sum + mealCalories(m),
    0,
  );
  const totalPhotos = (Object.values(meals) as MealState[]).reduce(
    (sum, m) => sum + m.uris.length,
    0,
  );

  // Semptom metin analizi
  const [symptomText, setSymptomText] = useState("");
  const [symptomAnalyzing, setSymptomAnalyzing] = useState(false);
  const [symptomError, setSymptomError] = useState("");
  const [symptomResult, setSymptomResult] = useState<{
    symptoms?: { name: string; severity?: string | null; body_region?: string | null; duration?: string | null }[];
    summary?: string;
    suggested_categories?: string[];
  } | null>(null);

  const handleAnalyzeSymptom = async () => {
    if (!symptomText.trim() || symptomText.trim().length < 3) {
      setSymptomError("En az 3 karakter girin");
      return;
    }
    setSymptomError("");
    setSymptomAnalyzing(true);
    try {
      const result = await api.createSymptom({ text: symptomText.trim(), date: today });
      setSymptomResult(result.detected_symptoms);
    } catch (err: any) {
      setSymptomError(err?.message || "Semptom analizi başarısız");
    } finally {
      setSymptomAnalyzing(false);
    }
  };

  const toggleBodyRegion = (regionId: string) => {
    setSelectedBodyRegions((prev) =>
      prev.includes(regionId)
        ? prev.filter((r) => r !== regionId)
        : [...prev, regionId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        date: today, pain_level: painLevel, sleep_hours: sleepHours,
        sleep_quality: sleepQuality, stress_level: stressLevel,
        water_intake: waterIntake, activity_minutes: activityMinutes,
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
      await api.createHealthData(payload);
      navigation.goBack();
    } catch {
      Alert.alert("Hata", "Kayıt oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const s = useMemo(() => createStyles(colors), [colors]);
  const pc = painColor(painLevel, colors);
  const sc = stressColor(stressLevel, colors);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.dateBar}>
        <Text style={s.dateText}>{todayFormatted}</Text>
      </View>

      {/* ═══ Davranışsal Veriler ═══ */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Davranışsal Veriler</Text>

        {/* Uyku */}
        <View style={s.sliderGroup}>
          <View style={s.sliderHeader}>
            <Text style={s.sliderLabel}>UYKU</Text>
            <Text style={[s.sliderValue, { color: colors.accent }]}>
              {sleepHours.toFixed(1)}<Text style={s.sliderUnit}> sa</Text>
            </Text>
          </View>
          <Slider style={s.slider} minimumValue={0} maximumValue={12} step={0.5}
            value={sleepHours} onValueChange={setSleepHours}
            minimumTrackTintColor={colors.accent} maximumTrackTintColor={colors.border} thumbTintColor={colors.accent} />
        </View>

        {/* Stres */}
        <View style={s.sliderGroup}>
          <View style={s.sliderHeader}>
            <Text style={s.sliderLabel}>STRES</Text>
            <Text style={[s.sliderValue, { color: sc }]}>
              {stressLevel}<Text style={s.sliderUnit}>/10</Text>
            </Text>
          </View>
          <Slider style={s.slider} minimumValue={1} maximumValue={10} step={1}
            value={stressLevel} onValueChange={(v: number) => setStressLevel(Math.round(v))}
            minimumTrackTintColor={sc} maximumTrackTintColor={colors.border} thumbTintColor={sc} />
        </View>

        {/* Uyku Kalitesi */}
        <View style={s.sliderGroup}>
          <View style={s.sliderHeader}>
            <Text style={s.sliderLabel}>UYKU KALİTESİ</Text>
            <Text style={[s.sliderValue, { color: colors.purple }]}>
              {sleepQuality}<Text style={s.sliderUnit}>/5</Text>
            </Text>
          </View>
          <Slider style={s.slider} minimumValue={1} maximumValue={5} step={1}
            value={sleepQuality} onValueChange={(v: number) => setSleepQuality(Math.round(v))}
            minimumTrackTintColor={colors.purple} maximumTrackTintColor={colors.border} thumbTintColor={colors.purple} />
        </View>

        {/* Su Tüketimi */}
        <View style={s.sliderGroup}>
          <View style={s.sliderHeader}>
            <Text style={s.sliderLabel}>SU TÜKETİMİ</Text>
            <Text style={[s.sliderValue, { color: colors.accent2 }]}>
              {waterIntake.toFixed(1)}<Text style={s.sliderUnit}> L</Text>
            </Text>
          </View>
          <Slider style={s.slider} minimumValue={0} maximumValue={12} step={0.5}
            value={waterIntake} onValueChange={setWaterIntake}
            minimumTrackTintColor={colors.accent2} maximumTrackTintColor={colors.border} thumbTintColor={colors.accent2} />
        </View>

        {/* Günlük Aktivite */}
        <View style={s.sliderGroup}>
          <View style={s.sliderHeader}>
            <Text style={s.sliderLabel}>GÜNLÜK AKTİVİTE</Text>
            <Text style={[s.sliderValue, { color: colors.accent4 }]}>
              {activityMinutes}<Text style={s.sliderUnit}> dk</Text>
            </Text>
          </View>
          <Slider style={s.slider} minimumValue={0} maximumValue={180} step={5}
            value={activityMinutes} onValueChange={(v: number) => setActivityMinutes(Math.round(v))}
            minimumTrackTintColor={colors.accent4} maximumTrackTintColor={colors.border} thumbTintColor={colors.accent4} />
        </View>

        {/* Günün Yoğunluğu */}
        <View style={s.sliderGroup}>
          <View style={s.sliderHeader}>
            <Text style={s.sliderLabel}>GÜNÜN YOĞUNLUĞU</Text>
            <Text style={[s.sliderValue, { color: colors.warn }]}>
              {dayIntensity}<Text style={s.sliderUnit}>/10</Text>
            </Text>
          </View>
          <Slider style={s.slider} minimumValue={1} maximumValue={10} step={1}
            value={dayIntensity} onValueChange={(v: number) => setDayIntensity(Math.round(v))}
            minimumTrackTintColor={colors.warn} maximumTrackTintColor={colors.border} thumbTintColor={colors.warn} />
        </View>
      </View>

      {/* ═══ Semptomlar ═══ */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Semptomlar</Text>

        {/* Ağrı Şiddeti */}
        <View style={s.sliderGroup}>
          <View style={s.sliderHeader}>
            <Text style={s.sliderLabel}>AĞRI ŞİDDETİ</Text>
            <Text style={[s.sliderValue, { color: pc }]}>
              {painLevel}<Text style={s.sliderUnit}>/10</Text>
            </Text>
          </View>
          <Slider style={s.slider} minimumValue={0} maximumValue={10} step={1}
            value={painLevel} onValueChange={(v: number) => setPainLevel(Math.round(v))}
            minimumTrackTintColor={pc} maximumTrackTintColor={colors.border} thumbTintColor={pc} />
        </View>

        {/* Ağrı Türü */}
        <Text style={[s.sliderLabel, { marginTop: 14, marginBottom: 10 }]}>AĞRI TÜRÜ</Text>
        <View style={s.chipRow}>
          {painTypeOptions.map((pt) => {
            const active = painType === pt.value;
            return (
              <TouchableOpacity key={pt.value}
                style={[s.chip, active && { backgroundColor: colors.accent3 + "20", borderColor: colors.accent3 }]}
                onPress={() => setPainType(active ? "" : pt.value)} activeOpacity={0.7}>
                <Text style={[s.chipText, active && { color: colors.accent3, fontWeight: "600" }]}>{pt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Ağrı Bölgesi */}
        <Text style={[s.sliderLabel, { marginTop: 20, marginBottom: 10 }]}>AĞRI BÖLGESİ</Text>
        <View style={s.bodyMapContainer}>
          <View style={s.chipRow}>
            {bodyRegions.map((region) => {
              const active = selectedBodyRegions.includes(region.id);
              return (
                <TouchableOpacity key={region.id}
                  style={[s.chip, active && { backgroundColor: colors.accent3 + "20", borderColor: colors.accent3 }]}
                  onPress={() => toggleBodyRegion(region.id)} activeOpacity={0.7}>
                  <Text style={[s.chipText, active && { color: colors.accent3, fontWeight: "600" }]}>{region.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedBodyRegions.length > 0 && (
            <TextInput
              style={[s.textArea, { marginTop: 12, minHeight: 60 }]}
              value={bodyMapNotes}
              onChangeText={setBodyMapNotes}
              placeholder="Ağrı hakkında detay ekleyebilirsiniz..."
              placeholderTextColor={colors.muted + "80"}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
          )}
        </View>

        {/* Ruh Hali */}
        <Text style={[s.sliderLabel, { marginTop: 20, marginBottom: 10 }]}>RUH HALİ</Text>
        <View style={s.moodRow}>
          {moodOptions.map((m) => {
            const active = mood === m.value;
            return (
              <TouchableOpacity key={m.value}
                style={[s.moodChip, active && { backgroundColor: colors.accent + "14", borderColor: colors.accent }]}
                onPress={() => setMood(active ? "" : m.value)} activeOpacity={0.7}>
                <Text style={{ fontSize: 18, marginBottom: 2 }}>{m.emoji}</Text>
                <Text style={[s.moodChipText, active && { color: colors.accent, fontWeight: "600" }]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notlar */}
        <Text style={[s.sliderLabel, { marginTop: 20, marginBottom: 8 }]}>NOTLAR</Text>
        <TextInput style={s.textArea} value={notes} onChangeText={setNotes}
          placeholder="Bugün nasıl hissediyorsunuz? Ek bilgi ekleyebilirsiniz..."
          placeholderTextColor={colors.muted + "80"} multiline numberOfLines={3} maxLength={1000} textAlignVertical="top" />
      </View>

      {/* ═══ Beslenme — Öğün Bazlı ═══ */}
      <View style={s.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={s.cardTitle}>Beslenme — Öğünler</Text>
          {totalPhotos > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.warn + "14", borderWidth: 1, borderColor: colors.warn + "30", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
              <Text style={{ fontSize: 10, fontWeight: "600", color: colors.text2 }}>Toplam</Text>
              <Text style={{ fontSize: 13, fontWeight: "800", color: colors.warn }}>{totalCalories} kcal</Text>
            </View>
          )}
        </View>

        {/* Meal Tabs */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {MEALS.map((m) => {
            const state = meals[m.key];
            const cals = mealCalories(state);
            const isActive = activeMeal === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                onPress={() => setActiveMeal(m.key)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  borderWidth: 1,
                  backgroundColor: isActive ? colors.accent4 : colors.surface2,
                  borderColor: isActive ? colors.accent4 : colors.border,
                }}
              >
                <Text style={{ fontSize: 14 }}>{m.emoji}</Text>
                <Text style={{ fontSize: 12, fontWeight: "600", color: isActive ? "#0A0E1A" : colors.text2 }}>{m.label}</Text>
                {state.uris.length > 0 && (
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: isActive ? "rgba(0,0,0,0.18)" : colors.surface3 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: isActive ? "#0A0E1A" : colors.text }}>
                      {state.uris.length}{cals > 0 ? `·${cals}` : ""}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Active Meal Panel */}
        {(() => {
          const meal = MEALS.find((m) => m.key === activeMeal)!;
          const state = meals[activeMeal];
          return (
            <View>
              {state.uris.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {state.uris.map((uri, i) => (
                    <View key={i} style={{ position: "relative" }}>
                      <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: colors.border }} />
                      <TouchableOpacity
                        onPress={() => {
                          setMeals((prev) => ({
                            ...prev,
                            [activeMeal]: {
                              ...prev[activeMeal],
                              uris: prev[activeMeal].uris.filter((_, idx) => idx !== i),
                              results: prev[activeMeal].results.filter((_, idx) => idx !== i),
                            },
                          }));
                        }}
                        style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.accent3, alignItems: "center", justifyContent: "center" }}
                      >
                        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[s.photoUpload, state.analyzing && { opacity: 0.5 }]}
                activeOpacity={0.7}
                disabled={state.analyzing}
                onPress={() => promptPickSource(activeMeal, meal.label)}
              >
                <Text style={[s.photoUploadIcon, { color: colors.accent4 }]}>📷</Text>
                <Text style={s.photoUploadTitle}>
                  {state.uris.length > 0 ? `+ ${meal.label} fotoğrafı ekle` : `${meal.emoji} ${meal.label} fotoğrafı yükle`}
                </Text>
                <Text style={s.photoUploadDesc}>
                  {state.uris.length > 0
                    ? `${state.uris.length} fotoğraf · ${mealCalories(state)} kcal`
                    : "Birden fazla seçebilirsiniz — Gemini Vision her birini ayrı analiz eder"}
                </Text>
              </TouchableOpacity>

              {state.analyzing && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.accent4 + "14", borderWidth: 1, borderColor: colors.accent4 + "30", borderRadius: 8, padding: 12, marginTop: 10 }}>
                  <ActivityIndicator size="small" color={colors.accent4} />
                  <Text style={{ fontSize: 13, color: colors.accent4, fontWeight: "500" }}>
                    {meal.label} analiz ediliyor...
                  </Text>
                </View>
              )}

              {state.error !== "" && (
                <View style={{ backgroundColor: colors.accent3 + "14", borderWidth: 1, borderColor: colors.accent3 + "30", borderRadius: 8, padding: 12, marginTop: 10 }}>
                  <Text style={{ fontSize: 12, color: colors.accent3 }}>{state.error}</Text>
                </View>
              )}

              {state.results.map((result, idx) => (
                <View key={idx} style={{ backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, marginTop: 10 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>{result.item_name || `${meal.label} #${idx + 1}`}</Text>
                    {result.estimated_calories != null && (
                      <Text style={{ fontSize: 15, fontWeight: "800", color: colors.warn }}>{result.estimated_calories} kcal</Text>
                    )}
                  </View>
                  {result.category && (
                    <Text style={{ fontSize: 11, color: colors.accent4, fontWeight: "600", marginBottom: 4 }}>
                      {result.category === "food" ? "Yiyecek" : result.category === "drink" ? "İçecek" : "Diğer"}
                    </Text>
                  )}
                  {result.caffeine_mg != null && (
                    <Text style={{ fontSize: 11, color: colors.accent2, fontWeight: "600", marginBottom: 4 }}>Kafein: {result.caffeine_mg} mg</Text>
                  )}
                  {result.description && (
                    <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18, marginTop: 4 }}>{result.description}</Text>
                  )}
                  {result.health_notes && (
                    <View style={{ backgroundColor: colors.accent + "0D", borderRadius: 6, padding: 8, marginTop: 6 }}>
                      <Text style={{ fontSize: 11, color: colors.accent, lineHeight: 16 }}>{result.health_notes}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          );
        })()}

        {/* Per-meal summary footer */}
        {totalPhotos > 0 && (
          <View style={{ marginTop: 14, padding: 12, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 10 }}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: colors.muted, letterSpacing: 0.5, marginBottom: 8 }}>ÖĞÜN DAĞILIMI</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {MEALS.map((m) => {
                const cals = mealCalories(meals[m.key]);
                return (
                  <View key={m.key} style={{ flex: 1, minWidth: 80, padding: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}>
                    <Text style={{ fontSize: 10, color: colors.muted }}>{m.emoji} {m.label}</Text>
                    <Text style={{ fontSize: 13, fontWeight: "700", marginTop: 2, color: cals > 0 ? colors.warn : colors.muted }}>
                      {cals > 0 ? `${cals} kcal` : "—"}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* ═══ Semptom Metni ═══ */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Semptom Metni</Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 10, lineHeight: 17 }}>
          Bugün hissettiklerinizi yazın — AI semptomları otomatik tespit edecek.
        </Text>

        <TextInput
          style={[s.textArea, { minHeight: 90 }]}
          value={symptomText}
          onChangeText={setSymptomText}
          placeholder="Örnek: Sabahtan beri başım ağrıyor, midem bulanıyor..."
          placeholderTextColor={colors.muted + "80"}
          multiline
          maxLength={2000}
          textAlignVertical="top"
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <Text style={{ fontSize: 10, color: colors.muted }}>{symptomText.length}/2000</Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.purple,
              paddingHorizontal: 16,
              paddingVertical: 9,
              borderRadius: 8,
              opacity: symptomAnalyzing || symptomText.trim().length < 3 ? 0.4 : 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
            onPress={handleAnalyzeSymptom}
            disabled={symptomAnalyzing || symptomText.trim().length < 3}
            activeOpacity={0.8}
          >
            {symptomAnalyzing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>AI ile Analiz Et</Text>
            )}
          </TouchableOpacity>
        </View>

        {symptomError !== "" && (
          <View style={{ backgroundColor: colors.accent3 + "14", borderWidth: 1, borderColor: colors.accent3 + "30", borderRadius: 8, padding: 12, marginTop: 10 }}>
            <Text style={{ fontSize: 12, color: colors.accent3 }}>{symptomError}</Text>
          </View>
        )}

        {symptomResult && !symptomAnalyzing && (
          <View style={{ backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, marginTop: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text, marginBottom: 8 }}>AI Semptom Analizi</Text>

            {symptomResult.summary && (
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18, marginBottom: 12 }}>{symptomResult.summary}</Text>
            )}

            {symptomResult.symptoms && symptomResult.symptoms.length > 0 && (
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 10, color: colors.muted, letterSpacing: 0.8, marginBottom: 6 }}>TESPİT EDİLEN SEMPTOMLAR</Text>
                {symptomResult.symptoms.map((sym, i) => {
                  const sevColor =
                    sym.severity === "şiddetli" ? colors.accent3 :
                    sym.severity === "orta" ? colors.warn :
                    colors.accent4;
                  return (
                    <View key={i} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, marginBottom: 6 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>{sym.name}</Text>
                        {sym.severity && (
                          <Text style={{ fontSize: 9, color: sevColor, fontWeight: "700", letterSpacing: 0.5, borderWidth: 1, borderColor: sevColor, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, textTransform: "uppercase" }}>
                            {sym.severity}
                          </Text>
                        )}
                      </View>
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        {sym.body_region && (
                          <Text style={{ fontSize: 10, color: colors.muted }}>📍 {sym.body_region}</Text>
                        )}
                        {sym.duration && (
                          <Text style={{ fontSize: 10, color: colors.muted }}>⏱ {sym.duration}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {symptomResult.suggested_categories && symptomResult.suggested_categories.length > 0 && (
              <View>
                <Text style={{ fontSize: 10, color: colors.muted, letterSpacing: 0.8, marginBottom: 6 }}>KATEGORİLER</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {symptomResult.suggested_categories.map((cat, i) => (
                    <Text key={i} style={{ fontSize: 10, color: colors.purple, fontWeight: "600", backgroundColor: colors.purple + "1A", borderWidth: 1, borderColor: colors.purple + "40", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      {cat}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ═══ Özet ═══ */}
      <View style={s.summaryCard}>
        <Text style={s.summaryTitle}>KAYIT ÖZETİ</Text>
        {[
          { l: "Ağrı", v: `${painLevel}/10`, c: pc },
          ...(painType ? [{ l: "Ağrı Türü", v: painTypeOptions.find((p) => p.value === painType)?.label || "", c: pc }] : []),
          { l: "Uyku", v: `${sleepHours.toFixed(1)} sa`, c: colors.accent },
          { l: "Kalite", v: `${sleepQuality}/5`, c: colors.purple },
          { l: "Stres", v: `${stressLevel}/10`, c: sc },
          { l: "Su", v: `${waterIntake.toFixed(1)} L`, c: colors.accent2 },
          { l: "Aktivite", v: `${activityMinutes} dk`, c: colors.accent4 },
          { l: "Yoğunluk", v: `${dayIntensity}/10`, c: colors.warn },
          ...(mood ? [{ l: "Ruh Hali", v: moodOptions.find((m) => m.value === mood)?.label || "", c: colors.purple }] : []),
          ...(selectedBodyRegions.length > 0 ? [{ l: "Ağrı Bölgesi", v: `${selectedBodyRegions.length} bölge`, c: pc }] : []),
        ].map((row) => (
          <View key={row.l} style={s.summaryRow}>
            <Text style={s.summaryLabel}>{row.l}</Text>
            <Text style={[s.summaryVal, { color: row.c }]}>{row.v}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[s.submitBtn, loading && s.submitBtnDisabled]}
        onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
        {loading ? <ActivityIndicator color="#000" size="small" /> : <Text style={s.submitBtnText}>Günlük Kaydı Oluştur</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 40 },
    dateBar: { backgroundColor: colors.accent + "0D", borderWidth: 1, borderColor: colors.accent + "30", borderRadius: 8, padding: 10, marginBottom: 12 },
    dateText: { fontSize: 12, color: colors.accent, fontWeight: "500" },
    card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 16, marginBottom: 10 },
    cardTitle: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 14 },
    sliderGroup: { marginBottom: 14 },
    sliderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sliderLabel: { fontSize: 10, color: colors.muted, letterSpacing: 0.8 },
    sliderValue: { fontSize: 16, fontWeight: "800" },
    sliderUnit: { fontSize: 9, fontWeight: "400", color: colors.muted },
    slider: { width: "100%", height: Platform.OS === "ios" ? 30 : 40, marginTop: 4 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: "transparent" },
    chipText: { fontSize: 12, color: colors.muted, fontWeight: "500" },
    bodyMapContainer: { marginBottom: 8 },
    moodRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    moodChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: "transparent", alignItems: "center" },
    moodChipText: { fontSize: 11, color: colors.muted, fontWeight: "500" },
    textArea: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.text, minHeight: 70 },
    photoUpload: { borderWidth: 2, borderStyle: "dashed", borderColor: colors.border, borderRadius: 12, padding: 28, alignItems: "center" },
    photoUploadIcon: { fontSize: 32, marginBottom: 12 },
    photoUploadTitle: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 6 },
    photoUploadDesc: { fontSize: 12, color: colors.muted, textAlign: "center" },
    summaryCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, marginBottom: 14 },
    summaryTitle: { fontSize: 10, color: colors.muted, letterSpacing: 1.2, marginBottom: 10 },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.border },
    summaryLabel: { fontSize: 12, color: colors.muted },
    summaryVal: { fontSize: 12, fontWeight: "700" },
    submitBtn: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 14, alignItems: "center" },
    submitBtnDisabled: { opacity: 0.45 },
    submitBtnText: { color: "#000", fontSize: 14, fontWeight: "700" },
  });
}
