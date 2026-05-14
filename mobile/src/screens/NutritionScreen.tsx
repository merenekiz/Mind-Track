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
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { spacing, radius, type } from "../lib/theme";
import { ProgressBar } from "../components/ui";

interface ImageAnalysis {
  id: number;
  image_url?: string;
  file_path?: string;
  meal_type?: string | null;
  category?: string;
  analysis_result: {
    food_type?: string;
    coffee_type?: string;
    estimated_calories?: number;
    estimated_caffeine_mg?: number;
    item_name?: string;
    description?: string;
    nutrients?: { protein?: number; carbs?: number; fat?: number };
  };
  created_at: string;
}

const MEAL_LABELS: Record<string, { label: string; emoji: string }> = {
  breakfast: { label: "Kahvaltı", emoji: "🥐" },
  lunch: { label: "Öğle", emoji: "🥗" },
  dinner: { label: "Akşam", emoji: "🍲" },
  snack: { label: "Atıştırma", emoji: "☕" },
};

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];
const CALORIE_GOAL = 2000;

interface Props {
  navigation: { goBack: () => void; navigate: (r: string) => void };
}

export default function NutritionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [items, setItems] = useState<ImageAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.getImageAnalyses();
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

  // En son gün — bugün veriyse onu, yoksa veri olan son günü göster
  const todayItems = useMemo(() => {
    if (items.length === 0) return [];
    const today = new Date().toISOString().split("T")[0];
    const todayList = items.filter((i) => i.created_at.startsWith(today));
    if (todayList.length > 0) return todayList;
    // Bugün yoksa en son kayıt tarihini al
    const latestDate = items
      .map((i) => i.created_at.split("T")[0])
      .sort()
      .pop();
    return items.filter((i) => i.created_at.startsWith(latestDate || ""));
  }, [items]);

  const latestDateLabel = useMemo(() => {
    if (todayItems.length === 0) return "";
    const d = todayItems[0].created_at.split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    if (d === today) return "Bugün";
    return new Date(d + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
  }, [todayItems]);

  // Toplam kalori (bugün)
  const totalCalories = useMemo(
    () =>
      todayItems.reduce((s, i) => s + (i.analysis_result?.estimated_calories ?? 0), 0),
    [todayItems],
  );

  // Makrolar (bugün)
  const macros = useMemo(() => {
    const m = { protein: 0, carbs: 0, fat: 0 };
    todayItems.forEach((i) => {
      const n = i.analysis_result?.nutrients;
      if (n) {
        m.protein += n.protein ?? 0;
        m.carbs += n.carbs ?? 0;
        m.fat += n.fat ?? 0;
      }
    });
    return m;
  }, [todayItems]);

  // Öğün bazlı gruplama
  const mealGroups = useMemo(() => {
    const out: Record<string, ImageAnalysis[]> = {};
    MEAL_ORDER.forEach((mt) => {
      out[mt] = todayItems.filter((i) => i.meal_type === mt);
    });
    return out;
  }, [todayItems]);

  const handleDelete = (img: ImageAnalysis) => {
    Alert.alert("Görseli sil", "Bu beslenme görselini silmek istediğinize emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteImageAnalysis(img.id);
            setItems((prev) => prev.filter((x) => x.id !== img.id));
          } catch (e: any) {
            Alert.alert("Hata", e?.message || "Görsel silinemedi.");
          }
        },
      },
    ]);
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
        <Text style={[styles.appBarTitle, { color: colors.text }]}>Beslenme</Text>
        <Pressable
          onPress={() => navigation.navigate("NewHealthData")}
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: colors.primary, borderColor: colors.primary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>+</Text>
        </Pressable>
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
        {/* Kalori Kartı */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.text3 }]}>
            {latestDateLabel ? latestDateLabel.toUpperCase() : "BUGÜN"}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginVertical: 6 }}>
            <Text style={[styles.bigNumber, { color: colors.text }]}>
              {Math.round(totalCalories)}
            </Text>
            <Text style={{ fontSize: 14, color: colors.text3 }}>/ {CALORIE_GOAL} kcal</Text>
          </View>
          <ProgressBar value={totalCalories} max={CALORIE_GOAL} color={colors.primary} />
          <Text style={{ fontSize: 11, color: colors.text3, marginTop: 8 }}>
            {todayItems.length} kayıt · {MEAL_ORDER.filter((m) => mealGroups[m].length > 0).length}/4 öğün
          </Text>
        </View>

        {/* Makrolar */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <MacroCard label="Karbonhidrat" value={macros.carbs} unit="g" color={colors.warn} colors={colors} />
          <MacroCard label="Protein" value={macros.protein} unit="g" color={colors.danger} colors={colors} />
          <MacroCard label="Yağ" value={macros.fat} unit="g" color={colors.secondary} colors={colors} />
        </View>

        {/* Öğünler */}
        <Text style={[styles.sectionTitle, { color: colors.text3 }]}>
          {latestDateLabel ? `${latestDateLabel.toUpperCase()} ÖĞÜNLERİ` : "ÖĞÜNLER"}
        </Text>
        <View style={{ gap: 8 }}>
          {MEAL_ORDER.map((mt) => {
            const meals = mealGroups[mt];
            const cal = meals.reduce((s, m) => s + (m.analysis_result?.estimated_calories ?? 0), 0);
            const cfg = MEAL_LABELS[mt];
            return (
              <View
                key={mt}
                style={[
                  styles.mealRow,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={{ fontSize: 22 }}>{cfg.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.mealName, { color: colors.text }]}>{cfg.label}</Text>
                  <Text style={[styles.mealMeta, { color: colors.text3 }]}>
                    {meals.length === 0
                      ? "—"
                      : `${meals.length} öğe · ${Math.round(cal)} kcal`}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.text3 }}>
                  {meals.length === 0 ? "Bekliyor" : `${Math.round(cal)} kcal`}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Tüm Görseller */}
        <Text style={[styles.sectionTitle, { color: colors.text3, marginTop: 8 }]}>
          TÜM GÖRSELLER ({items.length})
        </Text>
        {items.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>🍽</Text>
            <Text style={[type.h3, { color: colors.text, marginBottom: 6 }]}>Henüz görsel yok</Text>
            <Text style={{ fontSize: 13, color: colors.text3, textAlign: "center" }}>
              Yeni kayıt ekranından beslenme fotoğrafı ekle.
            </Text>
          </View>
        ) : (
          <FlatList
            data={[...items].reverse()}
            keyExtractor={(it) => String(it.id)}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ gap: 10 }}
            contentContainerStyle={{ gap: 10 }}
            renderItem={({ item }) => (
              <Pressable
                onLongPress={() => handleDelete(item)}
                delayLongPress={400}
                style={({ pressed }) => [
                  styles.imgCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.img}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.img, { backgroundColor: colors.surface3, alignItems: "center", justifyContent: "center" }]}>
                    <Text style={{ fontSize: 32 }}>🍽</Text>
                  </View>
                )}
                <Pressable
                  onPress={() => handleDelete(item)}
                  hitSlop={6}
                  style={[styles.delBtn, { backgroundColor: colors.surface2 + "EE" }]}
                >
                  <Text style={{ fontSize: 14, color: colors.danger }}>✕</Text>
                </Pressable>
                <View style={styles.imgFooter}>
                  <Text style={[styles.imgName, { color: colors.text }]} numberOfLines={1}>
                    {item.analysis_result?.food_type ||
                      item.analysis_result?.coffee_type ||
                      item.analysis_result?.item_name ||
                      "Bilinmeyen"}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                    {item.analysis_result?.estimated_calories != null && (
                      <View style={[styles.miniBadge, { backgroundColor: colors.warn + "26" }]}>
                        <Text style={{ fontSize: 10, color: colors.warn, fontWeight: "600" }}>
                          {item.analysis_result.estimated_calories} kcal
                        </Text>
                      </View>
                    )}
                    {item.analysis_result?.estimated_caffeine_mg != null && (
                      <View style={[styles.miniBadge, { backgroundColor: colors.secondary + "26" }]}>
                        <Text style={{ fontSize: 10, color: colors.secondary, fontWeight: "600" }}>
                          {item.analysis_result.estimated_caffeine_mg}mg
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            )}
          />
        )}
      </ScrollView>
    </View>
  );
}

function MacroCard({
  label,
  value,
  unit,
  color,
  colors,
}: {
  label: string;
  value: number;
  unit: string;
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
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, marginBottom: 6 }} />
      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
        {Math.round(value)}
        <Text style={{ fontSize: 11, color: colors.text3, fontWeight: "500" }}>{unit}</Text>
      </Text>
      <Text style={{ fontSize: 10, color: colors.text3, fontWeight: "600", letterSpacing: 0.4, textTransform: "uppercase", marginTop: 2 }}>
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
  bigNumber: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  mealName: { fontSize: 14, fontWeight: "600" },
  mealMeta: { fontSize: 11, marginTop: 2 },
  emptyCard: {
    padding: 32,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  imgCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  img: {
    width: "100%",
    aspectRatio: 1,
  },
  delBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  imgFooter: {
    padding: 10,
  },
  imgName: { fontSize: 12, fontWeight: "600" },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
});
