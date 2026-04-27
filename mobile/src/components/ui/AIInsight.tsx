import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { radius, shadows, spacing, type } from "../../lib/theme";
import { Badge } from "./Badge";

interface Props {
  summary: string;
  reason?: string;
  risk?: "low" | "medium" | "high";
  suggestion?: string;
  confidence?: number;
  title?: string;
}

export function AIInsight({ summary, reason, risk = "low", suggestion, confidence, title = "MindTrack AI Yorumu" }: Props) {
  const { colors } = useTheme();

  const riskTone = risk === "high" ? "danger" : risk === "medium" ? "warn" : "success";
  const riskLabel = risk === "high" ? "Yüksek risk" : risk === "medium" ? "Orta risk" : "Düşük risk";

  return (
    <View
      style={[
        styles.box,
        shadows.glowAi,
        {
          backgroundColor: colors.surface2,
          borderColor: colors.ai + "55",
        },
      ]}
    >
      <View style={styles.head}>
        <View style={[styles.dot, { backgroundColor: colors.ai }]} />
        <Text style={[type.label, { color: colors.ai, flex: 1 }]}>{title.toUpperCase()}</Text>
        <Badge label={riskLabel} tone={riskTone} />
      </View>

      <Text style={[styles.summary, { color: colors.text }]}>{summary}</Text>

      {reason ? (
        <View style={[styles.row, { borderTopColor: colors.border }]}>
          <Text style={[type.caption, { color: colors.text2, marginBottom: 4 }]}>Neden</Text>
          <Text style={[type.body, { color: colors.text }]}>{reason}</Text>
        </View>
      ) : null}

      {suggestion ? (
        <View style={[styles.row, { borderTopColor: colors.border }]}>
          <Text style={[type.caption, { color: colors.text2, marginBottom: 4 }]}>Öneri</Text>
          <Text style={[type.body, { color: colors.text }]}>{suggestion}</Text>
        </View>
      ) : null}

      {confidence != null ? (
        <View style={styles.confidence}>
          <Text style={[type.caption, { color: colors.text2 }]}>
            Güven: {Math.round(confidence * 100)}%
          </Text>
          <View style={[styles.bar, { backgroundColor: colors.surface3 }]}>
            <View
              style={{
                width: `${Math.min(100, Math.max(0, confidence * 100))}%`,
                height: "100%",
                backgroundColor: colors.ai,
                borderRadius: radius.full,
              }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.base,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  summary: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
  },
  row: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  confidence: {
    marginTop: spacing.md,
  },
  bar: {
    height: 6,
    borderRadius: radius.full,
    marginTop: 6,
    overflow: "hidden",
  },
});
