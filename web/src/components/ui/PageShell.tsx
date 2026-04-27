import { ReactNode } from "react";

interface PageShellProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  maxWidth?: number;
  eyebrow?: string;
}

export default function PageShell({
  title,
  subtitle,
  action,
  children,
  maxWidth = 1320,
  eyebrow,
}: PageShellProps) {
  return (
    <div className="flex flex-col h-full" style={{ background: "transparent" }}>
      <header
        className="flex items-center justify-between shrink-0 mt-glass"
        style={{
          height: 76,
          padding: "0 32px",
          borderBottom: "1px solid var(--mt-border)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div>
          {eyebrow && (
            <p
              style={{
                fontSize: 10,
                letterSpacing: 1.6,
                textTransform: "uppercase",
                fontWeight: 700,
                color: "var(--mt-text3)",
                marginBottom: 2,
              }}
            >
              {eyebrow}
            </p>
          )}
          <h1 style={{ fontSize: 19, fontWeight: 700, color: "var(--mt-text)", letterSpacing: "-0.01em" }}>
            {title}
          </h1>
          {subtitle && <p style={{ fontSize: 12.5, color: "var(--mt-text3)", marginTop: 2 }}>{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="flex-1 overflow-y-auto" style={{ padding: 32 }}>
        <div style={{ maxWidth, margin: "0 auto" }} className="animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
