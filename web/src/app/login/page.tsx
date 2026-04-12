"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      setError("E-posta veya şifre hatalı");
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
          <h2 className="text-[15px] font-bold mb-1">Giriş Yap</h2>
          <p className="text-[11px] text-mt-muted mb-6">Hesabınıza giriş yapın</p>

          {error && (
            <div className="bg-mt-accent3/10 border border-mt-accent3/25 text-mt-accent3 px-3 py-2 rounded-lg mb-4 text-[12px]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
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
                placeholder="Şifreniz"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mt-accent text-black font-semibold py-2 rounded-md text-[13px] transition-opacity hover:opacity-85 disabled:opacity-45 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <p className="text-center text-mt-muted mt-5 text-[12px]">
            Hesabınız yok mu?{" "}
            <Link href="/register" className="text-mt-accent hover:underline">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
