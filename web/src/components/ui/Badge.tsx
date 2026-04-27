import { ReactNode } from "react";

type Tone = "neutral" | "primary" | "success" | "warn" | "danger" | "ai";

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
}

const toneMap: Record<Tone, { bg: string; color: string }> = {
  neutral: { bg: "var(--mt-surface3)", color: "var(--mt-text2)" },
  primary: { bg: "color-mix(in oklab, var(--mt-primary) 18%, transparent)", color: "var(--mt-primary-light)" },
  success: { bg: "color-mix(in oklab, var(--mt-success) 18%, transparent)", color: "var(--mt-success)" },
  warn:    { bg: "color-mix(in oklab, var(--mt-warn) 18%, transparent)",    color: "var(--mt-warn)" },
  danger:  { bg: "color-mix(in oklab, var(--mt-danger) 18%, transparent)",  color: "var(--mt-danger)" },
  ai:      { bg: "color-mix(in oklab, var(--mt-ai) 18%, transparent)",      color: "var(--mt-ai)" },
};

export default function Badge({ tone = "neutral", children, dot }: BadgeProps) {
  const { bg, color } = toneMap[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        background: bg,
        color,
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.3,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />}
      {children}
    </span>
  );
}
