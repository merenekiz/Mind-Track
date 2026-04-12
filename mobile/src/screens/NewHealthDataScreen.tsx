import React, { useState } from "react";
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
} from "react-native";
import Slider from "@react-native-community/slider";
import { api } from "../lib/api";
import { colors } from "../lib/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Props = { navigation: NativeStackNavigationProp<any> };

const moodOptions = [
  { value: "very_bad", label: "Çok Kötü" },
  { value: "bad", label: "Kötü" },
  { value: "neutral", label: "Normal" },
  { value: "good", label: "İyi" },
  { value: "very_good", label: "Çok İyi" },
];

function painColor(v: number) {
  if (v >= 7) return colors.accent3;
  if (v >= 4) return colors.warn;
  return colors.accent4;
}

export default function NewHealthDataScreen({ navigation }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const todayFormatted = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [painLevel, setPainLevel] = useState(0);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [stressLevel, setStressLevel] = useState(5);
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        date: today,
        pain_level: painLevel,
        sleep_hours: sleepHours,
        sleep_quality: sleepQuality,
        stress_level: stressLevel,
      };
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

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Tarih bilgisi */}
      <View style={s.dateBar}>
        <Text style={s.dateText}>{todayFormatted}</Text>
      </View>

      {/* Davranışsal Veriler */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Davranışsal Veriler</Text>

        {/* Uyku */}
        <View style={s.sliderGroup}>
          <View style={s.sliderHeader}>
            <Text style={s.sliderLabel}>UYKU</Text>
            <Text style={[s.sliderValue, { color: colors.accent }]}>
              {sleepHours.toFixed(1)}
              <Text style={s.sliderUnit}> sa</Text>
            </Text>
          </View>
          <Slider
            style={s.slider}
            minimumValue={0}
            maximumValue={12}
            step={0.5}
            value={sleepHours}
            onValueChange={setSleepHours}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.accent}
          />
        </View>

        {/* Stres */}
        <View style={s.sliderGroup}>
          <View style={s.sliderHeader}>
            <Text style={s.sliderLabel}>STRES</Text>
            <Text style={[s.sliderValue, { color: colors.warn }]}>
              {stressLevel}
              <Text style={s.sliderUnit}>/10</Text>
            </Text>
          </View>
          <Slider
            style={s.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={stressLevel}
            onValueChange={(v: number) => setStressLevel(Math.round(v))}
            minimumTrackTintColor={colors.warn}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.warn}
          />
        </View>

        {/* Uyku Kalitesi */}
        <View style={s.sliderGroup}>
          <View style={s.sliderHeader}>
            <Text style={s.sliderLabel}>UYKU KALİTESİ</Text>
            <Text style={[s.sliderValue, { color: colors.accent4 }]}>
              {sleepQuality}
              <Text style={s.sliderUnit}>/5</Text>
            </Text>
          </View>
          <Slider
            style={s.slider}
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={sleepQuality}
            onValueChange={(v: number) => setSleepQuality(Math.round(v))}
            minimumTrackTintColor={colors.accent4}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.accent4}
          />
        </View>
      </View>

      {/* Semptomlar */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Semptomlar</Text>

        {/* Ağrı */}
        <View style={s.sliderGroup}>
          <View style={s.sliderHeader}>
            <Text style={s.sliderLabel}>AĞRI ŞİDDETİ</Text>
            <Text style={[s.sliderValue, { color: painColor(painLevel) }]}>
              {painLevel}
              <Text style={s.sliderUnit}>/10</Text>
            </Text>
          </View>
          <Slider
            style={s.slider}
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={painLevel}
            onValueChange={(v: number) => setPainLevel(Math.round(v))}
            minimumTrackTintColor={painColor(painLevel)}
            maximumTrackTintColor={colors.border}
            thumbTintColor={painColor(painLevel)}
          />
        </View>

        {/* Ruh Hali */}
        <Text style={[s.sliderLabel, { marginTop: 14, marginBottom: 8 }]}>RUH HALİ</Text>
        <View style={s.moodRow}>
          {moodOptions.map((m) => {
            const active = mood === m.value;
            return (
              <TouchableOpacity
                key={m.value}
                style={[s.moodChip, active && s.moodChipActive]}
                onPress={() => setMood(active ? "" : m.value)}
                activeOpacity={0.7}
              >
                <Text style={[s.moodChipText, active && s.moodChipTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notlar */}
        <Text style={[s.sliderLabel, { marginTop: 16, marginBottom: 6 }]}>NOTLAR</Text>
        <TextInput
          style={s.textArea}
          value={notes}
          onChangeText={setNotes}
          placeholder="Bugün nasıl hissediyorsunuz? Ek bilgi ekleyebilirsiniz..."
          placeholderTextColor={colors.muted + "80"}
          multiline
          numberOfLines={3}
          maxLength={1000}
          textAlignVertical="top"
        />
      </View>

      {/* Özet */}
      <View style={s.summaryCard}>
        <Text style={s.summaryTitle}>KAYIT ÖZETİ</Text>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Ağrı</Text>
          <Text style={[s.summaryVal, { color: painColor(painLevel) }]}>{painLevel}/10</Text>
        </View>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Uyku</Text>
          <Text style={[s.summaryVal, { color: colors.accent }]}>{sleepHours.toFixed(1)} sa</Text>
        </View>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Stres</Text>
          <Text style={[s.summaryVal, { color: colors.warn }]}>{stressLevel}/10</Text>
        </View>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Kalite</Text>
          <Text style={[s.summaryVal, { color: colors.accent4 }]}>{sleepQuality}/5</Text>
        </View>
        {mood ? (
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Ruh Hali</Text>
            <Text style={[s.summaryVal, { color: colors.purple }]}>
              {moodOptions.find((m) => m.value === mood)?.label}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Kaydet */}
      <TouchableOpacity
        style={[s.submitBtn, loading && s.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <Text style={s.submitBtnText}>Günlük Kaydı Oluştur</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },

  dateBar: {
    backgroundColor: colors.accent + "0D",
    borderWidth: 1,
    borderColor: colors.accent + "30",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  dateText: { fontSize: 12, color: colors.accent, fontWeight: "500" },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 12 },

  sliderGroup: { marginBottom: 12 },
  sliderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sliderLabel: { fontSize: 10, color: colors.muted, letterSpacing: 0.8 },
  sliderValue: { fontSize: 16, fontWeight: "800" },
  sliderUnit: { fontSize: 9, fontWeight: "400", color: colors.muted },
  slider: { width: "100%", height: Platform.OS === "ios" ? 30 : 40, marginTop: 4 },

  moodRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  moodChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
  },
  moodChipActive: {
    backgroundColor: colors.accent + "14",
    borderColor: colors.accent,
  },
  moodChipText: { fontSize: 12, color: colors.muted, fontWeight: "500" },
  moodChipTextActive: { color: colors.accent, fontWeight: "600" },

  textArea: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
    minHeight: 70,
  },

  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  summaryTitle: { fontSize: 10, color: colors.muted, letterSpacing: 1.2, marginBottom: 10 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: { fontSize: 12, color: colors.muted },
  summaryVal: { fontSize: 12, fontWeight: "700" },

  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { color: "#000", fontSize: 14, fontWeight: "700" },
});
