import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

interface HealthData {
  id: number;
  date: string;
  pain_level: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  stress_level: number | null;
  mood: string | null;
  notes: string | null;
}

const moodLabels: Record<string, string> = {
  very_bad: "Çok Kötü",
  bad: "Kötü",
  neutral: "Normal",
  good: "İyi",
  very_good: "Çok İyi",
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function DashboardScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [data, setData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const result = await api.getHealthData();
      setData(result || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDelete = (id: number) => {
    Alert.alert("Sil", "Bu kaydı silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          await api.deleteHealthData(id);
          setData((prev) => prev.filter((d) => d.id !== id));
        },
      },
    ]);
  };

  const handleLogout = () => {
    logout();
  };

  const renderItem = ({ item }: { item: HealthData }) => (
    <View style={styles.card}>
      <Text style={styles.cardDate}>{item.date}</Text>
      <View style={styles.cardDetails}>
        {item.pain_level !== null && (
          <Text style={styles.cardDetail}>Ağrı: {item.pain_level}/10</Text>
        )}
        {item.sleep_hours !== null && (
          <Text style={styles.cardDetail}>Uyku: {item.sleep_hours} saat</Text>
        )}
        {item.sleep_quality !== null && (
          <Text style={styles.cardDetail}>Uyku Kalitesi: {item.sleep_quality}/5</Text>
        )}
        {item.stress_level !== null && (
          <Text style={styles.cardDetail}>Stres: {item.stress_level}/10</Text>
        )}
        {item.mood && (
          <Text style={styles.cardDetail}>
            Ruh Hali: {moodLabels[item.mood] || item.mood}
          </Text>
        )}
      </View>
      {item.notes && <Text style={styles.cardNotes}>{item.notes}</Text>}
      <TouchableOpacity onPress={() => handleDelete(item.id)}>
        <Text style={styles.deleteText}>Sil</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Sağlık Günlüğüm</Text>
          <Text style={styles.headerSubtitle}>Merhaba, {user?.full_name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#2563eb" />
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Henüz sağlık kaydınız bulunmuyor.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("NewHealthData")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  headerSubtitle: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  logoutText: { color: "#ef4444", fontSize: 14 },
  list: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardDate: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 8 },
  cardDetails: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cardDetail: { fontSize: 13, color: "#6b7280" },
  cardNotes: { fontSize: 13, color: "#9ca3af", marginTop: 8 },
  deleteText: { color: "#ef4444", fontSize: 13, marginTop: 8 },
  loader: { flex: 1, justifyContent: "center" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#6b7280", fontSize: 15 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  fabText: { color: "#fff", fontSize: 28, fontWeight: "300", marginTop: -2 },
});
