import { ReactNode } from "react";

export interface AIInsightData {
  summary: string;
  reason?: string;
  risk?: { level: "low" | "medium" | "high"; label: string };
  suggestion?: string;
  confidence?: number; // 0-1
  sources?: { title: string; url?: string }[];
}

interface AIInsightProps {
  data: AIInsightData;
  loading?: boolean;
  title?: string;
  action?: ReactNode;
}

const riskMap = {
  low:    { color: "var(--mt-success)", label: "Düşük Risk" },
  medium: { color: "var(--mt-warn)",    label: "Orta Risk" },
  high:   { color: "var(--mt-danger)",  label: "Yüksek Risk" },
} as const;

export default function AIInsight({ data, loading, title = "AI Klinik Yorum", action }: AIInsightProps) {
  if (loading) return <AIInsightSkeleton />;

  const risk = data.risk ? riskMap[data.risk.level] : null;
  const confidencePct = data.confidence !== undefined ? Math.round(data.confidence * 100) : null;

  return (
    <div
      style={{
        position: "relative",
        background: "var(--mt-surface)",
        border: "1px solid var(--mt-border)",
        borderRadius: 20,
        padding: 24,
        overflow: "hidden",
      }}
    >
      {/* Glow accent */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -1,
          borderRadius: 20,
          padding: 1,
          background: "var(--mt-gradient-ai)",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            className="animate-ai-pulse"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "var(--mt-gradient-ai)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0A0E1A",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--mt-ai)" }}>
              MindTrack AI
            </p>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--mt-text)", marginTop: 2 }}>{title}</h3>
          </div>
        </div>
        {action}
      </div>

      {/* Summary */}
      <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--mt-text)", marginBottom: 16 }}>{data.summary}</p>

      {/* Reason */}
      {data.reason && (
        <Block label="Gerekçe" tone="neutral">
          {data.reason}
        </Block>
      )}

      {/* Risk + Suggestion grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        {risk && (
          <Block label="Risk Seviyesi" tone="custom" color={risk.color}>
            <span style={{ fontSize: 14, fontWeight: 700, color: risk.color }}>{data.risk!.label || risk.label}</span>
          </Block>
        )}
        {data.suggestion && (
          <Block label="Öneri" tone="custom" color="var(--mt-primary)">
            {data.suggestion}
          </Block>
        )}
      </div>

      {/* Confidence */}
      {confidencePct !== null && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--mt-border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--mt-muted)", fontWeight: 600 }}>Güven Skoru</span>
            <span style={{ fontSize: 13, color: "var(--mt-text)", fontWeight: 700 }}>%{confidencePct}</span>
          </div>
          <div style={{ height: 6, background: "var(--mt-surface3)", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${confidencePct}%`,
                background: "var(--mt-gradient-ai)",
                borderRadius: 999,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Sources */}
      {data.sources && data.sources.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--mt-border)" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "var(--mt-muted)", marginBottom: 8 }}>
            Bilimsel Kaynaklar
          </p>
          <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.sources.map((s, i) => (
              <li key={i} style={{ fontSize: 12, color: "var(--mt-text2)" }}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "var(--mt-secondary)", textDecoration: "underline" }}>
                    {s.title}
                  </a>
                ) : (
                  s.title
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Block({ label, children, tone, color }: { label: string; children: ReactNode; tone?: "neutral" | "custom"; color?: string }) {
  const accent = tone === "custom" && color ? color : "var(--mt-primary)";
  return (
    <div
      style={{
        background: `color-mix(in oklab, ${accent} 8%, var(--mt-surface2))`,
        border: `1px solid color-mix(in oklab, ${accent} 25%, var(--mt-border))`,
        borderRadius: 12,
        padding: "12px 14px",
      }}
    >
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--mt-muted)", marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--mt-text)" }}>{children}</p>
    </div>
  );
}

export function AIInsightSkeleton() {
  return (
    <div
      style={{
        background: "var(--mt-surface)",
        border: "1px solid var(--mt-border)",
        borderRadius: 20,
        padding: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div className="animate-shimmer" style={{ width: 40, height: 40, borderRadius: 12 }} />
        <div style={{ flex: 1 }}>
          <div className="animate-shimmer" style={{ width: 100, height: 10, borderRadius: 4, marginBottom: 6 }} />
          <div className="animate-shimmer" style={{ width: 180, height: 16, borderRadius: 4 }} />
        </div>
      </div>
      <div className="animate-shimmer" style={{ height: 14, borderRadius: 4, marginBottom: 8 }} />
      <div className="animate-shimmer" style={{ height: 14, borderRadius: 4, marginBottom: 8, width: "85%" }} />
      <div className="animate-shimmer" style={{ height: 14, borderRadius: 4, width: "60%" }} />
      <p style={{ marginTop: 16, fontSize: 12, color: "var(--mt-muted)", textAlign: "center" }}>AI verilerinizi analiz ediyor…</p>
    </div>
  );
}
