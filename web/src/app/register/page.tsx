"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const { register } = useAuth();
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
    <div className="min-h-screen flex items-center justify-center bg-mt-bg">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Mind<span className="text-mt-accent">Track</span>
          </h1>
          <p className="text-[10px] text-mt-muted tracking-[2px] uppercase mt-1">
            Akıllı Sağlık Günlüğü
          </p>
        </div>

        {/* Card */}
        <div className="bg-mt-surface border border-mt-border rounded-xl p-6">
          <h2 className="text-[15px] font-bold mb-1">Kayıt Ol</h2>
          <p className="text-[11px] text-mt-muted mb-6">Yeni hesap oluşturun</p>

          {error && (
            <div className="bg-mt-accent3/10 border border-mt-accent3/25 text-mt-accent3 px-3 py-2 rounded-lg mb-4 text-[12px]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] text-mt-muted uppercase tracking-wide mb-1">
                Ad Soyad
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-mt-surface2 border border-mt-border rounded-md px-3 py-2 text-[13px] text-mt-text outline-none transition-colors focus:border-mt-accent placeholder:text-mt-muted/60"
                placeholder="Adınız Soyadınız"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-mt-muted uppercase tracking-wide mb-1">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-mt-surface2 border border-mt-border rounded-md px-3 py-2 text-[13px] text-mt-text outline-none transition-colors focus:border-mt-accent placeholder:text-mt-muted/60"
                placeholder="ornek@mail.com"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-mt-muted uppercase tracking-wide mb-1">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-mt-surface2 border border-mt-border rounded-md px-3 py-2 text-[13px] text-mt-text outline-none transition-colors focus:border-mt-accent placeholder:text-mt-muted/60"
                placeholder="En az 6 karakter"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-mt-muted uppercase tracking-wide mb-1">
                Şifre Tekrar
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-mt-surface2 border border-mt-border rounded-md px-3 py-2 text-[13px] text-mt-text outline-none transition-colors focus:border-mt-accent placeholder:text-mt-muted/60"
                placeholder="Şifrenizi tekrar girin"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mt-accent text-black font-semibold py-2 rounded-md text-[13px] transition-opacity hover:opacity-85 disabled:opacity-45 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
            </button>
          </form>

          <p className="text-center text-mt-muted mt-5 text-[12px]">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="text-mt-accent hover:underline">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
