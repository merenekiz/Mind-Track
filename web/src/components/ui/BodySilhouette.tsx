"use client";

import { CSSProperties, useState } from "react";

export interface BodyPin {
  region: string;        // örn: "head"
  label: string;         // gösterim etiketi
  severity?: "low" | "medium" | "high";
  count?: number;
}

interface Props {
  pins?: BodyPin[];
  selectedRegion?: string | null;
  onSelectRegion?: (region: string) => void;
  view?: "front" | "back";
  height?: number;
  style?: CSSProperties;
}

// Bölge merkez koordinatları (viewBox 0 0 200 460)
const REGIONS_FRONT: Record<string, { x: number; y: number; label: string }> = {
  head:        { x: 100, y: 36,  label: "Baş" },
  neck:        { x: 100, y: 78,  label: "Boyun" },
  chest:       { x: 100, y: 130, label: "Göğüs" },
  abdomen:     { x: 100, y: 192, label: "Karın" },
  pelvis:      { x: 100, y: 244, label: "Pelvis" },
  shoulder_l:  { x: 64,  y: 110, label: "Sol Omuz" },
  shoulder_r:  { x: 136, y: 110, label: "Sağ Omuz" },
  arm_l:       { x: 50,  y: 168, label: "Sol Kol" },
  arm_r:       { x: 150, y: 168, label: "Sağ Kol" },
  hand_l:      { x: 38,  y: 248, label: "Sol El" },
  hand_r:      { x: 162, y: 248, label: "Sağ El" },
  thigh_l:     { x: 84,  y: 300, label: "Sol Uyluk" },
  thigh_r:     { x: 116, y: 300, label: "Sağ Uyluk" },
  knee_l:      { x: 84,  y: 360, label: "Sol Diz" },
  knee_r:      { x: 116, y: 360, label: "Sağ Diz" },
  foot_l:      { x: 84,  y: 432, label: "Sol Ayak" },
  foot_r:      { x: 116, y: 432, label: "Sağ Ayak" },
};

const SEVERITY_COLOR = {
  low: "var(--mt-success)",
  medium: "var(--mt-warn)",
  high: "var(--mt-danger)",
} as const;

export default function BodySilhouette({
  pins = [],
  selectedRegion,
  onSelectRegion,
  view = "front",
  height = 460,
  style,
}: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const regions = REGIONS_FRONT;
  const pinsByRegion = new Map(pins.map((p) => [p.region, p]));

  return (
    <div style={{ position: "relative", display: "inline-flex", ...style }}>
      <svg
        viewBox="0 0 200 460"
        height={height}
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="body-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--mt-surface3)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--mt-surface2)" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="body-stroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--mt-primary-light)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--mt-primary)" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {/* Anatomik silüet — düzgün, yumuşak */}
        {/* Baş */}
        <ellipse cx="100" cy="34" rx="20" ry="24" fill="url(#body-fill)" stroke="url(#body-stroke)" strokeWidth="1.5" />
        {/* Boyun */}
        <path
          d="M88 56 Q88 70 78 84 L122 84 Q112 70 112 56 Z"
          fill="url(#body-fill)"
          stroke="url(#body-stroke)"
          strokeWidth="1.5"
        />
        {/* Gövde + omuzlar */}
        <path
          d="M62 92 Q68 86 78 84 L122 84 Q132 86 138 92 L150 152 Q146 166 138 174 L132 240 Q124 252 116 252 L84 252 Q76 252 68 240 L62 174 Q54 166 50 152 Z"
          fill="url(#body-fill)"
          stroke="url(#body-stroke)"
          strokeWidth="1.5"
        />
        {/* Sol kol */}
        <path
          d="M50 152 Q44 200 42 232 Q40 252 38 268 L48 270 Q52 252 56 232 Q60 200 62 174 Z"
          fill="url(#body-fill)"
          stroke="url(#body-stroke)"
          strokeWidth="1.5"
        />
        {/* Sağ kol */}
        <path
          d="M150 152 Q156 200 158 232 Q160 252 162 268 L152 270 Q148 252 144 232 Q140 200 138 174 Z"
          fill="url(#body-fill)"
          stroke="url(#body-stroke)"
          strokeWidth="1.5"
        />
        {/* Sol el */}
        <ellipse cx="42" cy="278" rx="9" ry="13" fill="url(#body-fill)" stroke="url(#body-stroke)" strokeWidth="1.5" />
        {/* Sağ el */}
        <ellipse cx="158" cy="278" rx="9" ry="13" fill="url(#body-fill)" stroke="url(#body-stroke)" strokeWidth="1.5" />
        {/* Sol bacak */}
        <path
          d="M84 252 Q80 300 78 348 Q76 400 76 436 L92 436 Q94 400 96 348 Q98 300 100 252 Z"
          fill="url(#body-fill)"
          stroke="url(#body-stroke)"
          strokeWidth="1.5"
        />
        {/* Sağ bacak */}
        <path
          d="M116 252 Q120 300 122 348 Q124 400 124 436 L108 436 Q106 400 104 348 Q102 300 100 252 Z"
          fill="url(#body-fill)"
          stroke="url(#body-stroke)"
          strokeWidth="1.5"
        />
        {/* Ayaklar */}
        <ellipse cx="84" cy="446" rx="11" ry="6" fill="url(#body-fill)" stroke="url(#body-stroke)" strokeWidth="1.5" />
        <ellipse cx="116" cy="446" rx="11" ry="6" fill="url(#body-fill)" stroke="url(#body-stroke)" strokeWidth="1.5" />

        {/* Region click hotspots + pins */}
        {Object.entries(regions).map(([key, r]) => {
          const pin = pinsByRegion.get(key);
          const isSelected = selectedRegion === key;
          const isHover = hover === key;
          const color = pin ? SEVERITY_COLOR[pin.severity ?? "low"] : "var(--mt-primary)";
          const showRing = isSelected || isHover || pin;

          return (
            <g
              key={key}
              onMouseEnter={() => setHover(key)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelectRegion?.(key)}
              style={{ cursor: "pointer" }}
            >
              {/* Hotspot — invisible larger circle */}
              <circle cx={r.x} cy={r.y} r="16" fill="transparent" />

              {showRing && (
                <circle
                  cx={r.x}
                  cy={r.y}
                  r="13"
                  fill="none"
                  stroke={color}
                  strokeOpacity="0.3"
                  strokeWidth="2"
                />
              )}

              {pin ? (
                <>
                  <circle
                    cx={r.x}
                    cy={r.y}
                    r="6"
                    fill={color}
                    stroke="var(--mt-bg)"
                    strokeWidth="2"
                  />
                  {pin.count && pin.count > 1 && (
                    <text
                      x={r.x}
                      y={r.y + 3}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="700"
                      fill="#fff"
                    >
                      {pin.count}
                    </text>
                  )}
                </>
              ) : isHover || isSelected ? (
                <circle
                  cx={r.x}
                  cy={r.y}
                  r="4"
                  fill={color}
                  opacity={isSelected ? 1 : 0.65}
                />
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {(hover || selectedRegion) && (
        <div
          style={{
            position: "absolute",
            bottom: -12,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "6px 12px",
            background: "var(--mt-surface2)",
            border: "1px solid var(--mt-border)",
            borderRadius: 999,
            fontSize: 12,
            color: "var(--mt-text)",
            fontWeight: 600,
            whiteSpace: "nowrap",
            boxShadow: "var(--mt-shadow)",
            pointerEvents: "none",
          }}
        >
          {regions[(hover ?? selectedRegion) as string]?.label}
        </div>
      )}
    </div>
  );
}

export const BODY_REGIONS = REGIONS_FRONT;
