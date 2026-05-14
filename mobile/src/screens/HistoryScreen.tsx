import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { spacing, radius, type } from "../lib/theme";

interface HealthData {
  id: number;
  date: string;
  pain_level: number | null;
  pain_type?: string | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  stress_level: number | null;
  water_intake?: number | null;
  activity_minutes?: number | null;
  day_intensity?: number | null;
  mood: string | null;
  notes: string | null;
  created_at?: string;
}

type MoodFilter = "all" | "good" | "neutral" | "bad";

const MOOD_FILTERS: { key: MoodFilter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "good", label: "İyi günler" },
  { key: "neutral", label: "Normal" },
  { key: "bad", label: "Zor günler" },
];

const MOOD_LABELS: Record<string, string> = {
  very_bad: "Çok kötü",
  bad: "Kötü",
  neutral: "Normal",
  good: "İyi",
  very_good: "Çok iyi",
};

interface Props {
  navigation: { goBack: () => void };
}

export default function HistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [data, setData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MoodFilter>("all");
  const [selected, setSelected] = useState<HealthData | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const openDetail = (r: HealthData) => {
    setSelected(r);
    setDetailVisible(true);
  };
  const closeDetail = () => {
    setDetailVisible(false);
    // Animasyon bitene kadar selected'ı tut, sonra temizle
    setTimeout(() => setSelected(null), 350);
  };

  const load = useCallback(async () => {
    try {
      const result = await api.getHealthData();
      setData(result || []);
    } catch {
      setData([]);
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

  const filtered = useMemo(() => {
    let list = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.date.toLowerCase().includes(q) ||
          (d.notes ?? "").toLowerCase().includes(q),
      );
    }
    if (filter !== "all") {
      list = list.filter((d) => {
        const m = d.mood ?? "neutral";
        if (filter === "good") return m === "good" || m === "very_good";
        if (filter === "neutral") return m === "neutral";
        if (filter === "bad") return m === "bad" || m === "very_bad";
        return true;
      });
    }
    return list.reverse(); // yeni → eski
  }, [data, search, filter]);

  const handleDelete = (record: HealthData) => {
    Alert.alert(
      "Kaydı sil",
      `${formatDate(record.date)} tarihli kaydı silmek istediğinize emin misiniz?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteHealthData(record.id);
              setData((prev) => prev.filter((d) => d.id !== record.id));
            } catch (e: any) {
              Alert.alert("Hata", e?.message || "Kayıt silinemedi.");
            }
          },
        },
      ],
    );
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
        <Text style={[styles.appBarTitle, { color: colors.text }]}>Günlük</Text>
        <View style={styles.iconBtn} />
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: 12 }}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <Text style={{ fontSize: 14, color: colors.text3 }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Kayıtlarda ara…"
            placeholderTextColor={colors.text3}
            autoCorrect={false}
            clearButtonMode="while-editing"
            style={{ flex: 1, fontSize: 14, color: colors.text, paddingVertical: 8 }}
          />
        </View>
      </View>

      {/* Mood Filter Chips */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8, alignItems: "center" }}
        >
          {MOOD_FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
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
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Liste */}
      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>📓</Text>
          <Text style={[type.h3, { color: colors.text, marginBottom: 6 }]}>
            {data.length === 0 ? "Henüz kayıt yok" : "Sonuç bulunamadı"}
          </Text>
          <Text style={{ fontSize: 13, color: colors.text3, textAlign: "center", paddingHorizontal: 32 }}>
            {data.length === 0
              ? "İlk sağlık kaydını oluşturduğunda burada görünecek."
              : "Farklı bir arama veya filtre dene."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 140, gap: 10 }}
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
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openDetail(item)}
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
              <View style={styles.cardLeft}>
                <Text style={[styles.cardDate, { color: colors.text }]}>
                  {item.date.slice(8, 10)}
                </Text>
                <Text style={[styles.cardMonth, { color: colors.text3 }]}>
                  {monthShort(item.date)}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                  {item.sleep_hours != null && (
                    <Badge color={colors.secondary} text={`💤 ${item.sleep_hours}sa`} />
                  )}
                  {item.stress_level != null && (
                    <Badge
                      color={item.stress_level >= 7 ? colors.danger : item.stress_level >= 5 ? colors.warn : colors.success}
                      text={`⚡ ${item.stress_level}/10`}
                    />
                  )}
                  {item.pain_level != null && item.pain_level > 0 && (
                    <Badge color={colors.warn} text={`🔥 ${item.pain_level}/10`} />
                  )}
                  {item.mood && (
                    <Badge color={colors.primary} text={MOOD_LABELS[item.mood] || item.mood} />
                  )}
                </View>
                {item.notes ? (
                  <Text style={[styles.cardNote, { color: colors.text2 }]} numberOfLines={2}>
                    {item.notes}
                  </Text>
                ) : (
                  <Text style={[styles.cardNote, { color: colors.text3, fontStyle: "italic" }]}>
                    Not eklenmemiş
                  </Text>
                )}
              </View>
              <Text style={[styles.chev, { color: colors.text3 }]}>›</Text>
            </Pressable>
          )}
        />
      )}

      {/* Detay Modal */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetail}
      >
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          {selected && (
            <DetailView
              record={selected}
              colors={colors}
              onClose={closeDetail}
              onDelete={() => {
                const r = selected;
                closeDetail();
                setTimeout(() => handleDelete(r), 350);
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

function DetailView({
  record,
  colors,
  onClose,
  onDelete,
}: {
  record: HealthData;
  colors: any;
  onClose: () => void;
  onDelete: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {/* AppBar */}
      <View style={styles.appBar}>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: colors.surface2, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={{ color: colors.text2, fontSize: 14 }}>✕</Text>
        </Pressable>
        <Text style={[styles.appBarTitle, { color: colors.text }]}>Kayıt detayı</Text>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: colors.danger + "1A", borderColor: colors.danger + "55", opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={{ color: colors.danger, fontSize: 14 }}>🗑</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Tarih */}
        <View style={[styles.detailHero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text3, letterSpacing: 1.4 }}>
            TARİH
          </Text>
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text, marginTop: 6 }}>
            {formatLong(record.date)}
          </Text>
        </View>

        {/* Metrikler */}
        <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLbl, { color: colors.text3 }]}>METRİKLER</Text>
          <DetailRow label="💤 Uyku" value={record.sleep_hours != null ? `${record.sleep_hours} saat` : "—"} colors={colors} />
          {record.sleep_quality != null && (
            <DetailRow label="✨ Uyku kalitesi" value={`${record.sleep_quality}/5`} colors={colors} />
          )}
          <DetailRow label="⚡ Stres" value={record.stress_level != null ? `${record.stress_level}/10` : "—"} colors={colors} />
          {record.pain_level != null && record.pain_level > 0 && (
            <DetailRow label="🔥 Ağrı" value={`${record.pain_level}/10`} colors={colors} />
          )}
          {record.pain_type && (
            <DetailRow label="📍 Ağrı türü" value={record.pain_type} colors={colors} />
          )}
          {record.water_intake != null && (
            <DetailRow label="💧 Su" value={`${record.water_intake} L`} colors={colors} />
          )}
          {record.activity_minutes != null && (
            <DetailRow label="🏃 Aktivite" value={`${record.activity_minutes} dk`} colors={colors} />
          )}
          {record.day_intensity != null && (
            <DetailRow label="📈 Gün yoğunluğu" value={`${record.day_intensity}/10`} colors={colors} />
          )}
          {record.mood && (
            <DetailRow label="😊 Ruh hali" value={MOOD_LABELS[record.mood] || record.mood} colors={colors} />
          )}
        </View>

        {/* Notlar */}
        {record.notes ? (
          <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionLbl, { color: colors.text3 }]}>NOTLAR</Text>
            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 21 }}>{record.notes}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 13, color: colors.text2 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{value}</Text>
    </View>
  );
}

function formatLong(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Badge({ color, text }: { color: string; text: string }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: color + "26" }}>
      <Text style={{ fontSize: 10, fontWeight: "600", color }}>{text}</Text>
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

function monthShort(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("tr-TR", { month: "short" });
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
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  filterRow: {
    height: 44,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 14,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    borderWidth: 1,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  cardLeft: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  cardDate: { fontSize: 22, fontWeight: "700", lineHeight: 26 },
  cardMonth: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  cardNote: { fontSize: 12, lineHeight: 16 },
  chev: { fontSize: 24, fontWeight: "300", marginLeft: 6 },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  detailHero: {
    padding: 18,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  detailCard: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 4,
  },
  sectionLbl: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 8,
  },
});
