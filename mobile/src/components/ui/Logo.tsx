/**
 * MindTrack mobil logo component.
 *
 * Logo dosyaları `mobile/src/assets/logo/` altında olmalı:
 *   - logo.png      (1x — en az 256x256)
 *   - logo@2x.png   (2x)
 *   - logo@3x.png   (3x)
 *
 * React Native otomatik olarak ekran yoğunluğuna göre doğru çözünürlüğü seçer.
 *
 * Kullanım:
 *   <Logo size={72} />
 */
import React, { useState } from "react";
import { Image, ImageStyle, StyleProp, View, Text } from "react-native";

interface LogoProps {
  /** Yükseklik (px). Genişlik orana göre otomatik ayarlanır. */
  size?: number;
  /** "wide" (default) — dikdörtgen logo (yazı dahil), "square" — kare placeholder benzeri */
  variant?: "wide" | "square";
  style?: StyleProp<ImageStyle>;
}

// Logo asset'i runtime'da yüklenir. Dosya henüz konmadıysa Metro bundler hatası
// fırlatmasın diye try/catch ile sarılı.
let logoSource: number | null = null;
try {
  logoSource = require("../../assets/logo/logo.png");
} catch {
  logoSource = null;
}

export function Logo({ size = 64, variant = "wide", style }: LogoProps) {
  const [errored, setErrored] = useState(false);

  if (!logoSource || errored) {
    // Placeholder — logo dosyası eklenmeden önce
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.22,
          backgroundColor: "#7C5AED",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: size * 0.45, fontWeight: "800", color: "#fff" }}>M</Text>
      </View>
    );
  }

  // wide variant: dikdörtgen (1.5:1 aspect ratio) — sen yazı içeren logoda kullan
  // square variant: kare 1:1
  const width = variant === "wide" ? size * 1.5 : size;

  return (
    <Image
      source={logoSource}
      style={[{ width, height: size, resizeMode: "contain" }, style]}
      onError={() => setErrored(true)}
    />
  );
}

export default Logo;
