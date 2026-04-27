import React, { ReactNode } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { spacing, type } from "../../lib/theme";

interface Props {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  style?: ViewStyle;
}

export function Section({ title, subtitle, right, children, style }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, style]}>
      {title || right ? (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {title ? <Text style={[type.h3, { color: colors.text }]}>{title}</Text> : null}
            {subtitle ? (
              <Text style={[type.caption, { color: colors.text2, marginTop: 2 }]}>{subtitle}</Text>
            ) : null}
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
});
