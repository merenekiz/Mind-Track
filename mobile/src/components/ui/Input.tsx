import React from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { radius, spacing, type } from "../../lib/theme";

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...rest
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={[{ marginBottom: spacing.base }, containerStyle]}>
      {label ? (
        <Text style={[type.label, { color: colors.text2, marginBottom: 6 }]}>
          {label.toUpperCase()}
        </Text>
      ) : null}
      <View
        style={[
          styles.box,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
          },
        ]}
      >
        {leftIcon ? <View style={{ marginRight: spacing.sm }}>{leftIcon}</View> : null}
        <TextInput
          {...rest}
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            { color: colors.text },
            style,
          ]}
        />
        {rightIcon ? <View style={{ marginLeft: spacing.sm }}>{rightIcon}</View> : null}
      </View>
      {error ? (
        <Text style={[type.caption, { color: colors.danger, marginTop: 4 }]}>{error}</Text>
      ) : hint ? (
        <Text style={[type.caption, { color: colors.text2, marginTop: 4 }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: spacing.md,
  },
});
