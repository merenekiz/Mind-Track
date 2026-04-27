import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { radius, shadows, spacing, type } from "../../lib/theme";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "ai" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

interface Props {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  fullWidth,
  leftIcon,
  rightIcon,
  style,
}: Props) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const sizeStyle: ViewStyle =
    size === "sm"
      ? { paddingVertical: 8, paddingHorizontal: 14, minHeight: 38 }
      : size === "lg"
      ? { paddingVertical: 16, paddingHorizontal: 26, minHeight: 56 }
      : { paddingVertical: 13, paddingHorizontal: 22, minHeight: 50 };

  const textSize: TextStyle =
    size === "sm" ? { fontSize: 13 } : size === "lg" ? { fontSize: 16 } : { fontSize: 14 };

  let bg: string = colors.primary;
  let fg = "#FFFFFF";
  let border: string = "transparent";
  let shadowStyle = shadows.glow;

  if (variant === "secondary") {
    bg = colors.surface2;
    fg = colors.text;
    border = colors.border;
    shadowStyle = shadows.card;
  } else if (variant === "ghost") {
    bg = "transparent";
    fg = colors.text;
    shadowStyle = { ...shadows.card, shadowOpacity: 0, elevation: 0 };
  } else if (variant === "danger") {
    bg = colors.danger;
    fg = "#FFFFFF";
    shadowStyle = { ...shadows.card, shadowColor: colors.danger, shadowOpacity: 0.4, shadowRadius: 18 };
  } else if (variant === "ai") {
    bg = colors.mint;
    fg = "#06241E";
    shadowStyle = shadows.glowAi;
  } else if (variant === "outline") {
    bg = "transparent";
    fg = colors.primary;
    border = colors.primary;
    shadowStyle = { ...shadows.card, shadowOpacity: 0, elevation: 0 };
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        sizeStyle,
        shadowStyle,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === "secondary" || variant === "outline" ? 1 : 0,
          opacity: isDisabled ? 0.55 : pressed ? 0.88 : 1,
          width: fullWidth ? "100%" : undefined,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <View style={styles.row}>
          {leftIcon ? <View style={{ marginRight: spacing.sm }}>{leftIcon}</View> : null}
          <Text style={[styles.label, textSize, { color: fg, fontWeight: "700" }]}>
            {label}
          </Text>
          {rightIcon ? <View style={{ marginLeft: spacing.sm }}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    letterSpacing: 0.2,
  },
});
