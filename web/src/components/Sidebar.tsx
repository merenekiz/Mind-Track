"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const navItems = [
  {
    href: "/dashboard",
    label: "Kontrol Paneli",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/dashboard/new",
    label: "Yeni Kayıt",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    href: "/dashboard/history",
    label: "Geçmiş",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 14" />
      </svg>
    ),
  },
];

const analysisItems = [
  {
    href: "/dashboard/analysis",
    label: "Grafik Analizi",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path d="M3 3v18h18" />
        <path d="M18 17l-5-8-4 5-3-3" />
      </svg>
    ),
  },
  {
    href: "/dashboard/ai-comment",
    label: "AI Klinik Yorum",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path d="M12 2a4 4 0 0 1 4 4v1a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-1a3 3 0 0 1 3-3V6a4 4 0 0 1 4-4z" />
        <circle cx="9" cy="9" r="0.5" fill="currentColor" />
        <circle cx="15" cy="9" r="0.5" fill="currentColor" />
        <path d="M9 13h6" />
        <path d="M12 17v4" /><path d="M8 21h8" />
      </svg>
    ),
  },
  {
    href: "/dashboard/doctor-report",
    label: "Doktora Gönder",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M22 7l-10 7L2 7" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const renderNavItem = (item: { href: string; label: string; icon: React.ReactNode }) => {
    const isActive =
      item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center transition-all duration-150 ${
          isActive
            ? "text-mt-accent bg-mt-accent/10 font-semibold"
            : "text-mt-text2 hover:text-mt-text hover:bg-mt-surface2 font-medium"
        }`}
        style={{ gap: 16, padding: "14px 16px", borderRadius: 12, fontSize: 14 }}
      >
        <span className={isActive ? "text-mt-accent" : "text-mt-muted"}>
          {item.icon}
        </span>
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="bg-mt-surface border-r border-mt-border flex flex-col shrink-0 h-screen" style={{ width: 280 }}>
      {/* Logo */}
      <div className="border-b border-mt-border" style={{ padding: "32px 32px 28px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Mind<span className="text-mt-accent">Track</span>
        </h1>
        <p className="text-mt-muted" style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", marginTop: 8, fontWeight: 500 }}>
          Akıllı Sağlık Günlüğü
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: "32px 20px 24px" }}>
        <p className="text-mt-muted" style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600, padding: "0 16px", marginBottom: 16 }}>
          Menü
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {navItems.map(renderNavItem)}
        </div>

        {/* Analiz & AI */}
        <div style={{ marginTop: 32 }}>
          <p className="text-mt-muted" style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600, padding: "0 16px", marginBottom: 16 }}>
            Analiz & AI
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {analysisItems.map(renderNavItem)}
          </div>
        </div>
      </nav>

      {/* Bottom */}
      <div style={{ padding: "0 20px 24px" }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center text-mt-text2 hover:text-mt-text hover:bg-mt-surface2 transition-all duration-150 font-medium"
          style={{ gap: 16, padding: "14px 16px", borderRadius: 12, fontSize: 14, marginBottom: 16 }}
        >
          {theme === "dark" ? (
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" className="text-mt-muted">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" className="text-mt-muted">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          {theme === "dark" ? "Aydınlık Tema" : "Karanlık Tema"}
        </button>

        {/* User */}
        <div className="border-t border-mt-border" style={{ paddingTop: 20 }}>
          <div className="flex items-center" style={{ gap: 16, padding: "8px 16px" }}>
            <div className="bg-gradient-to-br from-mt-accent to-mt-purple flex items-center justify-center text-white shrink-0" style={{ width: 44, height: 44, borderRadius: 12, fontSize: 13, fontWeight: 700 }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-mt-text truncate" style={{ fontSize: 14, fontWeight: 600 }}>
                {user?.full_name}
              </p>
              <button
                onClick={handleLogout}
                className="text-mt-muted hover:text-mt-accent3 transition-colors"
                style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
