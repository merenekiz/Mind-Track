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
        {/* Profil */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
          <View style={[styles.activeChip, { backgroundColor: colors.success + "26", borderColor: colors.success + "55" }]}>
            <Text style={[styles.activeChipTxt, { color: colors.success }]}>AKTİF</Text>
          </View>
        </View>

        {/* GÖRÜNÜM */}
        <Text style={[styles.sectionTitle, { color: colors.text3 }]}>GÖRÜNÜM</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            colors={colors}
            iconBg={colors.primary + "26"}
            iconColor={colors.primary}
            glyph={theme === "dark" ? "🌙" : "☀️"}
            title="Karanlık Mod"
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
          />
        </View>

        {/* UYGULAMA */}
        <Text style={[styles.sectionTitle, { color: colors.text3 }]}>UYGULAMA</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            colors={colors}
            iconBg={colors.warn + "26"}
            iconColor={colors.warn}
            glyph="🔔"
            title="Bildirimler"
            subtitle="Yakında aktif"
            right={
              <View style={[styles.tag, { backgroundColor: colors.surface3 }]}>
                <Text style={[styles.tagTxt, { color: colors.text3 }]}>Yakında</Text>
              </View>
            }
          />
          <Divider colors={colors} />
          <SettingRow
            colors={colors}
            iconBg={colors.secondary + "26"}
            iconColor={colors.secondary}
            glyph="🌐"
            title="Dil"
            subtitle="Türkçe"
            right={<Text style={[styles.chev, { color: colors.text3 }]}>›</Text>}
          />
          <Divider colors={colors} />
          <SettingRow
            colors={colors}
            iconBg={colors.success + "26"}
            iconColor={colors.success}
            glyph="📦"
            title="Veri Senkronizasyonu"
            subtitle="Otomatik"
            right={<Text style={[styles.chev, { color: colors.text3 }]}>›</Text>}
          />
        </View>

        {/* HAKKINDA */}
        <Text style={[styles.sectionTitle, { color: colors.text3 }]}>HAKKINDA</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            colors={colors}
            iconBg={colors.secondary + "26"}
            iconColor={colors.secondary}
            glyph="📄"
            title="Gizlilik Politikası"
            subtitle="Verileriniz nasıl korunuyor"
            onPress={() => Linking.openURL("https://example.com/privacy").catch(() => {})}
            right={<Text style={[styles.chev, { color: colors.text3 }]}>›</Text>}
          />
          <Divider colors={colors} />
          <SettingRow
            colors={colors}
            iconBg={colors.primary + "26"}
            iconColor={colors.primary}
            glyph="📑"
            title="Kullanım Koşulları"
            subtitle="Hizmet şartları"
            onPress={() => Linking.openURL("https://example.com/terms").catch(() => {})}
            right={<Text style={[styles.chev, { color: colors.text3 }]}>›</Text>}
          />
          <Divider colors={colors} />
          <SettingRow
            colors={colors}
            iconBg={colors.danger + "26"}
            iconColor={colors.danger}
            glyph="ℹ"
            title="Versiyon"
            subtitle="Mind Track 1.0.0"
          />
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
          Bu uygulama tıbbi tanı koymaz.{"\n"}Sonuçlar bilgilendirme amaçlıdır.
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── SettingRow ──────────────────────────────────────────────────
// Tek satır: [icon kutusu]  [title + subtitle]  [right element]
// Sabit minHeight, yatay flex, hiçbir element taşmaz
interface RowProps {
  colors: any;
  iconBg: string;
  iconColor: string;
  glyph: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}

function SettingRow({ colors, iconBg, iconColor, glyph, title, subtitle, right, onPress }: RowProps) {
  const content = (
    <>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Text style={[styles.iconGlyph, { color: iconColor }]} allowFontScaling={false}>
          {glyph}
        </Text>
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.titleTxt, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitleTxt, { color: colors.text3 }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.rightCol}>{right}</View> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: colors.surface3 }}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={styles.row}>{content}</View>;
}

function Divider({ colors }: { colors: any }) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const ROW_PADDING_X = 14;
const ICON_SIZE = 32;
const ICON_GAP = 12;

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

  // Profil kartı
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { color: "#fff", fontSize: 22, fontWeight: "700" },
  profileInfo: { flex: 1, minWidth: 0, marginLeft: 14 },
  name: { fontSize: 16, fontWeight: "700", letterSpacing: -0.2 },
  email: { fontSize: 12, marginTop: 3 },
  activeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    marginLeft: 8,
  },
  activeChipTxt: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },

  // Section title
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 14,
  },

  // Group
  group: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },

  // Row — yatay flex, sabit minimum yükseklik
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    paddingHorizontal: ROW_PADDING_X,
    paddingVertical: 12,
  },

  // Icon kutusu — sabit kare, içerik tam ortada
  iconBox: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconGlyph: {
    fontSize: 17,
    lineHeight: 20,
    textAlign: "center",
    includeFontPadding: false,
  },

  // Text column — flex 1, taşmaz
  textCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: ICON_GAP,
    justifyContent: "center",
  },
  titleTxt: {
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: -0.1,
  },
  subtitleTxt: {
    fontSize: 12,
    marginTop: 2,
  },

  // Right column — sabit min genişlik, taşmaz
  rightCol: {
    marginLeft: 8,
    flexShrink: 0,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  chev: {
    fontSize: 22,
    lineHeight: 22,
    fontWeight: "300",
  },
  switch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },

  // Divider — icon hizasından sonra
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: ROW_PADDING_X + ICON_SIZE + ICON_GAP, // 14 + 32 + 12 = 58
  },

  // Tag (Yakında)
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  tagTxt: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
  },

  // Logout
  logoutBtn: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
  },
  logoutTxt: { fontSize: 15, fontWeight: "600", letterSpacing: -0.1 },

  disclaimer: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
