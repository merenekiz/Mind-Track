"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır");
      return;
    }

    setLoading(true);
    try {
      await register(email, password, fullName);
      router.push("/dashboard");
    } catch {
      setError("Kayıt başarısız. Bu e-posta zaten kullanılıyor olabilir.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mt-bg flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-[48%] relative items-center justify-center bg-mt-surface border-r border-mt-border">
        <div style={{ width: "100%", maxWidth: 440, padding: "0 48px" }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 20 }}>
            Mind<span className="text-mt-accent">Track</span>
          </h1>
          <p className="text-mt-text2" style={{ fontSize: 17, lineHeight: 1.7, marginBottom: 48 }}>
            Sağlık verilerinizi takip edin, yapay zeka destekli analizlerle kendinizi daha iyi tanıyın.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {[
              { icon: "M9 12l2 2 4-4", label: "Günlük sağlık kaydı ve trend analizi" },
              { icon: "M13 10V3L4 14h7v7l9-11h-7z", label: "Yapay zeka destekli semptom yorumlama" },
              { icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", label: "Bilimsel literatür ile desteklenen öneriler" },
            ].map((f) => (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} className="bg-mt-accent/10 flex items-center justify-center">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" className="text-mt-accent">
                    <path d={f.icon} />
                  </svg>
                </div>
                <span className="text-mt-text2" style={{ fontSize: 15, lineHeight: 1.5 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center relative" style={{ padding: "64px 32px" }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="absolute border border-mt-border bg-mt-surface flex items-center justify-center text-mt-muted hover:text-mt-text hover:border-mt-border2 transition-all"
          style={{ top: 32, right: 32, width: 44, height: 44, borderRadius: 12 }}
          title={theme === "dark" ? "Aydınlık Tema" : "Karanlık Tema"}
        >
          {theme === "dark" ? (
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          ) : (
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        <div className="w-full animate-fade-in" style={{ maxWidth: 420 }}>
          {/* Mobile Logo */}
          <div className="lg:hidden text-center" style={{ marginBottom: 64 }}>
            <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em" }}>
              Mind<span className="text-mt-accent">Track</span>
            </h1>
            <p className="text-mt-muted" style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginTop: 12 }}>
              Akıllı Sağlık Günlüğü
            </p>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.1 }}>Kayıt Ol</h2>
            <p className="text-mt-muted" style={{ fontSize: 15, marginTop: 12, lineHeight: 1.6 }}>Yeni hesap oluşturun</p>
          </div>

          {error && (
            <div className="bg-mt-accent3/10 border border-mt-accent3/20 text-mt-accent3 flex items-center" style={{ padding: "16px 20px", borderRadius: 12, marginBottom: 32, fontSize: 14, gap: 12 }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" className="shrink-0">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 24 }}>
              <label className="block text-mt-text2" style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, letterSpacing: 0.3 }}>Ad Soyad</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-mt-surface border border-mt-border text-mt-text placeholder:text-mt-muted"
                style={{ height: 52, borderRadius: 12, padding: "0 20px", fontSize: 15 }}
                placeholder="Adınız Soyadınız"
                required
                autoComplete="name"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="block text-mt-text2" style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, letterSpacing: 0.3 }}>E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-mt-surface border border-mt-border text-mt-text placeholder:text-mt-muted"
                style={{ height: 52, borderRadius: 12, padding: "0 20px", fontSize: 15 }}
                placeholder="ornek@mail.com"
                required
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="block text-mt-text2" style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, letterSpacing: 0.3 }}>Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-mt-surface border border-mt-border text-mt-text placeholder:text-mt-muted"
                style={{ height: 52, borderRadius: 12, padding: "0 20px", fontSize: 15 }}
                placeholder="En az 6 karakter"
                required
                autoComplete="new-password"
              />
            </div>

            <div style={{ marginBottom: 36 }}>
              <label className="block text-mt-text2" style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, letterSpacing: 0.3 }}>Şifre Tekrar</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-mt-surface border border-mt-border text-mt-text placeholder:text-mt-muted"
                style={{ height: 52, borderRadius: 12, padding: "0 20px", fontSize: 15 }}
                placeholder="Şifrenizi tekrar girin"
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mt-accent text-black font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ height: 52, borderRadius: 12, fontSize: 15 }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Kayıt yapılıyor...
                </span>
              ) : "Kayıt Ol"}
            </button>
          </form>

          <p className="text-center text-mt-muted" style={{ fontSize: 14, marginTop: 48 }}>
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="text-mt-accent font-semibold hover:underline">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
