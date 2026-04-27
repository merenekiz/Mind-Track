"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import PageShell from "@/components/ui/PageShell";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icons";

export default function AyarlarPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);
  const [aiAutoRun, setAiAutoRun] = useState(true);

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <PageShell title="Ayarlar" subtitle="Hesap ve uygulama tercihleriniz" maxWidth={920}>
      {/* Profile */}
      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Profil" icon={<Icon.Settings />} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 72, height: 72, borderRadius: 16,
              background: "var(--mt-gradient-primary)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 700,
              boxShadow: "var(--mt-shadow-glow)",
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: "var(--mt-text)" }}>{user?.full_name}</p>
            <p style={{ fontSize: 13, color: "var(--mt-text2)", marginTop: 4 }}>{user?.email}</p>
            <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
              <Badge tone="primary" dot>Aktif</Badge>
              <Badge tone="ai">Premium AI</Badge>
            </div>
          </div>
          <Button variant="secondary">Düzenle</Button>
        </div>
      </Card>

      {/* Görünüm */}
      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Görünüm" subtitle="Tema ve dil tercihleri" icon={theme === "dark" ? <Icon.Moon /> : <Icon.Sun />} />
        <Row label="Tema" description="Karanlık veya aydınlık tema seçin">
          <Button variant="secondary" onClick={toggleTheme} iconLeft={theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}>
            {theme === "dark" ? "Aydınlık" : "Karanlık"}
          </Button>
        </Row>
        <Row label="Dil" description="Arayüz dili" last>
          <Badge tone="primary">Türkçe</Badge>
        </Row>
      </Card>

      {/* Bildirimler */}
      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Bildirimler" subtitle="Hatırlatıcılar ve bildirim tercihleri" icon={<Icon.Bell />} />
        <Row label="E-posta bildirimleri" description="Haftalık özet ve hatırlatmalar">
          <Toggle value={notifEmail} onChange={setNotifEmail} />
        </Row>
        <Row label="Anlık bildirimler" description="Tarayıcı push bildirimleri" last>
          <Toggle value={notifPush} onChange={setNotifPush} />
        </Row>
      </Card>

      {/* AI */}
      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="AI Tercihleri" subtitle="Yapay zeka analizleri" icon={<Icon.Sparkle />} />
        <Row label="Otomatik analiz" description="Yeni kayıt eklendiğinde otomatik AI yorumu üret" last>
          <Toggle value={aiAutoRun} onChange={setAiAutoRun} />
        </Row>
      </Card>

      {/* Hesap */}
      <Card>
        <CardHeader title="Hesap" subtitle="Tehlikeli işlemler" icon={<Icon.Logout />} />
        <Row label="Oturumu kapat" description="Tüm cihazlardan çıkış yapın" last>
          <Button variant="danger" onClick={logout}>Çıkış Yap</Button>
        </Row>
      </Card>

      <p style={{ fontSize: 11, color: "var(--mt-muted)", textAlign: "center", marginTop: 24 }}>
        MindTrack v1.0 · Powered by Gemini 2.5 Flash
      </p>
    </PageShell>
  );
}

function Row({ label, description, last, children }: { label: string; description?: string; last?: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 0",
        borderBottom: last ? "none" : "1px solid var(--mt-border)",
        gap: 16,
      }}
    >
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--mt-text)" }}>{label}</p>
        {description && <p style={{ fontSize: 12, color: "var(--mt-muted)", marginTop: 4 }}>{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 46, height: 26, borderRadius: 999,
        background: value ? "var(--mt-primary)" : "var(--mt-surface3)",
        border: "none",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.18s ease",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: value ? 23 : 3,
          width: 20, height: 20, borderRadius: "50%",
          background: "#fff",
          transition: "left 0.18s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        }}
      />
    </button>
  );
}
