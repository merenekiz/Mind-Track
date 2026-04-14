// MindTrack Theme System
// Dark ve Light tema renk paletleri

export interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  border: string;
  border2: string;
  accent: string;
  accent2: string;
  accent3: string;
  accent4: string;
  text: string;
  muted: string;
  warn: string;
  purple: string;
}

export const darkColors: ThemeColors = {
  bg: "#060a10",
  surface: "#0d1420",
  surface2: "#131c2c",
  surface3: "#192236",
  border: "#1a2840",
  border2: "#223050",
  accent: "#00d4ff",
  accent2: "#7b5ea7",
  accent3: "#ff6b6b",
  accent4: "#00e676",
  text: "#dce8f5",
  muted: "#4a6480",
  warn: "#ffb347",
  purple: "#a78bfa",
};

export const lightColors: ThemeColors = {
  bg: "#f4f6f9",
  surface: "#ffffff",
  surface2: "#f0f2f5",
  surface3: "#e8ecf1",
  border: "#d8dfe8",
  border2: "#c5cdd8",
  accent: "#0094cc",
  accent2: "#6b4f96",
  accent3: "#e04545",
  accent4: "#00a65a",
  text: "#1a2332",
  muted: "#6b7f96",
  warn: "#d48a2c",
  purple: "#7c5cbf",
};

// Varsayılan olarak dark tema aktif — runtime'da ThemeContext üzerinden değişir
export let colors: ThemeColors = darkColors;

export function setActiveColors(theme: "dark" | "light") {
  colors = theme === "dark" ? darkColors : lightColors;
}
