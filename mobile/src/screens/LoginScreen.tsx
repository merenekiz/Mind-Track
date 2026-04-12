import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Hata", "E-posta ve şifre gereklidir");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      Alert.alert("Hata", "E-posta veya şifre hatalı");
    } finally {
      setLoading(false);
    }
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
    logoWrap: { alignItems: "center", marginBottom: 36 },
    logoText: { fontSize: 30, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
    logoAccent: { color: colors.accent },
    logoSub: { fontSize: 10, color: colors.muted, letterSpacing: 2, marginTop: 4 },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 20,
    },
    cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 2 },
    cardSub: { fontSize: 11, color: colors.muted, marginBottom: 20 },
    label: { fontSize: 10, color: colors.muted, letterSpacing: 0.8, marginBottom: 5, marginTop: 12 },
    input: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      color: colors.text,
    },
    btn: {
      backgroundColor: colors.accent,
      borderRadius: 6,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 18,
    },
    btnDisabled: { opacity: 0.45 },
    btnText: { color: "#000", fontSize: 13, fontWeight: "700" },
    linkWrap: { marginTop: 18, alignItems: "center" },
    linkMuted: { fontSize: 12, color: colors.muted },
    linkAccent: { color: colors.accent },
  }), [colors]);

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.logoWrap}>
          <Text style={s.logoText}>
            Mind<Text style={s.logoAccent}>Track</Text>
          </Text>
          <Text style={s.logoSub}>AKILLI SAĞLIK GÜNLÜĞÜ</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Giriş Yap</Text>
          <Text style={s.cardSub}>Hesabınıza giriş yapın</Text>

          <Text style={s.label}>E-POSTA</Text>
          <TextInput
            style={s.input}
            placeholder="ornek@mail.com"
            placeholderTextColor={colors.muted + "99"}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={s.label}>ŞİFRE</Text>
          <TextInput
            style={s.input}
            placeholder="Şifreniz"
            placeholderTextColor={colors.muted + "99"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={s.btnText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Register")} style={s.linkWrap}>
            <Text style={s.linkMuted}>
              Hesabınız yok mu? <Text style={s.linkAccent}>Kayıt Ol</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
