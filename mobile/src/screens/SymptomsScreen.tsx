import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { spacing, radius, type } from "../lib/theme";

interface DetectedSymptom {
  name: string;
  severity?: string | null;
  body_region?: string | null;
  duration?: string | null;
}

interface Symptom {
  id: number;
  date: string;
  original_text: string;
  detected_symptoms: {
    summary?: string;
    symptoms?: DetectedSymptom[];
    suggested_categories?: string[];
  };
  created_at: string;
}

const REGION_FILTERS = [
  { key: "all", label: "Tümü", match: null },
  { key: "head", label: "Baş", match: /baş|kafa/i },
  { key: "neck", label: "Boyun", match: /boyun|gırtlak|boğaz/i },
  { key: "chest", label: "Göğüs", match: /göğüs|kalp/i },
  { key: "abdomen", label: "Karın", match: /karın|mide|bağırsak/i },
  { key: "back", label: "Sırt", match: /sırt|bel/i },
  { key: "arms", label: "Kollar", match: /kol|el|omuz/i },
  { key: "legs", label: "Bacaklar", match: /bacak|ayak|diz/i },
];

interface Props {
  navigation: { goBack: () => void };
}

export default function SymptomsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [items, setItems] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [region, setRegion] = useState<string>("all");

  const load = useCallback(async () => {
    try {
      const r = await api.getSymptoms();
      setItems(r || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // En çok bildirilen 5 belirti
  const topSymptoms = useMemo(() => {
    const counts = new Map<string, { count: number; severity: string | null }>();
    items.forEach((s) => {
      (s.detected_symptoms?.symptoms || []).forEach((sym) => {
        const key = sym.name.toLowerCase();
        const prev = counts.get(key);
        counts.set(key, {
          count: (prev?.count ?? 0) + 1,
          severity: sym.severity ?? prev?.severity ?? null,
        });
      });
    });
    return Array.from(counts.entries())
      .map(([name, info]) => ({ name, count: info.count, severity: info.severity }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [items]);

  // Bölge filtreli liste
  const filtered = useMemo(() => {
    if (region === "all") return [...items].reverse();
    const cfg = REGION_FILTERS.find((r) => r.key === region);
    if (!cfg?.match) return [...items].reverse();
    return items
      .filter((s) =>
        (s.detected_symptoms?.symptoms || []).some((sym) =>
          cfg.match!.test(sym.body_region || sym.name),
        ),
      )
      .reverse();
  }, [items, region]);

  const handleDelete = (s: Symptom) => {
    Alert.alert("Belirti analizini sil", "Bu kaydı silmek istediğinize emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteSymptom(s.id);
            setItems((prev) => prev.filter((x) => x.id !== s.id));
          } catch (e: any) {
            Alert.alert("Hata", e?.message || "Belirti silinemedi.");
          }
        },
      },
    ]);
  };

  const severityColor = (sev?: string | null) => {
    if (sev === "şiddetli" || sev === "siddetli") return colors.danger;
    if (sev === "orta") return colors.warn;
    return colors.success;
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* AppBar */}
      <View style={styles.appBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: colors.surface2, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={{ color: colors.text2, fontSize: 18, fontWeight: "600" }}>‹</Text>
        </Pressable>
        <Text style={[styles.appBarTitle, { color: colors.text }]}>Belirtiler</Text>
        <View style={styles.iconBtn} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 140, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* En çok bildirilen */}
            {topSymptoms.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.sectionTitle, { color: colors.text3 }]}>EN ÇOK BİLDİRİLEN</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10 }}
                >
                  {topSymptoms.map((t, i) => (
                    <View
                      key={i}
                      style={[
                        styles.topCard,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.topDot,
                          { backgroundColor: severityColor(t.severity) },
                        ]}
                      />
                      <Text style={[styles.topName, { color: colors.text }]} numberOfLines={1}>
                        {t.name}
                      </Text>
                      <Text style={[styles.topCount, { color: colors.text3 }]}>{t.count} kez</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Bölge filtresi */}
            <Text style={[styles.sectionTitle, { color: colors.text3, marginBottom: 8 }]}>BÖLGE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginBottom: 16, paddingRight: 16 }}
            >
              {REGION_FILTERS.map((r) => {
                const active = region === r.key;
                return (
                  <Pressable
                    key={r.key}
                    onPress={() => setRegion(r.key)}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : colors.surface2,
                        borderColor: active ? colors.primary : colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: active ? "#fff" : colors.text2,
                      }}
                    >
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.sectionTitle, { color: colors.text3, marginBottom: 8 }]}>
              KAYITLI ANALİZLER ({filtered.length})
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>🩺</Text>
            <Text style={[type.h3, { color: colors.text, marginBottom: 6 }]}>
              {items.length === 0 ? "Henüz analiz yok" : "Bu bölgede kayıt yok"}
            </Text>
            <Text style={{ fontSize: 13, color: colors.text3, textAlign: "center", paddingHorizontal: 32 }}>
              {items.length === 0
                ? "Yeni kayıt ekranındaki 'AI ile Analiz Et' ile başla."
                : "Farklı bir bölge dene veya 'Tümü' seç."}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => handleDelete(item)}
            delayLongPress={400}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.cardHeader}>
              <Text style={[styles.cardDate, { color: colors.text3 }]}>
                {formatDate(item.date)}
              </Text>
              <Pressable
                onPress={() => handleDelete(item)}
                hitSlop={8}
                style={({ pressed }) => [{ opacity: pressed ? 0.5 : 0.7 }]}
              >
                <Text style={{ fontSize: 16, color: colors.danger }}>✕</Text>
              </Pressable>
            </View>

            {/* Original text */}
            <Text style={[styles.cardOriginal, { color: colors.text2 }]} numberOfLines={3}>
              "{item.original_text}"
            </Text>

            {/* AI özet */}
            {item.detected_symptoms?.summary && (
              <View
                style={[
                  styles.aiBox,
                  {
                    backgroundColor: colors.primary + "12",
                    borderLeftColor: colors.primary,
                  },
                ]}
              >
                <Text style={[styles.aiLabel, { color: colors.primaryLight }]}>
                  ✦ MINDTRACK AI
                </Text>
                <Text style={[styles.aiText, { color: colors.text }]}>
                  {item.detected_symptoms.summary}
                </Text>
              </View>
            )}

            {/* Tespit edilen semptomlar */}
            {(item.detected_symptoms?.symptoms || []).length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {(item.detected_symptoms?.symptoms || []).map((sym, i) => (
                  <View
                    key={i}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: severityColor(sym.severity) + "26",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "600", color: severityColor(sym.severity) }}>
                      {sym.name}
                      {sym.body_region ? ` · ${sym.body_region}` : ""}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  appBarTitle: { fontSize: 18, fontWeight: "700", letterSpacing: -0.2 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginLeft: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  topCard: {
    width: 130,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 6,
  },
  topDot: { width: 8, height: 8, borderRadius: 4 },
  topName: { fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
  topCount: { fontSize: 11 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  card: {
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDate: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 },
  cardOriginal: { fontSize: 13, fontStyle: "italic", lineHeight: 18 },
  aiBox: {
    padding: 10,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    gap: 4,
  },
  aiLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  aiText: { fontSize: 12, lineHeight: 17 },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: 40,
  },
});
