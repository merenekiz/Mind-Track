import { ReactNode } from "react";

interface SectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function Section({ title, description, action, children }: SectionProps) {
  return (
    <section style={{ marginBottom: 32 }}>
      <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--mt-text)", letterSpacing: "-0.01em" }}>{title}</h2>
          {description && <p style={{ fontSize: 13, color: "var(--mt-text2)", marginTop: 4 }}>{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--mt-text)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{title}</h1>
        {description && <p style={{ fontSize: 14, color: "var(--mt-text2)", marginTop: 8 }}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "56px 24px",
        background: "var(--mt-surface)",
        border: "1px dashed var(--mt-border2)",
        borderRadius: 16,
      }}
    >
      {icon && (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "color-mix(in oklab, var(--mt-primary) 12%, transparent)",
            color: "var(--mt-primary-light)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--mt-text)", marginBottom: 6 }}>{title}</h3>
      {description && <p style={{ fontSize: 13, color: "var(--mt-text2)", maxWidth: 360, margin: "0 auto 16px" }}>{description}</p>}
      {action}
    </div>
  );
}
