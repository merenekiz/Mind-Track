// MindTrack Design System v3 — AI Health Aesthetic
// Tokens: dark-first, 4pt grid base, glass surfaces, mint+purple+cyan triad
// Tipografi: Inter (sans), JetBrains Mono (mono / metrics)

export interface ThemeColors {
  // Surfaces
  bg: string;
  bgSoft: string;
  surface: string;
  surface2: string;
  surface3: string;
  surfaceGlass: string;
  border: string;
  border2: string;
  borderStrong: string;

  // Brand
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  mint: string;
  ai: string;

  // Status
  success: string;
  warn: string;
  danger: string;
  info: string;

  // Text
  text: string;
  text2: string;
  text3: string;
  muted: string;

  // Decorative
  glow: string;
  overlay: string;

  // Legacy (geriye uyumluluk)
  accent: string;
  accent2: string;
  accent3: string;
  accent4: string;
  purple: string;
}

export const darkColors: ThemeColors = {
  // Dark surfaces — neredeyse siyah, hafif mavi yan ton
  bg: "#07070C",
  bgSoft: "#0B0B14",
  surface: "#10101C",
  surface2: "#161628",
  surface3: "#1E1E33",
  surfaceGlass: "rgba(22,22,40,0.72)",
  border: "#23233D",
  border2: "#2D2D4A",
  borderStrong: "#3A3A5E",

  // Brand triad
  primary: "#7C5AED",       // MindTrack purple — biraz daha mavimsi
  primaryDark: "#5E3FD3",
  primaryLight: "#A38BF5",
  secondary: "#2DAFFE",     // Vivid cyan
  mint: "#5EE6C7",          // Fresh mint
  ai: "#5EE6C7",            // AI vurgusu mint olur (gradient sonu)

  // Status — yumuşak/modern
  success: "#2BCE89",
  warn: "#F4B740",
  danger: "#FF5C7A",
  info: "#2DAFFE",

  // Text scale
  text: "#F5F5FA",
  text2: "#B8B8CC",
  text3: "#8A8AA3",
  muted: "#5E5E7A",

  glow: "rgba(124,90,237,0.45)",
  overlay: "rgba(7,7,12,0.7)",

  // Legacy
  accent: "#7C5AED",
  accent2: "#2DAFFE",
  accent3: "#FF5C7A",
  accent4: "#2BCE89",
  purple: "#A38BF5",
};

export const lightColors: ThemeColors = {
  bg: "#F5F5FA",
  bgSoft: "#ECECF3",
  surface: "#FFFFFF",
  surface2: "#F8F8FC",
  surface3: "#EFEFF6",
  surfaceGlass: "rgba(255,255,255,0.72)",
  border: "#E2E2EC",
  border2: "#CFCFDD",
  borderStrong: "#B8B8CC",

  primary: "#6B46E0",
  primaryDark: "#4F32B8",
  primaryLight: "#9B82F0",
  secondary: "#1F8FD9",
  mint: "#22B894",
  ai: "#22B894",

  success: "#1FAE73",
  warn: "#D89A12",
  danger: "#E84865",
  info: "#1F8FD9",

  text: "#0E0E1A",
  text2: "#41415A",
  text3: "#6B6B85",
  muted: "#8B8BA6",

  glow: "rgba(107,70,224,0.25)",
  overlay: "rgba(245,245,250,0.7)",

  accent: "#6B46E0",
  accent2: "#1F8FD9",
  accent3: "#E84865",
  accent4: "#1FAE73",
  purple: "#6B46E0",
};

// Spacing — 4pt base grid
export const spacing = {
  "0.5": 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 56,
  "5xl": 64,
  "6xl": 80,
} as const;

// Radius — daha yuvarlak, modern
export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  "2xl": 32,
  full: 9999,
} as const;

// Typography
export const type = {
  display: { fontSize: 40, fontWeight: "700" as const, lineHeight: 46, letterSpacing: -0.5 },
  h1:      { fontSize: 30, fontWeight: "700" as const, lineHeight: 38, letterSpacing: -0.3 },
  h2:      { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  h3:      { fontSize: 17, fontWeight: "600" as const, lineHeight: 24 },
  body:    { fontSize: 14, fontWeight: "400" as const, lineHeight: 22 },
  bodyLg:  { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
  caption: { fontSize: 12, fontWeight: "500" as const, lineHeight: 18 },
  label:   { fontSize: 11, fontWeight: "700" as const, lineHeight: 14, letterSpacing: 1.2 },
  metric:  { fontSize: 30, fontWeight: "700" as const, lineHeight: 34, letterSpacing: -0.5 },
} as const;

// Shadows — RN için (web glass blur'u burada simüle ederiz)
type ShadowStyle = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

export const shadows: Record<"card" | "cardLg" | "glow" | "glowAi", ShadowStyle> = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  cardLg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 10,
  },
  glow: {
    shadowColor: "#7C5AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  glowAi: {
    shadowColor: "#5EE6C7",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 10,
  },
};

// Gradient endpoint çiftleri (LinearGradient kullanılırken)
export const gradients = {
  primary: ["#7C5AED", "#5E3FD3"] as const,
  ai: ["#2DAFFE", "#5EE6C7"] as const,
  glow: ["#A38BF5", "#7C5AED", "#2DAFFE"] as const,
  card: ["rgba(124,90,237,0.10)", "rgba(124,90,237,0)"] as const,
  warm: ["#FF8B6B", "#F4B740"] as const,
  fresh: ["#2BCE89", "#5EE6C7"] as const,
} as const;

// Aktif palet — runtime'da ThemeContext üzerinden değişir
export let colors: ThemeColors = darkColors;

export function setActiveColors(theme: "dark" | "light") {
  colors = theme === "dark" ? darkColors : lightColors;
}
