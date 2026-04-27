import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { radius, shadows, spacing } from "../lib/theme";

interface HealthData {
  id: number;
  date: string;
  pain_level: number | null;
  sleep_hours: number | null;
  stress_level: number | null;
  mood: string | null;
  notes: string | null;
}

interface Props {
  onOpenNew: () => void;
}

const QUICK_ACTIONS: { glyph: string; label: string; tone: string }[] = [
  { glyph: "💧", label: "Su", tone: "secondary" },
  { glyph: "🍲", label: "Öğün", tone: "warn" },
  { glyph: "🌿", label: "Nefes", tone: "success" },
  { glyph: "🎙", label: "Sesli", tone: "primaryLight" },
];

function formatLongDate(d: Date) {
  return d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
}

export default function HomeScreen({ onOpenNew }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [data, setData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
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
      loadData();
    }, [loadData])
  );

  const recent = data.slice(-7);
  const safeAvg = (arr: HealthData[], key: keyof HealthData) => {
    const valid = arr.filter((d) => d[key] != null);
    if (!valid.length) return null;
    return valid.reduce((s, d) => s + (Number(d[key]) || 0), 0) / valid.length;
  };
  const avgSleep = safeAvg(recent, "sleep_hours");
  const avgStress = safeAvg(recent, "stress_level");
  const avgPain = safeAvg(recent, "pain_level");
  const moodScore: Record<string, number> = { very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5 };
  const energyVals = recent.filter((d) => d.mood).map((d) => moodScore[d.mood as string] || 0);
  const avgEnergy = energyVals.length ? energyVals.reduce((a, b) => a + b, 0) / energyVals.length : null;

  const stressLabel = avgStress == null ? "—" : avgStress >= 7 ? "Yüksek" : avgStress >= 5 ? "Orta" : "Düşük";
  const stressTone = avgStress == null ? colors.text2 : avgStress >= 7 ? colors.danger : avgStress >= 5 ? colors.warn : colors.success;
  const energyLabel = avgEnergy == null ? "—" : avgEnergy >= 4 ? "Yüksek" : avgEnergy >= 3 ? "Orta" : "Düşük";
  const energyTone = avgEnergy == null ? colors.text2 : avgEnergy >= 4 ? colors.success : avgEnergy >= 3 ? colors.warn : colors.danger;

  const insightText =
    data.length === 0
      ? "İlk kaydını oluştur — birkaç günlük veri sonrası AI sana özel öneriler üretmeye başlar."
      : avgStress != null && avgStress >= 6
      ? `Son haftada stres ortalaman ${avgStress.toFixed(1)}/10 — yüksek. Bu akşam 22:30'da 20 dakikalık bir gevşeme rutini deneyebilirsin.`
      : avgSleep != null && avgSleep < 6
      ? `Son 7 gün uyku ortalaman ${avgSleep.toFixed(1)} sa — hedefin altında. Yatış saatini öne çek, ertesi gün enerjin yükselir.`
      : "Verilerin dengeli görünüyor. Bu ritmi sürdürmek için günlük mikro-rutinleri kayda almaya devam et.";

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {/* Greeting (sabit) */}
      <View style={styles.greet}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greetH1, { color: colors.text }]}>
            Merhaba, {user?.full_name?.split(" ")[0] ?? "Hoş geldin"} 👋
          </Text>
          <Text style={[styles.greetDate, { color: colors.text3 }]}>
            {formatLongDate(new Date())}
          </Text>
        </View>
        <Pressable style={[styles.iconBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <Text style={{ fontSize: 16 }}>🔔</Text>
          <View style={[styles.dot, { backgroundColor: colors.danger }]} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.base, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Bugünün Özeti */}
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bugünün Özeti</Text>
          <Text style={[styles.more, { color: colors.primaryLight }]}>Tümü →</Text>
        </View>

        <View style={styles.statGrid}>
          <StatTile glyph="❤" label="Stres" value={stressLabel} delta={data.length > 1 ? "%19 ↑" : undefined} deltaUp color={stressTone} colors={colors} />
          <StatTile glyph="🌙" label="Uyku" value={avgSleep != null ? avgSleep.toFixed(1) : "—"} unit="sa" delta={avgSleep != null ? "%6 ↓" : undefined} color={colors.text} colors={colors} />
        </View>
        <View style={[styles.statGrid, { marginTop: spacing.sm }]}>
          <StatTile glyph="⚡" label="Enerji" value={energyLabel} delta={avgEnergy != null ? "%5 ↑" : undefined} deltaUp color={energyTone} colors={colors} />
          <StatTile glyph="⚠" label="Belirti" value={String(recent.filter((d) => d.pain_level != null && d.pain_level >= 4).length)} delta={data.length > 0 ? `${data.length} kayıt` : undefined} deltaUp color={colors.text} colors={colors} />
        </View>

        {/* AI Insight */}
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>AI İçgörüsü</Text>
        </View>
        <View style={[styles.insight, { borderColor: colors.primary + "40" }]}>
          <View style={styles.insightHead}>
            <Text style={{ fontSize: 12 }}>✦</Text>
            <Text style={[styles.insightHeadTxt, { color: colors.primaryLight }]}>MINDTRACK FARK ETTİ</Text>
          </View>
          <Text style={[styles.insightBody, { color: colors.text2 }]}>{insightText}</Text>
          <Pressable>
            <Text style={[styles.insightLink, { color: colors.primaryLight }]}>Önerilen rutini gör →</Text>
          </Pressable>
          <View pointerEvents="none" style={[styles.insightGlow, { backgroundColor: colors.primary + "33" }]} />
        </View>

        {/* Hızlı kayıt */}
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Hızlı kayıt</Text>
        </View>
        <View style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {QUICK_ACTIONS.map((q) => {
            const tint = (colors as any)[q.tone] || colors.primary;
            return (
              <Pressable key={q.label} onPress={onOpenNew} style={[styles.quickItem, { backgroundColor: colors.surface2 }]}>
                <Text style={{ fontSize: 18, color: tint }}>{q.glyph}</Text>
                <Text style={[styles.quickLabel, { color: colors.text3 }]}>{q.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Son aktivite (varsa) */}
        {data.length > 0 && (
          <>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Son aktivite</Text>
              <Text style={[styles.more, { color: colors.primaryLight }]}>Tümü →</Text>
            </View>
            <View style={{ gap: spacing.sm }}>
              {recent.slice(-3).reverse().map((r) => {
                const isStress = r.stress_level != null && r.stress_level >= 7;
                const isSleep = r.sleep_hours != null && r.sleep_hours < 6;
                const badge = isStress
                  ? { txt: "stres", color: colors.danger }
                  : isSleep
                  ? { txt: "uyku", color: colors.secondary }
                  : { txt: "kayıt", color: colors.success };
                return (
                  <View key={r.id} style={[styles.actRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.actDate, { color: colors.text3 }]}>{r.date.slice(5)}</Text>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={[styles.actBadge, { backgroundColor: badge.color + "26" }]}>
                        <Text style={{ fontSize: 10, color: badge.color, fontWeight: "600" }}>{badge.txt}</Text>
                      </View>
                      <Text style={{ fontSize: 12, color: colors.text2, flex: 1 }} numberOfLines={1}>
                        {r.notes || `Stres ${r.stress_level ?? "—"} · Uyku ${r.sleep_hours ?? "—"}sa`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {data.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📒</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Henüz kayıt yok</Text>
            <Text style={[styles.emptyDesc, { color: colors.text3 }]}>İlk sağlık girdini oluştur, AI öneriler üretmeye başlasın.</Text>
            <Pressable onPress={onOpenNew} style={[styles.emptyBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>+ İlk kaydını oluştur</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface StatTileProps {
  glyph: string;
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaUp?: boolean;
  color: string;
  colors: ReturnType<typeof useTheme>["colors"];
}

function StatTile({ glyph, label, value, unit, delta, deltaUp, color, colors }: StatTileProps) {
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.statHead}>
        <Text style={{ fontSize: 11, color }}>{glyph}</Text>
        <Text style={[styles.statLabel, { color: colors.text3 }]}>{label}</Text>
      </View>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        {unit && <Text style={[styles.statUnit, { color: colors.text3 }]}>{unit}</Text>}
      </View>
      {delta && (
        <Text style={[styles.statDelta, { color: deltaUp ? colors.success : colors.text3 }]}>
          {delta}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  greet: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  greetH1: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  greetDate: { fontSize: 12, marginTop: 2 },
  iconBtn: {
    width: 36, height: 36, borderRadius: radius.sm,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  dot: { position: "absolute", top: 8, right: 8, width: 6, height: 6, borderRadius: 3 },
  sectionHead: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 14, fontWeight: "600" },
  more: { fontSize: 11, fontWeight: "500" },
  statGrid: { flexDirection: "row", gap: 10 },
  stat: {
    flex: 1, borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md,
  },
  statHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  statLabel: { fontSize: 11 },
  statValueRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  statValue: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  statUnit: { fontSize: 11, fontWeight: "400" },
  statDelta: { fontSize: 10, marginTop: 4 },
  insight: {
    backgroundColor: "rgba(124,90,237,0.10)",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
    overflow: "hidden",
    position: "relative",
  },
  insightHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  insightHeadTxt: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
  insightBody: { fontSize: 12, lineHeight: 18 },
  insightLink: { fontSize: 11, marginTop: 10, fontWeight: "500" },
  insightGlow: {
    position: "absolute", top: -40, right: -40,
    width: 120, height: 120, borderRadius: 60,
  },
  quickCard: {
    flexDirection: "row", gap: 8,
    borderRadius: radius.lg, borderWidth: 1,
    padding: 12,
  },
  quickItem: {
    flex: 1, alignItems: "center", gap: 6,
    paddingVertical: 10, borderRadius: radius.sm,
  },
  quickLabel: { fontSize: 10 },
  actRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: radius.sm, borderWidth: 1, gap: 10,
  },
  actDate: { fontSize: 11, width: 44, fontWeight: "500" },
  actBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  emptyCard: {
    marginTop: spacing.xl,
    borderRadius: radius.lg, borderWidth: 1,
    padding: spacing["2xl"],
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  emptyDesc: { fontSize: 12, textAlign: "center", marginBottom: 16, lineHeight: 18 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.md },
});
