import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { spacing, radius, shadows, type } from "../lib/theme";

interface HealthData {
  id: number;
  date: string;
  pain_level: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  stress_level: number | null;
  mood: string | null;
}

type MetricKey = "stress_level" | "sleep_hours" | "pain_level" | "mood";
type RangeKey = 7 | 14 | 30;

const METRICS: { key: MetricKey; label: string; max: number; color: string; mapMood?: boolean }[] = [
  { key: "stress_level", label: "Stres", max: 10, color: "#FF5C7A" },
  { key: "sleep_hours", label: "Uyku", max: 12, color: "#7C5AED" },
  { key: "pain_level", label: "Ağrı", max: 10, color: "#F4B740" },
  { key: "mood", label: "Ruh hali", max: 5, color: "#5EE6C7", mapMood: true },
];

const moodScore: Record<string, number> = { very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5 };

function fmtShort(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<MetricKey>("stress_level");
  const [range, setRange] = useState<RangeKey>(7);

  const load = useCallback(async () => {
    try {
      const result = await api.getHealthData();
      setData(result || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const cfg = METRICS.find((m) => m.key === metric)!;

  const sliced = useMemo(() => data.slice(-range), [data, range]);

  const series = useMemo(() => sliced.map((d) => {
    let v: number;
    if (cfg.mapMood) v = d.mood ? moodScore[d.mood] : 0;
    else v = (d[cfg.key as Exclude<MetricKey, "mood">] as number | null) ?? 0;
    return { label: fmtShort(d.date), value: v };
  }), [sliced, cfg]);

  const validValues = series.filter((s) => s.value > 0).map((s) => s.value);
  const peak = validValues.length ? Math.max(...validValues) : 0;
  const low = validValues.length ? Math.min(...validValues) : 0;
  const avg = validValues.length ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* App-bar */}
      <View style={styles.appBar}>
        <View style={[styles.iconBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <Text style={{ color: colors.text2, fontSize: 16 }}>‹</Text>
        </View>
        <Text style={[styles.appBarTitle, { color: colors.text }]}>{cfg.label} trendi</Text>
        <View style={[styles.iconBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <Text style={{ color: colors.text2, fontSize: 14 }}>⚙</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Metric chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
        >
          {METRICS.map((m) => {
            const active = m.key === metric;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMetric(m.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : colors.surface2,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: active ? "600" : "500",
                    color: active ? "#fff" : colors.text2,
                  }}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Range chips */}
        <View style={{ flexDirection: "row", gap: 6, marginTop: spacing.md }}>
          {([7, 14, 30] as RangeKey[]).map((r) => {
            const active = r === range;
            return (
              <Pressable
                key={r}
                onPress={() => setRange(r)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.surface3 : colors.surface2,
                    borderColor: active ? colors.borderStrong : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: active ? "600" : "500",
                    color: active ? colors.text : colors.text3,
                  }}
                >
                  Son {r}g
                </Text>
              </Pressable>
            );
          })}
        </View>

        {data.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.lg }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "22" }]}>
              <Text style={{ fontSize: 28 }}>📊</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Analiz için veri yok</Text>
            <Text style={[styles.emptyDesc, { color: colors.text3 }]}>
              Birkaç günlük kayıt sonrası analiz görünür hale gelir.
            </Text>
          </View>
        ) : (
          <>
            {/* 3 stat tiles */}
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
              <StatTile glyph="▲" label="Zirve" value={peak.toFixed(1)} color={colors.danger} colors={colors} />
              <StatTile glyph="≈" label="Ort." value={avg.toFixed(1)} color={colors.text} colors={colors} />
              <StatTile glyph="▼" label="En düşük" value={low.toFixed(1)} color={colors.success} colors={colors} />
            </View>

            {/* Trend chart card */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.md }]}>
              <View style={styles.cardHead}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{range} gün</Text>
                <Text style={{ fontSize: 11, color: colors.text3, fontVariant: ["tabular-nums"] }}>
                  {sliced[0]?.date && sliced[sliced.length - 1]?.date
                    ? `${fmtShort(sliced[0].date)} – ${fmtShort(sliced[sliced.length - 1].date)}`
                    : ""}
                </Text>
              </View>
              <BarTrend series={series} color={cfg.color} max={cfg.max} grid={colors.border} text3={colors.text3} />
            </View>

            {/* Insight card */}
            <View
              style={[
                styles.insight,
                {
                  backgroundColor: colors.primary + "1A",
                  borderColor: colors.primary + "66",
                  marginTop: spacing.md,
                },
              ]}
            >
              <View style={styles.insightHead}>
                <Text style={{ color: colors.primaryLight, fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>
                  ✦ EĞİLİM
                </Text>
              </View>
              <Text style={{ color: colors.text2, fontSize: 13, lineHeight: 19, marginTop: 6 }}>
                {validValues.length < 2
                  ? "Daha fazla veri toplandıkça trend yorumu görünecek."
                  : peak > avg * 1.4
                  ? `${cfg.label} en yüksek değerine ulaştığında ortalamanın %${Math.round((peak / avg - 1) * 100)} üzerine çıktı. Bu pikleri tetikleyen faktörlere yakın bak.`
                  : `${cfg.label} stabil bir bantta — pik ile ortalama arasındaki fark düşük.`}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatTile({
  glyph,
  label,
  value,
  color,
  colors,
}: {
  glyph: string;
  label: string;
  value: string;
  color: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View style={[styles.statTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={{ color, fontSize: 11 }}>{glyph}</Text>
        <Text style={{ color: colors.text3, fontSize: 10, letterSpacing: 0.5 }}>{label.toUpperCase()}</Text>
      </View>
      <Text style={{ color, fontSize: 22, fontWeight: "700", marginTop: 4, fontVariant: ["tabular-nums"] }}>
        {value}
      </Text>
    </View>
  );
}

function BarTrend({
  series,
  color,
  max,
  grid,
  text3,
}: {
  series: { label: string; value: number }[];
  color: string;
  max: number;
  grid: string;
  text3: string;
}) {
  if (series.length < 2) {
    return (
      <View style={{ height: 140, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: text3, fontSize: 12 }}>Trend için en az 2 günlük kayıt gerekli.</Text>
      </View>
    );
  }

  const chartH = 130;
  const labelStep = Math.max(1, Math.floor(series.length / 5));

  return (
    <View>
      {/* Chart area with gridlines + bars */}
      <View style={{ height: chartH, position: "relative" }}>
        {/* Gridlines */}
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: (chartH / 3) * i,
              height: 1,
              backgroundColor: grid,
              opacity: 0.5,
            }}
          />
        ))}

        {/* Bars row */}
        <View style={{ flexDirection: "row", alignItems: "flex-end", height: chartH, gap: 4 }}>
          {series.map((d, i) => {
            const barH = max > 0 ? Math.max(2, (d.value / max) * chartH) : 2;
            return (
              <View key={i} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", height: chartH }}>
                <View
                  style={{
                    width: "70%",
                    height: barH,
                    backgroundColor: d.value > 0 ? color : grid,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    opacity: d.value > 0 ? 0.9 : 0.4,
                  }}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* X labels */}
      <View style={{ flexDirection: "row", marginTop: 6, gap: 4 }}>
        {series.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            {i % labelStep === 0 ? (
              <Text style={{ fontSize: 9, color: text3 }}>{d.label}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  appBarTitle: { fontSize: 17, fontWeight: "700" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statTile: {
    flex: 1,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
    ...shadows.card,
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: { fontSize: 13, fontWeight: "600" },
  insight: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
    overflow: "hidden",
  },
  insightHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  emptyCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  emptyDesc: { fontSize: 13, textAlign: "center", lineHeight: 19 },
});
