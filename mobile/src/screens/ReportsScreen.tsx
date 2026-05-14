import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Share,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { spacing, radius, shadows } from "../lib/theme";

type RangeDays = 7 | 14 | 30;

interface AIAnalysis {
  id: number;
  date: string;
  summary: string;
  recommendations: {
    items?: { title: string; detail: string; priority?: string }[];
    patterns?: string[];
    should_consult_doctor?: boolean;
    consult_reason?: string | null;
  };
  scientific_references?: {
    items?: { pubmed_id: string; title: string; similarity?: number }[];
  } | null;
  data_used: {
    period: { start: string; end: string };
    health_count: number;
    symptom_count: number;
    nutrition_image_count: number;
  };
  created_at: string;
}

interface Props {
  navigation: { goBack: () => void };
}

export default function ReportsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [range, setRange] = useState<RangeDays>(7);
  const [latestAI, setLatestAI] = useState<AIAnalysis | null>(null);
  const [pastAnalyses, setPastAnalyses] = useState<AIAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [counts, setCounts] = useState({ health: 0, symptom: 0, image: 0 });

  const load = useCallback(async () => {
    try {
      const [analyses, hd, sym, img] = await Promise.all([
        api.getAIAnalyses(5).catch(() => []),
        api.getHealthData().catch(() => []),
        api.getSymptoms().catch(() => []),
        api.getImageAnalyses().catch(() => []),
      ]);
      setLatestAI((analyses && analyses[0]) || null);
      setPastAnalyses(analyses && analyses.length > 1 ? analyses.slice(1) : []);
      setCounts({
        health: (hd || []).length,
        symptom: (sym || []).length,
        image: (img || []).length,
      });
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

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result: any = await api.generateAIAnalysis({
        days_back: range,
        include_rag: true,
      });
      // Yeni analiz üretildiğinde önceki latestAI eski listeye taşınır
      setPastAnalyses((prev) => (latestAI ? [latestAI, ...prev].slice(0, 4) : prev));
      setLatestAI(result);
    } catch (e: any) {
      Alert.alert(
        "AI Analiz Üretilemedi",
        e?.message ||
          "Yeterli veri yok veya AI servisi yoğun. Birkaç sağlık kaydı + bir semptom analizi olduğundan emin ol.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!latestAI) return;
    const lines: string[] = [];
    lines.push("📋 MindTrack — Bilimsel Sağlık Raporu");
    lines.push(`Tarih: ${formatDate(latestAI.created_at)}`);
    lines.push(`Dönem: Son ${range} gün`);
    lines.push("");
    lines.push("ÖZET");
    lines.push(latestAI.summary);
    lines.push("");

    const items = latestAI.recommendations?.items ?? [];
    if (items.length > 0) {
      lines.push("ÖNERİLER");
      items.forEach((rec, i) => {
        lines.push(`${i + 1}. ${rec.title}${rec.priority ? ` [${rec.priority}]` : ""}`);
        lines.push(`   ${rec.detail}`);
      });
      lines.push("");
    }

    if (latestAI.recommendations?.should_consult_doctor) {
      lines.push("⚠️ DOKTOR ÖNERİSİ");
      lines.push(latestAI.recommendations.consult_reason || "Bir sağlık uzmanına danışmanız önerilir.");
      lines.push("");
    }

    const refs = latestAI.scientific_references?.items ?? [];
    if (refs.length > 0) {
      lines.push("BİLİMSEL REFERANSLAR (PubMed)");
      refs.forEach((r) => {
        lines.push(`• ${r.title}`);
        lines.push(`  https://pubmed.ncbi.nlm.nih.gov/${r.pubmed_id}/`);
      });
    }

    lines.push("");
    lines.push("— Bu rapor MindTrack tarafından üretilmiştir, tıbbi tanı niteliği taşımaz.");

    try {
      await Share.share({ message: lines.join("\n") });
    } catch {
      // kullanıcı iptal etti
    }
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
        <Text style={[styles.appBarTitle, { color: colors.text }]}>Raporlar</Text>
        {latestAI ? (
          <Pressable
            onPress={handleShare}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: colors.surface2, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={{ fontSize: 14 }}>📤</Text>
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
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
        {/* Range segment */}
        <View style={[styles.segment, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          {([7, 14, 30] as RangeDays[]).map((d) => {
            const active = range === d;
            return (
              <Pressable
                key={d}
                onPress={() => setRange(d)}
                style={({ pressed }) => [
                  styles.segmentBtn,
                  {
                    backgroundColor: active ? colors.primary : "transparent",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: active ? "#fff" : colors.text2,
                  }}
                >
                  {d} gün
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Özet count'lar */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.text3 }]}>VERİ ÖZETİ</Text>
          <View style={{ flexDirection: "row", marginTop: 12, gap: 12 }}>
            <CountBox value={counts.health} label="Sağlık" color={colors.primary} colors={colors} />
            <CountBox value={counts.symptom} label="Belirti" color={colors.danger} colors={colors} />
            <CountBox value={counts.image} label="Beslenme" color={colors.warn} colors={colors} />
          </View>
        </View>

        {/* AI Üret butonu */}
        <Pressable
          onPress={handleGenerate}
          disabled={generating || (counts.health === 0 && counts.symptom === 0)}
          style={({ pressed }) => [
            styles.cta,
            shadows.glow,
            {
              backgroundColor: colors.primary,
              opacity: pressed || generating ? 0.85 : 1,
            },
            (counts.health === 0 && counts.symptom === 0) && { opacity: 0.4 },
          ]}
        >
          {generating ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.ctaTxt}>AI üretiyor… (15-30sn)</Text>
            </View>
          ) : (
            <Text style={styles.ctaTxt}>✦ AI Bilimsel Rapor Üret</Text>
          )}
        </Pressable>

        {counts.health === 0 && counts.symptom === 0 && (
          <Text style={{ fontSize: 12, color: colors.text3, textAlign: "center" }}>
            Önce birkaç sağlık kaydı veya belirti analizi gir.
          </Text>
        )}

        {/* AI Analiz sonucu */}
        {latestAI && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardLabel, { color: colors.text3 }]}>
              AI BİLİMSEL SAĞLIK YORUMU
            </Text>
            <Text style={{ fontSize: 11, color: colors.text3, marginTop: 4 }}>
              {formatDate(latestAI.created_at)}
            </Text>

            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 21, marginTop: 12 }}>
              {latestAI.summary}
            </Text>

            {/* Öneriler */}
            {(latestAI.recommendations?.items ?? []).length > 0 && (
              <View style={{ marginTop: 16, gap: 10 }}>
                <Text style={[styles.subLabel, { color: colors.text3 }]}>ÖNERİLER</Text>
                {latestAI.recommendations.items!.map((rec, i) => {
                  const tone =
                    rec.priority === "yüksek"
                      ? colors.danger
                      : rec.priority === "orta"
                      ? colors.warn
                      : colors.secondary;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.recItem,
                        { backgroundColor: colors.surface2, borderLeftColor: tone },
                      ]}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                        <Text style={[styles.recTitle, { color: colors.text }]}>{rec.title}</Text>
                        {rec.priority && (
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 999,
                              backgroundColor: tone + "26",
                            }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: "700", color: tone, textTransform: "uppercase" }}>
                              {rec.priority}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.recDetail, { color: colors.text2 }]}>{rec.detail}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Doktor uyarısı */}
            {latestAI.recommendations?.should_consult_doctor && (
              <View
                style={[
                  styles.warn,
                  {
                    backgroundColor: colors.warn + "1A",
                    borderColor: colors.warn + "55",
                  },
                ]}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.warn, marginBottom: 4 }}>
                  ⚠️ DOKTOR ÖNERİSİ
                </Text>
                <Text style={{ fontSize: 12, color: colors.text, lineHeight: 17 }}>
                  {latestAI.recommendations.consult_reason ||
                    "Bu belirtiler için bir sağlık uzmanına danışmanız önerilir."}
                </Text>
              </View>
            )}

            {/* Bilimsel referanslar */}
            {(latestAI.scientific_references?.items ?? []).length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.subLabel, { color: colors.text3, marginBottom: 8 }]}>
                  BİLİMSEL REFERANSLAR (PUBMED)
                </Text>
                {(latestAI.scientific_references!.items ?? []).map((ref, i) => (
                  <Pressable
                    key={i}
                    onPress={() =>
                      Linking.openURL(`https://pubmed.ncbi.nlm.nih.gov/${ref.pubmed_id}/`).catch(() => {})
                    }
                    hitSlop={4}
                    style={({ pressed }) => [
                      styles.refItem,
                      { borderBottomColor: colors.border, opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <Text style={{ fontSize: 12, color: colors.secondary, flex: 1 }} numberOfLines={2}>
                      {ref.title}
                    </Text>
                    {typeof ref.similarity === "number" && (
                      <Text style={{ fontSize: 10, color: colors.text3, marginLeft: 8 }}>
                        %{Math.round(ref.similarity * 100)}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            {/* Paylaş butonu */}
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                styles.shareBtn,
                {
                  backgroundColor: colors.surface2,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 14, color: colors.text, fontWeight: "600" }}>📤  Paylaş</Text>
            </Pressable>
          </View>
        )}

        {/* Önceki raporlar */}
        {pastAnalyses.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={[styles.cardLabel, { color: colors.text3, marginLeft: 4 }]}>
              ÖNCEKİ RAPORLAR ({pastAnalyses.length})
            </Text>
            {pastAnalyses.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => setLatestAI(a)}
                style={({ pressed }) => [
                  styles.pastCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pastDate, { color: colors.text3 }]}>{formatDate(a.created_at)}</Text>
                  <Text style={[styles.pastSummary, { color: colors.text }]} numberOfLines={2}>
                    {a.summary}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.text3, marginTop: 4 }}>
                    {a.recommendations?.items?.length ?? 0} öneri ·{" "}
                    {a.scientific_references?.items?.length ?? 0} referans
                  </Text>
                </View>
                <Text style={{ fontSize: 22, color: colors.text3, marginLeft: 8 }}>›</Text>
              </Pressable>
            ))}
          </View>
        )}

        {!latestAI && !generating && (
          <View style={{ padding: 32, alignItems: "center" }}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>📊</Text>
            <Text style={{ fontSize: 14, color: colors.text2, textAlign: "center", lineHeight: 20 }}>
              Henüz AI raporu yok.{"\n"}Yukarıdaki butonla bilimsel rapor üret.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function CountBox({
  value,
  label,
  color,
  colors,
}: {
  value: number;
  label: string;
  color: string;
  colors: any;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", color }}>{value}</Text>
      <Text style={{ fontSize: 10, color: colors.text3, fontWeight: "600", letterSpacing: 0.4, textTransform: "uppercase" }}>
        {label}
      </Text>
    </View>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  segment: {
    flexDirection: "row",
    padding: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.full,
    alignItems: "center",
  },
  summaryCard: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  cardLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  cta: {
    paddingVertical: 18,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
  },
  ctaTxt: { fontSize: 15, fontWeight: "700", color: "#fff" },
  card: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  subLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2 },
  recItem: {
    padding: 12,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    gap: 4,
  },
  recTitle: { fontSize: 13, fontWeight: "700", flex: 1 },
  recDetail: { fontSize: 12, lineHeight: 17 },
  warn: {
    marginTop: 14,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  refItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  shareBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
  },
  pastCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  pastDate: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 },
  pastSummary: { fontSize: 13, lineHeight: 18 },
});
