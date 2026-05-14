import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { spacing, radius } from "../lib/theme";
import { BarChart } from "../components/ui";

interface HealthData {
  id: number;
  date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
}

const SLEEP_GOAL = 8;

interface Props {
  navigation: { goBack: () => void };
}

export default function SleepScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [data, setData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.getHealthData();
      setData(r || []);
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

  const last7 = useMemo(() => data.slice(-7), [data]);

  const today = new Date().toISOString().split("T")[0];
  const todayRecord = data.find((d) => d.date === today) ?? data[data.length - 1];
  const todaySleep = todayRecord?.sleep_hours ?? 0;
  const todayPct = Math.min(100, Math.round((todaySleep / SLEEP_GOAL) * 100));
  const isToday = todayRecord?.date === today;
  const heroLabel = !todayRecord
    ? "SON UYKU"
    : isToday
    ? "BUGÜNKÜ UYKU"
    : `${new Date(todayRecord.date + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long" }).toUpperCase()} UYKUSU`;

  const avg = (key: keyof HealthData) => {
    const vals = last7.map((d) => d[key]).filter((v): v is number => typeof v === "number");
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  };

  const avgSleep = avg("sleep_hours");
  const avgQuality = avg("sleep_quality");

  // 7 gecelik bar chart data
  const barData = last7.map((d) => ({
    label: d.date.slice(8, 10),
    value: d.sleep_hours ?? 0,
  }));

  // Kalite chart data
  const qualityData = last7.map((d) => ({
    label: d.date.slice(8, 10),
    value: d.sleep_quality ?? 0,
  }));

  // AI öneri (lokal heuristic)
  const aiAdvice = useMemo(() => {
    if (last7.length < 2) {
      return "Birkaç günlük uyku verisinden sonra kişisel öneri gösterilir.";
    }
    if (avgSleep < 6) {
      return `Son 7 günde uyku ortalaman ${avgSleep.toFixed(1)} saat — hedef 8sa'in altında. Yatış saatini sabitlemek ve ekran kullanımını yatmadan 1 saat önce bırakmak işe yarayabilir.`;
    }
    if (avgSleep > 9) {
      return `Uyku ortalaman ${avgSleep.toFixed(1)} saat — hedefin biraz üzerinde. Aşırı uyku yorgunluk hissine sebep olabilir; tutarlı bir saatte uyanmaya çalış.`;
    }
    if (avgQuality < 3) {
      return `Süre dengeli ama uyku kalite ortalaman ${avgQuality.toFixed(1)}/5 — düşük. Karanlık ortam, sabit yatış saati ve kafein kısıtlaması iyileştirebilir.`;
    }
    return `Uyku ortalaman ${avgSleep.toFixed(1)} saat ve kalite ${avgQuality.toFixed(1)}/5 — sağlıklı bir aralıkta. Bu ritmi sürdürmek önemli.`;
  }, [last7.length, avgSleep, avgQuality]);

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
        <Text style={[styles.appBarTitle, { color: colors.text }]}>Uyku</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 140, gap: 14 }}
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
      >
        {/* Uyku — Ring */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.text3 }]}>{heroLabel}</Text>
          <View style={styles.ringWrap}>
            <RingProgress
              percent={todayPct}
              size={180}
              strokeWidth={14}
              color={colors.primary}
              trackColor={colors.surface3}
            />
            <View style={styles.ringCenter}>
              <Text style={[styles.ringValue, { color: colors.text }]}>
                {todaySleep.toFixed(1)}
              </Text>
              <Text style={{ fontSize: 12, color: colors.text3, marginTop: 2 }}>saat</Text>
              <Text style={{ fontSize: 11, color: colors.text3, marginTop: 6 }}>
                hedef {SLEEP_GOAL} sa
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, color: colors.text2, textAlign: "center", marginTop: 12 }}>
            {isToday ? "Bugün" : "Bu gece"} hedefin %{todayPct}'sine ulaştın
          </Text>
        </View>

        {/* Mini istatistikler */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <MiniStat label="Derin" value="~%18" color={colors.primary} colors={colors} />
          <MiniStat label="REM" value="~%24" color={colors.secondary} colors={colors} />
          <MiniStat label="Hafif" value="~%58" color={colors.mint} colors={colors} />
        </View>

        {/* 7 Gecelik Uyku */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
            <Text style={[styles.cardLabel, { color: colors.text3 }]}>7 GECELİK UYKU</Text>
            <Text style={{ fontSize: 11, color: colors.text3 }}>
              ort. {avgSleep.toFixed(1)} sa
            </Text>
          </View>
          {barData.length < 2 ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: colors.text3 }}>
                Trend için en az 2 gece kayıt gerekli.
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: 12 }}>
              <BarChart data={barData} max={Math.max(SLEEP_GOAL + 2, ...barData.map((b) => b.value))} color={colors.primary} />
            </View>
          )}
        </View>

        {/* Uyku Kalitesi */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
            <Text style={[styles.cardLabel, { color: colors.text3 }]}>UYKU KALİTESİ · 7 GÜN</Text>
            <Text style={{ fontSize: 11, color: colors.text3 }}>
              ort. {avgQuality.toFixed(1)}/5
            </Text>
          </View>
          {qualityData.filter((q) => q.value > 0).length < 2 ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: colors.text3 }}>Yeterli kalite verisi yok.</Text>
            </View>
          ) : (
            <View style={{ marginTop: 12 }}>
              <BarChart data={qualityData} max={5} color={colors.secondary} height={100} />
            </View>
          )}
        </View>

        {/* AI Önerisi */}
        <View
          style={[
            styles.aiCard,
            { backgroundColor: colors.primary + "12", borderColor: colors.primary + "44" },
          ]}
        >
          <Text style={[styles.aiLabel, { color: colors.primaryLight }]}>✦ MINDTRACK AI</Text>
          <Text style={[styles.aiText, { color: colors.text }]}>{aiAdvice}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// SVG yok — pure View tabanlı dairesel progress (yarım daire ile yaklaşık)
// Gerçek SVG ring için react-native-svg gerekir; bu mobilde alternatif görselleştirme.
function RingProgress({
  percent,
  size,
  strokeWidth,
  color,
  trackColor,
}: {
  percent: number;
  size: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
}) {
  // Conic gradient yerine: outer çember + içte daha küçük çember + üstte progress arc
  // SVG olmadan en temiz yaklaşım: 2 yarım daire (sol+sağ) rotation ile
  const half = size / 2;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: half,
        borderWidth: strokeWidth,
        borderColor: trackColor,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Sol yarım — 0-50% */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: half,
          borderWidth: strokeWidth,
          borderTopColor: color,
          borderRightColor: percent >= 50 ? color : "transparent",
          borderBottomColor: percent >= 75 ? color : "transparent",
          borderLeftColor: percent >= 25 ? color : "transparent",
          transform: [{ rotate: percent >= 75 ? "0deg" : `${percent * 3.6 - 90}deg` }],
        }}
      />
    </View>
  );
}

function MiniStat({
  label,
  value,
  color,
  colors,
}: {
  label: string;
  value: string;
  color: string;
  colors: any;
}) {
  return (
    <View
      style={{
        flex: 1,
        padding: 12,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        gap: 4,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{value}</Text>
      <Text style={{ fontSize: 10, color: colors.text3, fontWeight: "600", letterSpacing: 0.4, textTransform: "uppercase" }}>
        {label}
      </Text>
    </View>
  );
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
  card: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  cardLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  heroCard: {
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  ringWrap: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  ringValue: { fontSize: 38, fontWeight: "800", letterSpacing: -1 },
  aiCard: {
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 6,
  },
  aiLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2 },
  aiText: { fontSize: 13, lineHeight: 19 },
});
