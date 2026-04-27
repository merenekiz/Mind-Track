"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "ai" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  glow?: boolean;
}

const sizeMap: Record<Size, { px: string; fontSize: number; height: number; radius: number }> = {
  sm: { px: "0 16px", fontSize: 13, height: 38, radius: 12 },
  md: { px: "0 20px", fontSize: 14, height: 46, radius: 14 },
  lg: { px: "0 28px", fontSize: 15, height: 54, radius: 16 },
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  iconLeft,
  iconRight,
  fullWidth,
  glow,
  children,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const sz = sizeMap[size];

  const variantStyle: Record<Variant, React.CSSProperties> = {
    primary: {
      background: "var(--mt-gradient-primary)",
      color: "#fff",
      border: "1px solid color-mix(in oklab, var(--mt-primary-light) 60%, transparent)",
      boxShadow: glow !== false ? "var(--mt-shadow-glow)" : "var(--mt-shadow)",
    },
    secondary: {
      background: "var(--mt-surface2)",
      color: "var(--mt-text)",
      border: "1px solid var(--mt-border)",
      boxShadow: "var(--mt-shadow)",
    },
    ghost: {
      background: "transparent",
      color: "var(--mt-text2)",
      border: "1px solid transparent",
    },
    danger: {
      background: "var(--mt-danger)",
      color: "#fff",
      border: "1px solid transparent",
      boxShadow: "0 6px 22px color-mix(in oklab, var(--mt-danger) 40%, transparent)",
    },
    ai: {
      background: "var(--mt-gradient-ai)",
      color: "#06241E",
      border: "1px solid color-mix(in oklab, var(--mt-mint) 60%, transparent)",
      boxShadow: glow !== false ? "var(--mt-shadow-glow-ai)" : "var(--mt-shadow)",
      fontWeight: 700,
    },
    outline: {
      background: "transparent",
      color: "var(--mt-primary-light)",
      border: "1px solid color-mix(in oklab, var(--mt-primary) 60%, transparent)",
    },
  };

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: sz.px,
        height: sz.height,
        borderRadius: sz.radius,
        fontSize: sz.fontSize,
        fontWeight: 600,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.55 : 1,
        transition: "transform 0.12s ease, opacity 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease",
        width: fullWidth ? "100%" : undefined,
        letterSpacing: 0.1,
        ...variantStyle[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.filter = "brightness(1.05)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.filter = "brightness(1)";
      }}
    >
      {loading ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Spinner />
          {children}
        </span>
      ) : (
        <>
          {iconLeft}
          {children}
          {iconRight}
        </>
      )}
    </button>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="14 40" opacity="0.85" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
