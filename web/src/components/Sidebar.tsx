"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const navItems = [
  {
    section: "Ana Menü",
    items: [
      {
        href: "/dashboard",
        label: "Kontrol Paneli",
        icon: (
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },
      {
        href: "/dashboard/new",
        label: "Manuel Giriş",
        icon: (
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Kayıtlar",
    items: [
      {
        href: "/dashboard/history",
        label: "Geçmiş",
        icon: (
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      },
    ],
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

  return (
    <aside className="w-[215px] bg-mt-surface border-r border-mt-border flex flex-col shrink-0 h-screen transition-colors duration-200">
      {/* Logo */}
      <div className="px-4 pt-5 pb-3.5 border-b border-mt-border">
        <div className="text-[19px] font-extrabold tracking-tight">
          Mind<span className="text-mt-accent">Track</span>
        </div>
        <div className="text-[10px] text-mt-muted tracking-[2px] uppercase mt-0.5">
          Akıllı Sağlık Günlüğü
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2.5 overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.section}>
            <div className="text-[10px] text-mt-muted tracking-[2px] uppercase px-4 pt-3 pb-1">
              {group.section}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-l-2 transition-all duration-150 ${
                    isActive
                      ? "text-mt-accent border-l-mt-accent bg-mt-accent/5"
                      : "text-mt-muted border-l-transparent hover:text-mt-text hover:bg-mt-surface2"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-mt-border">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-[12px] text-mt-muted hover:text-mt-text hover:bg-mt-surface2 transition-colors"
        >
          {theme === "dark" ? (
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          {theme === "dark" ? "Aydınlık Tema" : "Karanlık Tema"}
        </button>

        {/* User Bar */}
        <div className="px-4 py-3 border-t border-mt-border flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-mt-accent2 to-mt-accent rounded-full flex items-center justify-center text-[11px] font-bold text-black shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">{user?.full_name}</div>
            <button
              onClick={handleLogout}
              className="text-[11px] text-mt-muted hover:text-mt-accent3 transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
