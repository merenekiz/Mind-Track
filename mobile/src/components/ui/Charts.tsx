import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { radius, spacing, type } from "../../lib/theme";

interface BarChartProps {
  data: { label: string; value: number }[];
  max?: number;
  height?: number;
  color?: string;
}

export function BarChart({ data, max, height = 140, color }: BarChartProps) {
  const { colors } = useTheme();
  const barColor = color ?? colors.primary;
  const peak = max ?? Math.max(1, ...data.map((d) => d.value));

  return (
    <View>
      <View style={[styles.chart, { height }]}>
        {data.map((d, i) => {
          const h = peak > 0 ? Math.max(2, (d.value / peak) * (height - 24)) : 2;
          return (
            <View key={i} style={styles.barCol}>
              <View
                style={{
                  width: "70%",
                  height: h,
                  backgroundColor: barColor,
                  borderRadius: radius.sm,
                }}
              />
              <Text style={[type.caption, { color: colors.text2, marginTop: 6 }]}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

interface SparkProps {
  values: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ values, color, height = 48 }: SparkProps) {
  const { colors } = useTheme();
  const c = color ?? colors.primary;
  const max = Math.max(1, ...values);

  return (
    <View style={[styles.spark, { height }]}>
      {values.map((v, i) => {
        const h = (v / max) * height;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              marginHorizontal: 1,
              height: Math.max(2, h),
              backgroundColor: c,
              borderRadius: 2,
              opacity: 0.6 + (v / max) * 0.4,
            }}
          />
        );
      })}
    </View>
  );
}

interface ProgressProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color,
  showLabel,
  label,
}: ProgressProps) {
  const { colors } = useTheme();
  const c = color ?? colors.primary;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <View>
      {showLabel ? (
        <View style={styles.progressLabel}>
          <Text style={[type.caption, { color: colors.text2 }]}>{label ?? ""}</Text>
          <Text style={[type.caption, { color: colors.text }]}>
            {value}/{max}
          </Text>
        </View>
      ) : null}
      <View style={[styles.track, { backgroundColor: colors.surface3 }]}>
        <View style={{ width: `${pct}%`, height: "100%", backgroundColor: c }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },
  spark: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  track: {
    height: 8,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
});
