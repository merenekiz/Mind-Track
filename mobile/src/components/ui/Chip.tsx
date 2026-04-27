import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { radius } from "../../lib/theme";

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  emoji?: string;
}

export function Chip({ label, active, onPress, style, emoji }: Props) {
  const { colors } = useTheme();
  const bg = active ? colors.primary : colors.surface2;
  const fg = active ? "#FFFFFF" : colors.text2;
  const border = active ? colors.primary : colors.border;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {emoji ? <Text style={{ marginRight: 6, fontSize: 13 }}>{emoji}</Text> : null}
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
});
