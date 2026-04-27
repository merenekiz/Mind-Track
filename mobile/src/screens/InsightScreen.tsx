import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { spacing, radius, shadows } from "../lib/theme";

interface HealthData {
  id: number;
  date: string;
  pain_level: number | null;
  sleep_hours: number | null;
  stress_level: number | null;
  mood: string | null;
  notes: string | null;
}

type Msg = { role: "ai" | "user"; text: string };

const SUGGESTIONS = ["Bu haftayı özetle", "Uyku eğilimim nasıl?", "Gevşeme rutini öner", "Yarını planla"];

export default function InsightScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [data, setData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const load = useCallback(async () => {
    try {
      const hd = await api.getHealthData();
      setData(hd || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Initial AI greeting based on data
  useEffect(() => {
    if (loading || messages.length > 0) return;
    const last7 = data.slice(0, 7);
    const safeAvg = (k: keyof HealthData) => {
      const v = last7.filter((d) => d[k] != null);
      if (!v.length) return null;
      return v.reduce((s, d) => s + (Number(d[k]) || 0), 0) / v.length;
    };
    const avgSleep = safeAvg("sleep_hours");
    const avgStress = safeAvg("stress_level");

    if (data.length === 0) {
      setMessages([
        {
          role: "ai",
          text: "Merhaba — ben MindTrack AI. Henüz kaydın olmadığı için bilimsel bir yorum yapamıyorum. İlk birkaç kaydından sonra eğilimleri birlikte inceleyebiliriz.",
        },
      ]);
      return;
    }

    const lines: string[] = [`Merhaba — ben MindTrack AI. Son ${last7.length} günlük verine baktım.`];
    if (avgStress != null) lines.push(`Stres ortalaman ${avgStress.toFixed(1)}/10.`);
    if (avgSleep != null) lines.push(`Uyku ortalaman ${avgSleep.toFixed(1)} saat.`);
    if (avgSleep != null && avgStress != null && avgSleep < 6.5 && avgStress >= 6) {
      lines.push("İkisi arasında belirgin bir ilişki var — düşük uyku, yüksek stresi tetiklemiş olabilir.");
    }

    setMessages([
      { role: "ai", text: lines.join(" ") },
      { role: "ai", text: "Hangi konuda yardımcı olayım — eğilim mi, öneri mi, yoksa bir günü detaylıca incelemek mi istersin?" },
    ]);
  }, [loading, data, messages.length]);

  const send = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: value }]);
    setThinking(true);
    setTimeout(() => {
      const reply = generateReply(value, data);
      setMessages((m) => [...m, { role: "ai", text: reply }]);
      setThinking(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }, 700);
  };

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <View style={{ paddingTop: insets.top, flex: 1 }}>
        {/* App-bar with AI identity */}
        <View style={styles.appBar}>
          <View style={[styles.iconBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Text style={{ color: colors.text2, fontSize: 16 }}>‹</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={[styles.aiAvatar, shadows.glow, { backgroundColor: colors.primary }]}>
              <Text style={{ fontSize: 14, color: "#fff" }}>✦</Text>
            </View>
            <View>
              <Text style={[styles.appBarTitle, { color: colors.text }]}>MindTrack AI</Text>
              <Text style={{ fontSize: 10, color: colors.success, fontVariant: ["tabular-nums"] }}>
                ● Çevrimiçi · Beta
              </Text>
            </View>
          </View>
          <View style={[styles.iconBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Text style={{ color: colors.text2, fontSize: 14 }}>⋯</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: spacing.lg, gap: 8, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                m.role === "ai"
                  ? {
                      alignSelf: "flex-start",
                      backgroundColor: colors.primary + "1F",
                      borderColor: colors.primary + "55",
                    }
                  : {
                      alignSelf: "flex-end",
                      backgroundColor: colors.surface2,
                      borderColor: colors.border,
                    },
              ]}
            >
              <Text style={{ color: colors.text, fontSize: 13.5, lineHeight: 20 }}>{m.text}</Text>
            </View>
          ))}

          {thinking && (
            <View
              style={[
                styles.bubble,
                {
                  alignSelf: "flex-start",
                  backgroundColor: colors.primary + "1F",
                  borderColor: colors.primary + "55",
                  flexDirection: "row",
                  gap: 6,
                  alignItems: "center",
                },
              ]}
            >
              <ActivityIndicator color={colors.primaryLight} size="small" />
              <Text style={{ color: colors.text2, fontSize: 12, fontStyle: "italic" }}>
                MindTrack düşünüyor…
              </Text>
            </View>
          )}

          {/* Suggestion chips */}
          {messages.length <= 2 && !thinking && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  style={[
                    styles.suggestion,
                    { backgroundColor: colors.primary + "1A", borderColor: colors.primary + "66" },
                  ]}
                >
                  <Text style={{ color: colors.primaryLight, fontSize: 11, fontWeight: "500" }}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input pill */}
        <View
          style={[
            styles.inputBarWrap,
            {
              paddingBottom: Math.max(insets.bottom, 12) + 70,
              paddingHorizontal: spacing.lg,
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={[styles.inputBar, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Pressable style={[styles.inputIcon, { backgroundColor: "transparent" }]}>
              <Text style={{ color: colors.text3, fontSize: 16 }}>+</Text>
            </Pressable>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="MindTrack'e sor…"
              placeholderTextColor={colors.text3}
              onSubmitEditing={() => send()}
              returnKeyType="send"
              style={{ flex: 1, color: colors.text, fontSize: 13, paddingVertical: 8 }}
            />
            <Pressable style={[styles.inputIcon, { backgroundColor: colors.surface3 }]}>
              <Text style={{ color: colors.text2, fontSize: 13 }}>🎙</Text>
            </Pressable>
            <Pressable
              onPress={() => send()}
              style={[styles.sendBtn, shadows.glow, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>↑</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function generateReply(question: string, data: HealthData[]): string {
  const q = question.toLowerCase();
  const last7 = data.slice(0, 7);
  const safeAvg = (k: keyof HealthData) => {
    const v = last7.filter((d) => d[k] != null);
    if (!v.length) return null;
    return v.reduce((s, d) => s + (Number(d[k]) || 0), 0) / v.length;
  };
  const sleep = safeAvg("sleep_hours");
  const stress = safeAvg("stress_level");
  const pain = safeAvg("pain_level");

  if (q.includes("uyku") || q.includes("uyu")) {
    if (sleep == null) return "Henüz uyku verin yok. Birkaç gün uyku saatini kaydedersen kişisel yorum yapabilirim.";
    if (sleep < 6) return `Son 7 günlük uyku ortalaman ${sleep.toFixed(1)} saat — ideal aralığın (7-9sa) altında. Yatma saatini sabitlemek ve ekran kullanımını yatmadan 1 saat önce bırakmak işe yarayabilir.`;
    return `Uyku ortalaman ${sleep.toFixed(1)} saat — sağlıklı bir aralıkta. Süreklilik en az kadar süre kadar önemli.`;
  }
  if (q.includes("stres") || q.includes("rahat") || q.includes("gevşe")) {
    if (stress == null) return "Stres verin yok. Birkaç gün kayıt eklersen daha kişisel öneri sunabilirim.";
    if (stress >= 6) return `Stres ortalaman ${stress.toFixed(1)}/10 — yüksek bantta. 4-7-8 nefes (4sn nefes al, 7sn tut, 8sn ver) tekniğini günde 5 dakika denemek bilimsel olarak etkili bulunmuş.`;
    return `Stres ortalaman ${stress.toFixed(1)}/10 — yönetilebilir aralıkta görünüyor.`;
  }
  if (q.includes("ağrı") || q.includes("baş")) {
    if (pain == null) return "Ağrı verin yok.";
    return `Ağrı ortalaman ${pain.toFixed(1)}/10. Ağrının zamanlamasını ve tetikleyicileri (yemek, uyku, ekran) not etmek kalıbı yakalamana yardımcı olur.`;
  }
  if (q.includes("özet") || q.includes("hafta")) {
    const lines = [];
    if (stress != null) lines.push(`stres ${stress.toFixed(1)}/10`);
    if (sleep != null) lines.push(`uyku ${sleep.toFixed(1)}sa`);
    if (pain != null) lines.push(`ağrı ${pain.toFixed(1)}/10`);
    return lines.length
      ? `Son haftanın özeti: ${lines.join(", ")}. ${stress != null && stress >= 6 ? "Stres yönetimine odaklanmak iyi olur." : "Genel görünümün dengeli."}`
      : "Henüz haftalık özet için yeterli veri yok.";
  }
  if (q.includes("yarın") || q.includes("plan")) {
    return "Yarın için 3 küçük öneri: 1) Yatma saatini bu gece 23:00'e sabitle. 2) Öğleden sonra 10 dk yürüyüş ekle. 3) Kafeini 14:00'ten önce bitir.";
  }
  return "İlginç bir soru. Daha kesin yorum için son birkaç günün verisine birlikte bakabiliriz — uyku, stres veya ağrı eğilimini sormak ister misin?";
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  appBarTitle: { fontSize: 14, fontWeight: "700" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  suggestion: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  inputBarWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: radius.full,
    ...shadows.cardLg,
  },
  inputIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
