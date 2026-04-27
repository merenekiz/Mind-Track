import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Pressable,
  Alert,
  Linking,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { spacing, radius, shadows } from "../lib/theme";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Hesabınızdan çıkmak istediğinize emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: () => logout() },
    ]);
  };

  const initial = (user?.full_name?.[0] ?? user?.email?.[0] ?? "M").toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.appBar}>
        <Text style={[styles.appBarTitle, { color: colors.text }]}>Ayarlar</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View
          style={[
            styles.profileCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={[styles.avatar, shadows.glow, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarTxt}>{initial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {user?.full_name ?? "Kullanıcı"}
            </Text>
            <Text style={[styles.email, { color: colors.text3 }]} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
          <View
            style={[
              styles.activeChip,
              { backgroundColor: colors.success + "26", borderColor: colors.success + "55" },
            ]}
          >
            <Text style={[styles.activeChipTxt, { color: colors.success }]}>AKTİF</Text>
          </View>
        </View>

        <SectionTitle text="GÖRÜNÜM" colors={colors} />
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row
            glyph={theme === "dark" ? "🌙" : "☀️"}
            title="Karanlık mod"
            subtitle={theme === "dark" ? "Açık" : "Kapalı"}
            right={
              <Switch
                value={theme === "dark"}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
                style={styles.switch}
              />
            }
            colors={colors}
          />
        </View>

        <SectionTitle text="UYGULAMA" colors={colors} />
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row
            glyph="🔔"
            title="Bildirimler"
            right={<Tag text="Yakında" color={colors.text3} bg={colors.surface3} />}
            colors={colors}
          />
          <Divider colors={colors} />
          <Row glyph="🌐" title="Dil" subtitle="Türkçe" colors={colors} />
          <Divider colors={colors} />
          <Row glyph="📦" title="Veri senkronizasyonu" subtitle="Otomatik" colors={colors} />
        </View>

        <SectionTitle text="HAKKINDA" colors={colors} />
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row
            glyph="📄"
            title="Gizlilik politikası"
            onPress={() => Linking.openURL("https://example.com/privacy").catch(() => {})}
            colors={colors}
          />
          <Divider colors={colors} />
          <Row
            glyph="📑"
            title="Kullanım koşulları"
            onPress={() => Linking.openURL("https://example.com/terms").catch(() => {})}
            colors={colors}
          />
          <Divider colors={colors} />
          <Row glyph="🧠" title="Versiyon" subtitle="MindTrack 1.0.0" colors={colors} />
        </View>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            {
              backgroundColor: colors.danger + "1A",
              borderColor: colors.danger + "55",
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.logoutTxt, { color: colors.danger }]}>Çıkış Yap</Text>
        </Pressable>

        <Text style={[styles.disclaimer, { color: colors.muted }]}>
          Bu uygulama tıbbi tanı koymaz. Sonuçlar bilgilendirme amaçlıdır.
        </Text>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ text, colors }: { text: string; colors: any }) {
  return (
    <Text style={[styles.sectionTitle, { color: colors.text3 }]}>{text}</Text>
  );
}

interface RowProps {
  glyph: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  colors: any;
}

function Row({ glyph, title, subtitle, right, onPress, colors }: RowProps) {
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }: { pressed?: boolean }) => [
        styles.row,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: colors.surface2, borderColor: colors.border },
        ]}
      >
        <Text style={styles.rowGlyph}>{glyph}</Text>
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.rowSubtitle, { color: colors.text3 }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.rowRight}>
        {right ?? (onPress ? <Text style={[styles.chev, { color: colors.text3 }]}>›</Text> : null)}
      </View>
    </Wrapper>
  );
}

function Divider({ colors }: { colors: any }) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

function Tag({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.tagTxt, { color }]}>{text}</Text>
    </View>
  );
}

// Spacing scale (tutarlı dikey ritim):
//  - appBar bottom    -> 12
//  - profile padding  -> 16
//  - profile -> section title    -> 20
//  - section title -> group      -> 8
//  - group -> next section title -> 20
//  - last group -> logout        -> 24
//  - logout -> disclaimer        -> 16
const styles = StyleSheet.create({
  root: { flex: 1 },
  appBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 14,
    alignItems: "center",
  },
  appBarTitle: { fontSize: 18, fontWeight: "700", letterSpacing: -0.2 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 140,
  },

  // Profile
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadows.card,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { color: "#fff", fontSize: 24, fontWeight: "700" },
  profileInfo: { flex: 1, minWidth: 0, marginLeft: 16 },
  name: { fontSize: 16, fontWeight: "700", letterSpacing: -0.2 },
  email: { fontSize: 13, marginTop: 4 },
  activeChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    marginLeft: 10,
  },
  activeChipTxt: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },

  // Section title (kart üstü etiket)
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 6,
  },

  // Group (kart)
  group: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 18,
    minHeight: 76,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rowGlyph: { fontSize: 16, lineHeight: 18, textAlign: "center" },
  rowText: { flex: 1, minWidth: 0, marginLeft: 14 },
  rowTitle: { fontSize: 15, fontWeight: "600", letterSpacing: -0.1 },
  rowSubtitle: { fontSize: 12, marginTop: 3 },
  rowRight: { marginLeft: 10, alignItems: "flex-end", justifyContent: "center" },
  chev: { fontSize: 22, lineHeight: 22, fontWeight: "300" },
  switch: { transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 76,
  },

  // Tag
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  tagTxt: { fontSize: 10, fontWeight: "600", letterSpacing: 0.4 },

  // Logout + disclaimer
  logoutBtn: {
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
  },
  logoutTxt: { fontSize: 15, fontWeight: "600", letterSpacing: -0.1 },
  disclaimer: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
