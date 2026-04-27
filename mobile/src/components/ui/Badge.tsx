import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { radius } from "../../lib/theme";

type Tone = "neutral" | "primary" | "success" | "warn" | "danger" | "info" | "ai";

interface Props {
  label: string;
  tone?: Tone;
  style?: ViewStyle;
}

export function Badge({ label, tone = "neutral", style }: Props) {
  const { colors } = useTheme();

  const toneMap: Record<Tone, { bg: string; fg: string; border?: string }> = {
    neutral: { bg: colors.surface2, fg: colors.text2, border: colors.border },
    primary: { bg: colors.primary + "22", fg: colors.primary, border: colors.primary + "44" },
    success: { bg: colors.success + "22", fg: colors.success, border: colors.success + "44" },
    warn: { bg: colors.warn + "22", fg: colors.warn, border: colors.warn + "44" },
    danger: { bg: colors.danger + "22", fg: colors.danger, border: colors.danger + "44" },
    info: { bg: colors.info + "22", fg: colors.info, border: colors.info + "44" },
    ai: { bg: colors.ai + "1F", fg: colors.ai, border: colors.ai + "55" },
  };

  const t = toneMap[tone];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: t.bg,
          borderColor: t.border ?? "transparent",
          borderWidth: t.border ? 1 : 0,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
