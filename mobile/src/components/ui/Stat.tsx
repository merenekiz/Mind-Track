import React, { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { radius, shadows, spacing, type } from "../../lib/theme";

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  icon?: ReactNode;
  tone?: "default" | "primary" | "success" | "warn" | "danger" | "ai";
}

export function Stat({ label, value, unit, delta, deltaTone = "neutral", icon, tone = "default" }: Props) {
  const { colors } = useTheme();

  const toneColor =
    tone === "primary"
      ? colors.primary
      : tone === "success"
      ? colors.success
      : tone === "warn"
      ? colors.warn
      : tone === "danger"
      ? colors.danger
      : tone === "ai"
      ? colors.ai
      : colors.text;

  const deltaColor =
    deltaTone === "up" ? colors.success : deltaTone === "down" ? colors.danger : colors.text2;

  return (
    <View
      style={[
        styles.box,
        shadows.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.head}>
        <Text style={[type.label, { color: colors.text3 }]}>{label.toUpperCase()}</Text>
        {icon ? <View>{icon}</View> : null}
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: toneColor }]}>{value}</Text>
        {unit ? (
          <Text style={[styles.unit, { color: colors.text3 }]}>{unit}</Text>
        ) : null}
      </View>
      {delta ? (
        <Text style={[styles.delta, { color: deltaColor }]}>{delta}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.base,
    flex: 1,
    minHeight: 96,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  unit: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 4,
  },
  delta: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    letterSpacing: 0.2,
  },
});
