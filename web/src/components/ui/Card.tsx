import { CSSProperties, HTMLAttributes, ReactNode } from "react";

type CardVariant = "default" | "elevated" | "gradient" | "outline" | "glass" | "glow" | "ai";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: number | string;
  radius?: number;
}

export default function Card({
  variant = "default",
  padding = 24,
  radius = 18,
  style,
  children,
  className,
  ...rest
}: CardProps) {
  const variantStyle: Record<CardVariant, CSSProperties> = {
    default: {
      background: "var(--mt-surface)",
      border: "1px solid var(--mt-border)",
      boxShadow: "var(--mt-shadow), var(--mt-shadow-inner)",
    },
    elevated: {
      background: "var(--mt-surface)",
      border: "1px solid var(--mt-border)",
      boxShadow: "var(--mt-shadow-lg), var(--mt-shadow-inner)",
    },
    gradient: {
      background: "var(--mt-gradient-card), var(--mt-surface)",
      border: "1px solid var(--mt-border)",
      boxShadow: "var(--mt-shadow), var(--mt-shadow-inner)",
    },
    outline: {
      background: "transparent",
      border: "1px solid var(--mt-border)",
    },
    glass: {
      background: "var(--mt-glass)",
      backdropFilter: "blur(18px) saturate(160%)",
      WebkitBackdropFilter: "blur(18px) saturate(160%)",
      border: "1px solid var(--mt-border)",
      boxShadow: "var(--mt-shadow-lg)",
    },
    glow: {
      background: "var(--mt-surface2)",
      border: "1px solid color-mix(in oklab, var(--mt-primary) 35%, transparent)",
      boxShadow: "var(--mt-shadow-glow)",
    },
    ai: {
      background:
        "linear-gradient(180deg, color-mix(in oklab, var(--mt-mint) 10%, var(--mt-surface2)) 0%, var(--mt-surface) 70%)",
      border: "1px solid color-mix(in oklab, var(--mt-mint) 35%, transparent)",
      boxShadow: "var(--mt-shadow-glow-ai)",
    },
  };

  return (
    <div
      {...rest}
      className={className}
      style={{
        borderRadius: radius,
        padding,
        position: "relative",
        ...variantStyle[variant],
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
  accent?: "primary" | "ai" | "warn" | "success" | "danger";
}

const accentColor = {
  primary: "var(--mt-primary)",
  ai: "var(--mt-mint)",
  warn: "var(--mt-warn)",
  success: "var(--mt-success)",
  danger: "var(--mt-danger)",
} as const;

export function CardHeader({ title, subtitle, action, icon, accent = "primary" }: CardHeaderProps) {
  const c = accentColor[accent];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        {icon && (
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: `color-mix(in oklab, ${c} 15%, transparent)`,
              border: `1px solid color-mix(in oklab, ${c} 30%, transparent)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: c,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--mt-text)", lineHeight: 1.3, letterSpacing: "-0.01em" }}>{title}</h3>
          {subtitle && <p style={{ fontSize: 12, color: "var(--mt-text3)", marginTop: 4 }}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
