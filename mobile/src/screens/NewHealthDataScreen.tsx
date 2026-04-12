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
} from "react-native";
import { api } from "../lib/api";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function NewHealthDataScreen({ navigation }: Props) {
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [painLevel, setPainLevel] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState("");
  const [stressLevel, setStressLevel] = useState("");
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const moodOptions = [
    { value: "very_bad", label: "Çok Kötü" },
    { value: "bad", label: "Kötü" },
    { value: "neutral", label: "Normal" },
    { value: "good", label: "İyi" },
    { value: "very_good", label: "Çok İyi" },
  ];

  const handleSubmit = async () => {
    if (!date) {
      Alert.alert("Hata", "Tarih gereklidir");
      return;
    }

    setLoading(true);
    try {
      const data: Record<string, unknown> = { date };

      if (painLevel !== "") data.pain_level = Number(painLevel);
      if (sleepHours !== "") data.sleep_hours = Number(sleepHours);
      if (sleepQuality !== "") data.sleep_quality = Number(sleepQuality);
      if (stressLevel !== "") data.stress_level = Number(stressLevel);
      if (mood !== "") data.mood = mood;
      if (notes.trim() !== "") data.notes = notes.trim();

      await api.createHealthData(data);
      navigation.goBack();
    } catch {
      Alert.alert("Hata", "Kayıt oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Yeni Sağlık Kaydı</Text>

      <Text style={styles.label}>Tarih</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
      />

      <Text style={styles.label}>Ağrı Seviyesi (0-10)</Text>
      <TextInput
        style={styles.input}
        value={painLevel}
        onChangeText={setPainLevel}
        keyboardType="numeric"
        placeholder="0 = Ağrı yok, 10 = Çok şiddetli"
      />

      <Text style={styles.label}>Uyku Süresi (saat)</Text>
      <TextInput
        style={styles.input}
        value={sleepHours}
        onChangeText={setSleepHours}
        keyboardType="numeric"
        placeholder="Örn: 7.5"
      />

      <Text style={styles.label}>Uyku Kalitesi (1-5)</Text>
      <View style={styles.qualityRow}>
        {[1, 2, 3, 4, 5].map((q) => (
          <TouchableOpacity
            key={q}
            style={[
              styles.qualityButton,
              sleepQuality === String(q) && styles.qualityButtonActive,
            ]}
            onPress={() => setSleepQuality(String(q))}
          >
            <Text
              style={[
                styles.qualityText,
                sleepQuality === String(q) && styles.qualityTextActive,
              ]}
            >
              {q}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Stres Seviyesi (0-10)</Text>
      <TextInput
        style={styles.input}
        value={stressLevel}
        onChangeText={setStressLevel}
        keyboardType="numeric"
        placeholder="0 = Stres yok, 10 = Çok stresli"
      />

      <Text style={styles.label}>Ruh Hali</Text>
      <View style={styles.moodRow}>
        {moodOptions.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={[
              styles.moodButton,
              mood === m.value && styles.moodButtonActive,
            ]}
            onPress={() => setMood(m.value)}
          >
            <Text
              style={[
                styles.moodText,
                mood === m.value && styles.moodTextActive,
              ]}
            >
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notlar</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Bugün nasıl hissediyorsunuz?"
        multiline
        numberOfLines={3}
        maxLength={1000}
      />

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Kaydet</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  qualityRow: {
    flexDirection: "row",
    gap: 8,
  },
  qualityButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  qualityButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  qualityText: { fontSize: 14, color: "#374151" },
  qualityTextActive: { color: "#fff", fontWeight: "600" },
  moodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  moodButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  moodButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  moodText: { fontSize: 13, color: "#374151" },
  moodTextActive: { color: "#fff", fontWeight: "600" },
  submitButton: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
