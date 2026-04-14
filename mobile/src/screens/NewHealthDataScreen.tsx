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

      {/* ═══ Beslenme ═══ */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Beslenme</Text>
        <TouchableOpacity style={s.photoUpload} activeOpacity={0.7}>
          <Text style={[s.photoUploadIcon, { color: colors.accent4 }]}>📷</Text>
          <Text style={s.photoUploadTitle}>Beslenme Fotoğrafı Yükle</Text>
          <Text style={s.photoUploadDesc}>Yediğiniz yemeğin fotoğrafını yükleyin — AI ile analiz edilecek</Text>
        </TouchableOpacity>
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
