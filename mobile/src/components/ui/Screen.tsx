import React, { ReactNode } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  ViewStyle,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { spacing } from "../../lib/theme";

interface Props {
  children: ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: ("top" | "bottom" | "left" | "right")[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function Screen({
  children,
  scrollable = true,
  padded = true,
  style,
  contentStyle,
  edges = ["top", "left", "right"],
  onRefresh,
  refreshing,
}: Props) {
  const { colors, theme } = useTheme();

  const inner = (
    <View
      style={[
        { flex: 1, padding: padded ? spacing.base : 0, backgroundColor: colors.bg },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.safe, { backgroundColor: colors.bg }, style]}
    >
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.bg}
      />
      {scrollable ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});
