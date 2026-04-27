import React, { ReactNode } from "react";
import { View, Text, StyleSheet, ViewStyle, Pressable } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { radius, shadows, spacing, type } from "../../lib/theme";

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  onPress?: () => void;
  variant?: "default" | "elevated" | "outline" | "ai" | "glass" | "glow";
}

export function Card({
  children,
  style,
  padded = true,
  onPress,
  variant = "default",
}: CardProps) {
  const { colors } = useTheme();

  let bg: string = colors.surface;
  let borderColor: string = colors.border;
  let borderWidth = 1;
  let extraShadow = shadows.card;

  if (variant === "elevated") {
    bg = colors.surface2;
    borderColor = colors.border2;
    extraShadow = shadows.cardLg;
  } else if (variant === "outline") {
    bg = "transparent";
    borderColor = colors.border;
    extraShadow = { ...shadows.card, shadowOpacity: 0, elevation: 0 };
  } else if (variant === "ai") {
    bg = colors.surface2;
    borderColor = colors.ai;
    extraShadow = shadows.glowAi;
  } else if (variant === "glass") {
    bg = colors.surfaceGlass;
    borderColor = colors.border;
    extraShadow = shadows.cardLg;
  } else if (variant === "glow") {
    bg = colors.surface2;
    borderColor = colors.primary;
    extraShadow = shadows.glow;
  }

  const content = (
    <View
      style={[
        styles.card,
        extraShadow,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth,
          padding: padded ? spacing.base : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  icon?: ReactNode;
}

export function CardHeader({ title, subtitle, right, icon }: CardHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {icon ? <View style={{ marginRight: spacing.md }}>{icon}</View> : null}
        <View style={{ flex: 1 }}>
          <Text style={[type.h3, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[type.caption, { color: colors.text2, marginTop: 2 }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
});
