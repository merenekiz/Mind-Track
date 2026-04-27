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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        <View style={styles.brandWrap}>
          <AIOrb size={72} />
          <Text style={[type.h1, { color: colors.text, letterSpacing: -0.5, marginTop: spacing.base }]}>
            Mind<Text style={{ color: colors.primaryLight }}>Track</Text>
          </Text>
          <Text
            style={[
              type.label,
              { color: colors.text2, marginTop: spacing.xs },
            ]}
          >
            AI DESTEKLİ SAĞLIK GÜNLÜĞÜ
          </Text>
        </View>

        <Card variant="glass">
          <Text style={[type.h2, { color: colors.text, marginBottom: 4 }]}>Giriş Yap</Text>
          <Text style={[type.body, { color: colors.text2, marginBottom: spacing.lg }]}>
            Hesabınıza giriş yaparak sağlık takibinize devam edin.
          </Text>

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
            placeholder="Şifreniz"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            label="Giriş Yap"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.sm }}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate("Register")}
            style={{ marginTop: spacing.lg, alignItems: "center" }}
          >
            <Text style={[type.body, { color: colors.text2 }]}>
              Hesabınız yok mu?{" "}
              <Text style={{ color: colors.primary, fontWeight: "600" }}>Kayıt Ol</Text>
            </Text>
          </TouchableOpacity>
        </Card>

        <View style={{ alignItems: "center", marginTop: spacing.xl }}>
          <Text style={[type.caption, { color: colors.muted, textAlign: "center" }]}>
            MindTrack verilerini hiçbir zaman üçüncü taraflarla paylaşmaz.
          </Text>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brandWrap: {
    alignItems: "center",
    marginTop: spacing["2xl"],
    marginBottom: spacing["2xl"],
  },
});
