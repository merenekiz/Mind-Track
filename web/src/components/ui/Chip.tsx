"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export default function Chip({ active = false, icon, children, style, ...rest }: ChipProps) {
  return (
    <button
      {...rest}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        background: active ? "color-mix(in oklab, var(--mt-primary) 18%, transparent)" : "var(--mt-surface2)",
        color: active ? "var(--mt-primary-light)" : "var(--mt-text2)",
        border: `1px solid ${active ? "color-mix(in oklab, var(--mt-primary) 35%, transparent)" : "var(--mt-border)"}`,
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s ease",
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}
