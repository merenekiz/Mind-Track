"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Icon } from "@/components/ui/Icons";
import { ReactNode } from "react";

type NavItem = { href: string; label: string; icon: ReactNode };

const primary: NavItem[] = [
  { href: "/dashboard", label: "Genel bakış", icon: <Icon.Overview /> },
  { href: "/dashboard/history", label: "Günlük", icon: <Icon.Notebook /> },
  { href: "/dashboard/analizler", label: "Analiz", icon: <Icon.Chart /> },
  { href: "/dashboard/belirtiler", label: "Belirtiler", icon: <Icon.Heart /> },
  { href: "/dashboard/uyku", label: "Uyku", icon: <Icon.Moon /> },
  { href: "/dashboard/beslenme", label: "Beslenme", icon: <Icon.Apple /> },
];

const secondary: NavItem[] = [
  { href: "/dashboard/ai-sohbet", label: "MindTrack AI", icon: <Icon.Sparkle /> },
  { href: "/dashboard/raporlar", label: "Raporlar", icon: <Icon.Document /> },
  { href: "/dashboard/ayarlar", label: "Ayarlar", icon: <Icon.Settings /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link key={item.href} href={item.href} className={`lm-nav-item${active ? " active" : ""}`}>
        <span style={{ display: "inline-flex", color: active ? "#fff" : "var(--n-400)" }}>
          {item.icon}
        </span>
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="lm-sidebar shrink-0 h-screen sticky top-0" style={{ width: 232 }}>
      {/* Brand */}
      <div className="brand">
        <div className="logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 18C5 14 7 11 12 11s7 3 7 7" />
            <circle cx="12" cy="7" r="3" />
            <path d="M9 18v3M15 18v3" />
          </svg>
        </div>
        MindTrack
      </div>

      {primary.map(renderItem)}
      <div className="lm-nav-divider" />
      {secondary.map(renderItem)}

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="lm-nav-item"
        style={{
          background: "transparent",
          border: "none",
          marginTop: 4,
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
          font: "inherit",
        }}
      >
        <span style={{ color: "var(--n-400)" }}>
          {theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}
        </span>
        {theme === "dark" ? "Aydınlık" : "Karanlık"}
      </button>

      {/* User card */}
      <div className="lm-user-card">
        <div className="avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.full_name?.split(" ")[0] ?? "—"}
          </div>
          <div className="plan">Premium</div>
        </div>
        <button
          onClick={handleLogout}
          title="Çıkış"
          style={{
            background: "none",
            border: "none",
            padding: 4,
            color: "var(--n-400)",
            cursor: "pointer",
          }}
        >
          <Icon.Logout width={16} height={16} />
        </button>
      </div>
    </aside>
  );
}
