import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
import { TabBar, type TabItem } from "../components/ui";
import HomeScreen from "./HomeScreen";
import AnalyticsScreen from "./AnalyticsScreen";
import InsightScreen from "./InsightScreen";
import SettingsScreen from "./SettingsScreen";

type Props = { navigation: NativeStackNavigationProp<any> };

const TABS: TabItem[] = [
  { key: "home", glyph: "⌂" },
  { key: "analytics", glyph: "▤" },
  { key: "fab", glyph: "+", fab: true },
  { key: "insight", glyph: "✦" },
  { key: "settings", glyph: "⚙" },
];

export default function MainTabsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [active, setActive] = useState<string>("home");

  const handleTab = (key: string) => {
    if (key === "fab") {
      navigation.navigate("NewHealthData");
      return;
    }
    setActive(key);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={{ flex: 1 }}>
        {active === "home" && <HomeScreen onOpenNew={() => navigation.navigate("NewHealthData")} />}
        {active === "analytics" && <AnalyticsScreen />}
        {active === "insight" && <InsightScreen />}
        {active === "settings" && <SettingsScreen />}
      </View>

      <TabBar tabs={TABS} active={active} onChange={handleTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
