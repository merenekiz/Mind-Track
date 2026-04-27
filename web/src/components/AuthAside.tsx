// Shared brand panel — Login + Register sol kolonu

const FEATURES = [
  {
    title: "Akıllı Sağlık Takibi",
    desc: "Uyku, ağrı, stres ve beslenme verilerinizi tek bir günlükte birleştirin.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    title: "AI Destekli Yorum",
    desc: "Gemini Vision ve metin analiziyle semptomlarınız anlamlandırılır.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    title: "Bilimsel Kaynaklarla",
    desc: "PubMed literatürü ile desteklenmiş, kanıta dayalı öneriler.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
];

export default function AuthAside() {
  return (
    <div className="hidden lg:flex lg:w-[48%] relative items-center justify-center border-r border-mt-border overflow-hidden" style={{ background: "var(--mt-surface)" }}>
      {/* Decorative glows */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -120,
          left: -120,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,77,237,0.35) 0%, transparent 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: -120,
          right: -100,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(111,226,255,0.22) 0%, transparent 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: 460, padding: "0 48px", position: "relative" }}>
        {/* Logo lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "var(--mt-gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "var(--mt-shadow-glow)",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a4 4 0 0 0-4 4v0a4 4 0 0 0-4 4v3a4 4 0 0 0 4 4v0a4 4 0 0 0 4 4" />
              <path d="M12 3a4 4 0 0 1 4 4v0a4 4 0 0 1 4 4v3a4 4 0 0 1-4 4v0a4 4 0 0 1-4 4" />
            </svg>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--mt-text)" }}>
            Mind<span className="mt-text-grad-ai">Track</span>
          </h1>
        </div>

        <h2 style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.15, color: "var(--mt-text)", marginBottom: 16, letterSpacing: "-0.02em" }}>
          Sağlığınızı anlayan akıllı bir günlük.
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--mt-text2)", marginBottom: 40 }}>
          Somatik belirtilerinizi yapay zeka destekli analizlerle takip edin, kendinizi daha iyi tanıyın.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  flexShrink: 0,
                  background: "color-mix(in oklab, var(--mt-primary) 16%, transparent)",
                  color: "var(--mt-primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {f.icon}
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--mt-text)", marginBottom: 4 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "var(--mt-text2)", lineHeight: 1.55 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
