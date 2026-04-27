import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { radius, shadows } from "../../lib/theme";

interface Props {
  size?: number;
  glyph?: string;
  pulsing?: boolean;
  style?: ViewStyle;
}

export function AIOrb({ size = 64, glyph = "✦", pulsing = true, style }: Props) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulsing) return;
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 1200,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(float, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(float, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, float, pulsing]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });

  return (
    <View style={[{ width: size * 1.6, height: size * 1.6, alignItems: "center", justifyContent: "center" }, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: radius.full,
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
            backgroundColor: colors.primary + "55",
          },
        ]}
      />
      <Animated.View
        style={[
          shadows.glow,
          {
            width: size,
            height: size,
            borderRadius: radius.full,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ translateY }],
            borderWidth: 2,
            borderColor: colors.primaryLight,
          },
        ]}
      >
        <View
          style={{
            width: size * 0.55,
            height: size * 0.55,
            borderRadius: radius.full,
            backgroundColor: colors.mint,
            opacity: 0.9,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: size * 0.32, color: "#06241E", fontWeight: "800" }}>{glyph}</Text>
        </View>
      </Animated.View>
    </View>
  );
}
