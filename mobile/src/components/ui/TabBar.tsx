import React from "react";
import { View, Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { radius, shadows, spacing } from "../../lib/theme";

export interface TabItem {
  key: string;
  glyph: string;
  fab?: boolean;
}

interface Props {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

export function TabBar({ tabs, active, onChange }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: spacing.lg,
        right: spacing.lg,
        bottom: Math.max(insets.bottom, spacing.md),
      }}
    >
      <View
        style={[
          styles.bar,
          shadows.cardLg,
          {
            backgroundColor: colors.surface2 + "EE",
            borderColor: colors.border,
          },
        ]}
      >
        {tabs.map((t) => {
          if (t.fab) {
            return (
              <Pressable
                key={t.key}
                onPress={() => onChange(t.key)}
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
              >
                <View style={[styles.fab, shadows.glow, { backgroundColor: colors.primary }]}>
                  <Text style={{ fontSize: 22, color: "#fff", fontWeight: "700" }}>{t.glyph}</Text>
                </View>
              </Pressable>
            );
          }
          const isActive = t.key === active;
          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              style={({ pressed }) => [
                styles.tab,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              {isActive ? (
                <View style={[styles.activeBg, shadows.glow, { backgroundColor: colors.primary }]}>
                  <Text style={{ fontSize: 18, color: "#fff" }}>{t.glyph}</Text>
                </View>
              ) : (
                <Text style={{ fontSize: 18, color: colors.text3 }}>{t.glyph}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    height: 56,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
  },
  tab: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBg: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
