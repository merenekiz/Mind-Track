import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import type { ThemeColors } from "../lib/theme";
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

function getMoodInfo(mood: string, c: ThemeColors) {
  const map: Record<string, { label: string; color: string }> = {
    very_bad: { label: "Çok Kötü", color: c.accent3 },
    bad: { label: "Kötü", color: c.warn },
    neutral: { label: "Normal", color: c.muted },
    good: { label: "İyi", color: c.accent4 },
    very_good: { label: "Çok İyi", color: c.accent4 },
  };
  return map[mood] || null;
}

function valueBadge(val: number, thresholds: [number, number], c: ThemeColors) {
  if (val >= thresholds[1]) return c.accent3;
  if (val >= thresholds[0]) return c.warn;
  return c.accent4;
}

type Props = { navigation: NativeStackNavigationProp<any> };

export default function DashboardScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();
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

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleDelete = (id: number) => {
    Alert.alert("Kaydı Sil", "Bu kaydı kalıcı olarak silmek istediğinize emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
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

  // İstatistikler
  const last7 = data.slice(-7);
  const safeAvg = (arr: HealthData[], key: keyof HealthData) => {
    const valid = arr.filter((d) => d[key] !== null);
    if (!valid.length) return null;
    return valid.reduce((s, d) => s + (Number(d[key]) || 0), 0) / valid.length;
  };
  const avgSleep = safeAvg(last7, "sleep_hours");
  const avgStress = safeAvg(last7, "stress_level");
  const avgPain = safeAvg(last7, "pain_level");

  const stats = [
    { label: "Uyku", value: avgSleep !== null ? avgSleep.toFixed(1) : "—", unit: "sa", color: avgSleep !== null && avgSleep < 6 ? colors.accent3 : colors.accent },
    { label: "Stres", value: avgStress !== null ? avgStress.toFixed(1) : "—", unit: "/10", color: avgStress !== null ? valueBadge(avgStress, [5, 7], colors) : colors.text },
    { label: "Ağrı", value: avgPain !== null ? avgPain.toFixed(1) : "—", unit: "/10", color: avgPain !== null ? valueBadge(avgPain, [4, 7], colors) : colors.text },
    { label: "Kayıt", value: String(data.length), unit: "", color: colors.accent },
  ];

  const s = useMemo(() => createStyles(colors), [colors]);

  const renderRecord = ({ item }: { item: HealthData }) => {
    const m = item.mood ? getMoodInfo(item.mood, colors) : null;
    return (
      <View style={s.recordCard}>
        <View style={s.recordHeader}>
          <Text style={s.recordDate}>{item.date}</Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={s.deleteBtn}>Sil</Text>
          </TouchableOpacity>
        </View>
        <View style={s.recordMetrics}>
          {item.pain_level !== null && (
            <View style={s.metricChip}>
              <Text style={[s.metricVal, { color: valueBadge(item.pain_level, [4, 7], colors) }]}>{item.pain_level}</Text>
              <Text style={s.metricLabel}>Ağrı</Text>
            </View>
          )}
          {item.sleep_hours !== null && (
            <View style={s.metricChip}>
              <Text style={[s.metricVal, { color: colors.accent }]}>{item.sleep_hours}</Text>
              <Text style={s.metricLabel}>Uyku</Text>
            </View>
          )}
          {item.stress_level !== null && (
            <View style={s.metricChip}>
              <Text style={[s.metricVal, { color: valueBadge(item.stress_level, [5, 7], colors) }]}>{item.stress_level}</Text>
              <Text style={s.metricLabel}>Stres</Text>
            </View>
          )}
          {item.sleep_quality !== null && (
            <View style={s.metricChip}>
              <Text style={[s.metricVal, { color: colors.accent4 }]}>{item.sleep_quality}</Text>
              <Text style={s.metricLabel}>Kalite</Text>
            </View>
          )}
          {m && (
            <View style={s.metricChip}>
              <Text style={[s.metricVal, { color: m.color, fontSize: 11 }]}>{m.label}</Text>
              <Text style={s.metricLabel}>Ruh Hali</Text>
            </View>
          )}
        </View>
        {item.notes ? <Text style={s.recordNotes} numberOfLines={2}>{item.notes}</Text> : null}
      </View>
    );
  };

  const ListHeader = () => (
    <>
      <View style={s.statsRow}>
        {stats.map((st) => (
          <View key={st.label} style={s.statCard}>
            <Text style={s.statLabel}>{st.label.toUpperCase()}</Text>
            <Text style={[s.statValue, { color: st.color }]}>
              {st.value}
              {st.unit ? <Text style={s.statUnit}>{st.unit}</Text> : null}
            </Text>
          </View>
        ))}
      </View>

      <View style={s.clinicPanel}>
        <View style={s.clinicBadge}>
          <View style={[s.pulseDot, { backgroundColor: colors.purple }]} />
          <Text style={s.clinicBadgeText}>Klinik Analiz</Text>
        </View>
        <Text style={s.clinicText}>
          {data.length > 0
            ? `Son ${Math.min(7, data.length)} günlük verileriniz değerlendiriliyor. Düzenli kayıt girdikçe sağlık trendleriniz daha net ortaya çıkacak.`
            : "Henüz analiz edilecek veri bulunmuyor. İlk sağlık kaydınızı oluşturarak başlayın."}
        </Text>
        <Text style={s.clinicDisclaimer}>Bu uygulama tıbbi tanı koymaz. Sonuçlar bilgilendirme amaçlıdır.</Text>
      </View>

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Son Kayıtlar</Text>
        <Text style={s.sectionSub}>{data.length} kayıt</Text>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={s.loaderWrap}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Kontrol Paneli</Text>
          <Text style={s.headerSub}>Merhaba, {user?.full_name}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={toggleTheme} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: 18 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={s.logoutText}>Çıkış</Text>
          </TouchableOpacity>
        </View>
      </View>

      {data.length === 0 ? (
        <View style={s.emptyWrap}>
          <ListHeader />
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>Henüz sağlık kaydınız bulunmuyor.</Text>
            <TouchableOpacity onPress={() => navigation.navigate("NewHealthData")}>
              <Text style={s.emptyLink}>İlk kaydınızı oluşturun</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRecord}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={colors.surface}
            />
          }
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate("NewHealthData")} activeOpacity={0.85}>
        <Text style={s.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    loaderWrap: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },
    header: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingHorizontal: 18, paddingTop: 54, paddingBottom: 14,
      backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
    headerSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
    logoutText: { fontSize: 12, color: colors.accent3, fontWeight: "600" },
    listContent: { padding: 14, paddingBottom: 90 },
    statsRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
    statCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12 },
    statLabel: { fontSize: 9, color: colors.muted, letterSpacing: 1, marginBottom: 4 },
    statValue: { fontSize: 22, fontWeight: "800" },
    statUnit: { fontSize: 10, fontWeight: "400", color: colors.muted },
    clinicPanel: { borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: colors.purple + "30", backgroundColor: colors.purple + "08" },
    clinicBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.purple + "18", borderWidth: 1, borderColor: colors.purple + "40", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 9 },
    pulseDot: { width: 6, height: 6, borderRadius: 3 },
    clinicBadgeText: { fontSize: 10, fontWeight: "700", color: colors.purple },
    clinicText: { fontSize: 12, lineHeight: 19, color: colors.text },
    clinicDisclaimer: { fontSize: 10, color: colors.muted, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
    sectionHeader: { marginBottom: 8 },
    sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.text },
    sectionSub: { fontSize: 11, color: colors.muted, marginTop: 1 },
    recordCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, marginBottom: 8 },
    recordHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    recordDate: { fontSize: 14, fontWeight: "700", color: colors.text },
    deleteBtn: { fontSize: 11, color: colors.accent3 + "99", fontWeight: "500" },
    recordMetrics: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    metricChip: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: "center", minWidth: 52 },
    metricVal: { fontSize: 15, fontWeight: "800" },
    metricLabel: { fontSize: 9, color: colors.muted, letterSpacing: 0.5, marginTop: 2 },
    recordNotes: { fontSize: 12, color: colors.muted, marginTop: 8, lineHeight: 17 },
    emptyWrap: { flex: 1, padding: 14 },
    emptyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 28, alignItems: "center" },
    emptyText: { fontSize: 13, color: colors.muted, marginBottom: 8 },
    emptyLink: { fontSize: 12, color: colors.accent, fontWeight: "600" },
    fab: { position: "absolute", right: 18, bottom: 28, width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent, justifyContent: "center", alignItems: "center", shadowColor: colors.accent, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
    fabIcon: { color: "#000", fontSize: 26, fontWeight: "300", marginTop: -1 },
  });
}
