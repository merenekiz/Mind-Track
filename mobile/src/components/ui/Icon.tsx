import React from "react";
import { Text, View, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { radius } from "../../lib/theme";

// Lightweight emoji-based icon avatar — no native font dependency.
// For more complex icons later you can swap in react-native-svg.

interface IconProps {
  glyph: string;
  size?: number;
  bg?: string;
  color?: string;
  style?: ViewStyle;
  shape?: "circle" | "rounded" | "square";
}

export function Icon({
  glyph,
  size = 36,
  bg,
  color,
  style,
  shape = "rounded",
}: IconProps) {
  const { colors } = useTheme();
  const background = bg ?? colors.surface2;
  const fg = color ?? colors.text;
  const r = shape === "circle" ? size / 2 : shape === "square" ? 4 : radius.md;

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: r,
          backgroundColor: background,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.5, color: fg }}>{glyph}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    justifyContent: "center",
  },
});
