"use client";

import { CSSProperties } from "react";

interface AIOrbProps {
  size?: number;
  pulsing?: boolean;
  glyph?: string;
  style?: CSSProperties;
}

export default function AIOrb({ size = 96, pulsing = true, glyph = "✦", style }: AIOrbProps) {
  return (
    <div
      style={{
        width: size * 1.6,
        height: size * 1.6,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {/* Outer pulse ring */}
      {pulsing && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            margin: "auto",
            width: size,
            height: size,
            borderRadius: "50%",
            background: "var(--mt-gradient-glow)",
            opacity: 0.35,
            filter: "blur(18px)",
            animation: "ai-pulse 2.6s ease-in-out infinite",
          }}
        />
      )}

      {/* Slow rotating gradient halo */}
      <span
        aria-hidden
        className="animate-spin-slow"
        style={{
          position: "absolute",
          inset: 0,
          margin: "auto",
          width: size * 1.35,
          height: size * 1.35,
          borderRadius: "50%",
          background:
            "conic-gradient(from 0deg, var(--mt-primary), var(--mt-secondary), var(--mt-mint), var(--mt-primary))",
          opacity: 0.55,
          filter: "blur(12px)",
        }}
      />

      {/* Core orb */}
      <div
        className="animate-orb-float"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "var(--mt-gradient-primary)",
          border: "2px solid color-mix(in oklab, var(--mt-primary-light) 60%, transparent)",
          boxShadow: "var(--mt-shadow-glow), inset 0 0 30px rgba(255,255,255,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Inner mint disc */}
        <div
          style={{
            width: size * 0.55,
            height: size * 0.55,
            borderRadius: "50%",
            background: "var(--mt-gradient-ai)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "inset 0 0 18px rgba(255,255,255,0.25), 0 0 24px var(--mt-mint)",
          }}
        >
          <span style={{ fontSize: size * 0.32, color: "#06241E", fontWeight: 800 }}>{glyph}</span>
        </div>
      </div>
    </div>
  );
}
