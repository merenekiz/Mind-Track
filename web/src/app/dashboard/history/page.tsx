"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/Icons";
import type { HealthData } from "@/services/types";

type FilterMood = "all" | "good" | "neutral" | "bad";

const moodLabel: Record<string, string> = {
  very_bad: "Çok Kötü",
  bad: "Kötü",
  neutral: "Normal",
  good: "İyi",
  very_good: "Çok İyi",
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" });
}

function formatLongDate(d: Date) {
  return d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function chip(text: string, bg: string, color: string) {
  return (
    <span style={{
      padding: "3px 9px",
      borderRadius: "var(--r-full)",
      background: bg,
      color,
      fontSize: 11,
      fontWeight: 500,
      fontFamily: "var(--font-mono)",
      whiteSpace: "nowrap",
    }}>{text}</span>
  );
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [data, setData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMood>("all");

  const load = useCallback(async () => {
    try {
      const res = await api.getHealthData();
      setData(res || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  const handleDelete = async (id: number) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    try {
      await api.deleteHealthData(id);
      setData((prev) => prev.filter((d) => d.id !== id));
    } catch { /* */ }
  };

  const filtered = useMemo(() => {
    return [...data]
      .reverse()
      .filter((d) => {
        if (search) {
          const q = search.toLowerCase();
          const matches =
            d.notes?.toLowerCase().includes(q) ||
            d.date.includes(q) ||
            d.mood?.toLowerCase().includes(q);
          if (!matches) return false;
        }
        if (filter === "all") return true;
        if (filter === "good") return d.mood === "good" || d.mood === "very_good";
        if (filter === "bad") return d.mood === "bad" || d.mood === "very_bad";
        if (filter === "neutral") return d.mood === "neutral";
        return true;
      });
  }, [data, search, filter]);

  return (
    <div className="flex flex-col h-full">
      <header className="lm-topbar">
        <h1>
          Günlük <span className="date-sub">{formatLongDate(new Date())}</span>
        </h1>
        <div className="actions">
          <button className="lm-icon-btn" title="Bildirimler">
            <Icon.Bell width={16} height={16} />
            <i className="dot" />
          </button>
          <Link href="/dashboard/new" className="lm-btn lm-btn-primary">
            <Icon.Plus width={14} height={14} /> Yeni kayıt
          </Link>
        </div>
      </header>

      <div className="lm-content flex-1 overflow-y-auto">
        {/* Search + filter chips */}
        <div className="lm-panel" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", padding: 14 }}>
          <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--n-400)", display: "inline-flex" }}>
              <Icon.Search width={14} height={14} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kayıtlarda ara…"
              style={{
                width: "100%",
                height: 36,
                borderRadius: "var(--r-md)",
                padding: "0 14px 0 36px",
                fontSize: 13,
                background: "var(--n-800)",
                border: "1px solid var(--n-700)",
                color: "var(--n-100)",
                outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["all", "good", "neutral", "bad"] as FilterMood[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "var(--r-full)",
                  background: filter === f ? "var(--primary-500)" : "var(--n-800)",
                  color: filter === f ? "#fff" : "var(--n-300)",
                  border: `1px solid ${filter === f ? "var(--primary-500)" : "var(--n-700)"}`,
                  fontWeight: filter === f ? 600 : 500,
                  fontSize: 12,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {f === "all" ? "Tümü" : f === "good" ? "İyi günler" : f === "bad" ? "Zor günler" : "Normal"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--n-700)", borderTopColor: "var(--primary-500)", animation: "spin 0.8s linear infinite" }} />
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div className="lm-panel" style={{ textAlign: "center", padding: "64px 32px", minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "inline-flex", padding: 16, borderRadius: 999, background: "rgba(124,90,237,0.12)", color: "var(--primary-300)", marginBottom: 16 }}>
              <Icon.Notebook width={28} height={28} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--n-100)", marginBottom: 8 }}>
              {data.length === 0 ? "Henüz kayıt yok" : "Sonuç bulunamadı"}
            </h3>
            <p style={{ fontSize: 13, color: "var(--n-400)", marginBottom: 20, lineHeight: 1.6 }}>
              {data.length === 0 ? "İlk sağlık kaydınızı oluşturun." : "Filtreyi değiştirin veya başka bir terim arayın."}
            </p>
            {data.length === 0 && (
              <Link href="/dashboard/new" className="lm-btn lm-btn-primary" style={{ display: "inline-flex" }}>
                <Icon.Plus width={14} height={14} /> Yeni kayıt
              </Link>
            )}
          </div>
        ) : (
          <div className="lm-panel">
            <div className="lm-panel-head">
              <h3>Tüm kayıtlar</h3>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--n-400)" }}>
                {filtered.length} / {data.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((record) => (
                <div key={record.id} style={{
                  padding: 14,
                  background: "var(--n-800)",
                  border: "1px solid var(--n-700)",
                  borderRadius: "var(--r-sm)",
                  display: "grid",
                  gridTemplateColumns: "44px 1fr auto",
                  gap: 14,
                  alignItems: "flex-start",
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: "rgba(124,90,237,0.15)",
                    color: "var(--primary-300)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon.Calendar width={18} height={18} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--n-100)" }}>
                      {formatDate(record.date)}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {record.sleep_hours != null && chip(`${record.sleep_hours} sa uyku`, "rgba(124,90,237,0.15)", "var(--primary-300)")}
                      {record.stress_level != null && chip(
                        `Stres ${record.stress_level}/10`,
                        record.stress_level >= 7 ? "rgba(255,92,122,0.15)" : record.stress_level >= 5 ? "rgba(244,183,64,0.15)" : "rgba(43,206,137,0.15)",
                        record.stress_level >= 7 ? "var(--danger)" : record.stress_level >= 5 ? "var(--warning)" : "var(--success)",
                      )}
                      {record.pain_level != null && chip(
                        `Ağrı ${record.pain_level}/10`,
                        record.pain_level >= 7 ? "rgba(255,92,122,0.15)" : "rgba(110,110,138,0.15)",
                        record.pain_level >= 7 ? "var(--danger)" : "var(--n-300)",
                      )}
                      {record.sleep_quality != null && chip(`Kalite ${record.sleep_quality}/5`, "rgba(45,175,254,0.15)", "var(--secondary)")}
                      {record.mood && chip(moodLabel[record.mood] || record.mood, "rgba(94,230,199,0.15)", "var(--secondary-2)")}
                    </div>
                    {record.notes && (
                      <p style={{ fontSize: 12.5, color: "var(--n-300)", marginTop: 10, lineHeight: 1.6, fontStyle: "italic" }}>
                        “{record.notes}”
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(record.id)}
                    title="Sil"
                    className="lm-icon-btn"
                    style={{ width: 32, height: 32 }}
                  >
                    <Icon.Trash width={14} height={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
