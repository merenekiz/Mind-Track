"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import AuthAside from "@/components/AuthAside";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icons";

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
    if (password !== confirmPassword) return setError("Şifreler eşleşmiyor");
    if (password.length < 6) return setError("Şifre en az 6 karakter olmalıdır");

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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 48,
    borderRadius: 12,
    padding: "0 16px",
    fontSize: 14,
    background: "var(--mt-surface)",
    border: "1px solid var(--mt-border)",
    color: "var(--mt-text)",
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--mt-bg)" }}>
      <AuthAside />

      <div className="flex-1 flex items-center justify-center relative" style={{ padding: "48px 32px" }}>
        <button
          onClick={toggleTheme}
          className="absolute"
          style={{
            top: 24,
            right: 24,
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "var(--mt-surface)",
            border: "1px solid var(--mt-border)",
            color: "var(--mt-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}
        </button>

        <div className="w-full animate-fade-in" style={{ maxWidth: 420 }}>
          <div className="lg:hidden text-center" style={{ marginBottom: 48 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>
              Mind<span className="mt-text-grad-ai">Track</span>
            </h1>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em" }}>Hesap oluşturun</h2>
            <p style={{ fontSize: 14, color: "var(--mt-text2)", marginTop: 8 }}>
              MindTrack ile sağlık günlüğünüzü tutmaya başlayın.
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "color-mix(in oklab, var(--mt-danger) 10%, transparent)",
                border: "1px solid color-mix(in oklab, var(--mt-danger) 25%, transparent)",
                color: "var(--mt-danger)",
                padding: "12px 16px",
                borderRadius: 12,
                marginBottom: 20,
                fontSize: 13.5,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--mt-text2)", marginBottom: 8 }}>Ad Soyad</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} placeholder="Adınız Soyadınız" required autoComplete="name" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--mt-text2)", marginBottom: 8 }}>E-posta</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="ornek@mail.com" required autoComplete="email" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--mt-text2)", marginBottom: 8 }}>Şifre</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder="En az 6 karakter" required autoComplete="new-password" />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--mt-text2)", marginBottom: 8 }}>Şifre Tekrar</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="Şifrenizi tekrar girin" required autoComplete="new-password" />
            </div>

            <Button type="submit" loading={loading} fullWidth size="lg">
              {loading ? "Hesap oluşturuluyor…" : "Kayıt Ol"}
            </Button>
          </form>

          <p style={{ textAlign: "center", color: "var(--mt-text2)", fontSize: 13.5, marginTop: 28 }}>
            Zaten hesabınız var mı?{" "}
            <Link href="/login" style={{ color: "var(--mt-primary-light)", fontWeight: 600 }}>
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
