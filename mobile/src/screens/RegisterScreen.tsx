import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen, Card, Button, Input, AIOrb } from "../components/ui";
import { spacing, type } from "../lib/theme";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const { colors } = useTheme();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Hata", "Tüm alanlar gereklidir");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Hata", "Şifreler eşleşmiyor");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, fullName);
    } catch {
      Alert.alert("Hata", "Kayıt başarısız. Bu e-posta zaten kullanılıyor olabilir.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        <View style={styles.brandWrap}>
          <AIOrb size={64} />
          <Text style={[type.h2, { color: colors.text, letterSpacing: -0.5, marginTop: spacing.md }]}>
            Mind<Text style={{ color: colors.primaryLight }}>Track</Text>'e Katıl
          </Text>
          <Text
            style={[type.body, { color: colors.text2, marginTop: 6, textAlign: "center" }]}
          >
            AI destekli sağlık günlüğüne hoş geldin.
          </Text>
        </View>

        <Card variant="glass">
          <Text style={[type.h3, { color: colors.text, marginBottom: spacing.lg }]}>
            Hesap Oluştur
          </Text>

          <Input
            label="Ad Soyad"
            placeholder="Adınız Soyadınız"
            value={fullName}
            onChangeText={setFullName}
          />

          <Input
            label="E-posta"
            placeholder="ornek@mail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Şifre"
            placeholder="En az 6 karakter"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            hint="Şifre en az 6 karakter olmalıdır"
          />

          <Input
            label="Şifre Tekrar"
            placeholder="Şifrenizi tekrar girin"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Button
            label="Kayıt Ol"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.sm }}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            style={{ marginTop: spacing.lg, alignItems: "center" }}
          >
            <Text style={[type.body, { color: colors.text2 }]}>
              Zaten hesabınız var mı?{" "}
              <Text style={{ color: colors.primary, fontWeight: "600" }}>Giriş Yap</Text>
            </Text>
          </TouchableOpacity>
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brandWrap: {
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
});
