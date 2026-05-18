"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/Icons";
import type { ImageAnalysis } from "@/services/types";

function formatLongDate(d: Date) {
  return d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Kahvaltı",
  lunch: "Öğle",
  dinner: "Akşam",
  snack: "Atıştırma",
};
const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];

export default function BeslenmePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ImageAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setItems((await api.getImageAnalyses()) || []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  const handleDelete = async (id: number) => {
    if (!confirm("Bu görseli silmek istediğinize emin misiniz?")) return;
    try {
      await api.deleteImageAnalysis(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch { /* */ }
  };

  // En son veri günü (bugün varsa onu, yoksa son veri olan günü göster)
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayItems = useMemo(() => {
    const todayList = items.filter((i) => i.created_at?.slice(0, 10) === todayStr);
    if (todayList.length > 0) return todayList;
    if (items.length === 0) return [];
    const latestDate = items
      .map((i) => i.created_at?.slice(0, 10))
      .filter(Boolean)
      .sort()
      .pop();
    return items.filter((i) => i.created_at?.slice(0, 10) === latestDate);
  }, [items, todayStr]);

  const displayDate = useMemo(() => {
    if (todayItems.length === 0) return "Bugün";
    const d = todayItems[0].created_at?.slice(0, 10);
    if (!d || d === todayStr) return "Bugün";
    return new Date(d + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
  }, [todayItems, todayStr]);

  const todayCalories = todayItems.reduce((s, i) => s + (i.analysis_result?.estimated_calories ?? 0), 0);
  const goal = 2000;
  const goalPct = Math.min((todayCalories / goal) * 100, 100);

  // Makro değerler — varsa gerçek nutrients'tan topla, yoksa kalori bazlı standart
  // dağılım (%50 karb / %25 protein / %25 yağ — genel sağlıklı beslenme oranı)
  const macros = useMemo(() => {
    const real = { carbs: 0, protein: 0, fat: 0 };
    let hasReal = false;
    todayItems.forEach((i) => {
      const ar: any = i.analysis_result;
      const n: any = ar?.nutrients;
      if (n && (n.carbs || n.protein || n.fat)) {
        hasReal = true;
        real.carbs += Number(n.carbs ?? 0);
        real.protein += Number(n.protein ?? 0);
        real.fat += Number(n.fat ?? 0);
      }
    });

    if (hasReal) {
      return { carbs: real.carbs, protein: real.protein, fat: real.fat, isEstimate: false };
    }
    // Fallback: kalori → makro (Atwater: karb 4 kcal/g, protein 4 kcal/g, yağ 9 kcal/g)
    return {
      carbs: (todayCalories * 0.5) / 4,
      protein: (todayCalories * 0.25) / 4,
      fat: (todayCalories * 0.25) / 9,
      isEstimate: true,
    };
  }, [todayItems, todayCalories]);

  const carbsG = Math.round(macros.carbs);
  const proteinG = Math.round(macros.protein);
  const fatG = Math.round(macros.fat);
  const carbsCal = carbsG * 4;
  const proteinCal = proteinG * 4;
  const fatCal = fatG * 9;
  const totalMacroCal = carbsCal + proteinCal + fatCal || 1;
  const carbsPct = Math.round((carbsCal / totalMacroCal) * 100);
  const proteinPct = Math.round((proteinCal / totalMacroCal) * 100);
  const fatPct = Math.max(0, 100 - carbsPct - proteinPct);

  const mealsByType = useMemo(() => {
    const map: Record<string, ImageAnalysis[]> = {};
    todayItems.forEach((i) => {
      const k = i.meal_type || "snack";
      (map[k] = map[k] || []).push(i);
    });
    return map;
  }, [todayItems]);

  return (
    <div className="flex flex-col h-full">
      <header className="lm-topbar">
        <h1>
          Beslenme <span className="date-sub">{formatLongDate(new Date())}</span>
        </h1>
        <div className="actions">
          <div className="lm-search">
            <Icon.Search width={14} height={14} />
            <span>Yemek ara</span>
            <kbd>⌘ K</kbd>
          </div>
          <button className="lm-icon-btn" title="Bildirimler">
            <Icon.Bell width={16} height={16} />
            <i className="dot" />
          </button>
          <Link href="/dashboard/new" className="lm-btn lm-btn-primary">
            <Icon.Plus width={14} height={14} /> Fotoğraf yükle
          </Link>
        </div>
      </header>

      <div className="lm-content flex-1 overflow-y-auto">
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--n-700)", borderTopColor: "var(--primary-500)", animation: "spin 0.8s linear infinite" }} />
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : items.length === 0 ? (
          <div className="lm-panel" style={{ textAlign: "center", padding: "64px 32px", minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "inline-flex", padding: 16, borderRadius: 999, background: "rgba(124,90,237,0.12)", color: "var(--primary-300)", marginBottom: 16 }}>
              <Icon.Apple width={28} height={28} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--n-100)", marginBottom: 8 }}>Henüz beslenme analizi yok</h3>
            <p style={{ fontSize: 13, color: "var(--n-400)", marginBottom: 20, lineHeight: 1.6 }}>
              Yediklerinizin fotoğrafını yükleyin — AI türünü ve kalorisini tahmin etsin.
            </p>
            <Link href="/dashboard/new" className="lm-btn lm-btn-primary" style={{ display: "inline-flex" }}>
              <Icon.Plus width={14} height={14} /> Fotoğraf yükle
            </Link>
          </div>
        ) : (
          <>
            {/* Today calorie + macro split */}
            <div className="lm-panel">
              <div className="lm-panel-head">
                <h3>{displayDate}</h3>
                <span style={{ fontSize: 12, color: "var(--primary-300)", fontFamily: "var(--font-mono)" }}>
                  {todayCalories.toLocaleString("tr-TR")} / {goal.toLocaleString("tr-TR")} kcal
                </span>
              </div>
              <div className="lm-bar-h" style={{ marginTop: 8 }}>
                <i style={{ width: `${goalPct}%` }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 14 }}>
                {[
                  { l: "Karb.", v: `${carbsG}g`, c: "var(--primary-300)", pct: carbsPct },
                  { l: "Protein", v: `${proteinG}g`, c: "var(--secondary)", pct: proteinPct },
                  { l: "Yağ", v: `${fatG}g`, c: "var(--warning)", pct: fatPct },
                ].map((m) => (
                  <div key={m.l} className="lm-macro">
                    <div className="lab">{m.l}</div>
                    <div className="val" style={{ color: m.c }}>{m.v}</div>
                    <div className="lm-bar-h" style={{ marginTop: 4 }}>
                      <i style={{ width: `${m.pct}%`, background: m.c }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's meals — 4 buckets */}
            <div className="lm-panel">
              <div className="lm-panel-head">
                <h3>{displayDate === "Bugün" ? "Bugünün öğünleri" : `${displayDate} öğünleri`}</h3>
                <span style={{ fontSize: 11, color: "var(--n-400)", fontFamily: "var(--font-mono)" }}>
                  {todayItems.length} kayıt
                </span>
              </div>
              <div className="mt-scrollable-list mt-scrollable-list-sm" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {MEAL_ORDER.map((mt) => {
                  const meals = mealsByType[mt] || [];
                  const cal = meals.reduce((s, m) => s + (m.analysis_result?.estimated_calories ?? 0), 0);
                  const isEmpty = meals.length === 0;
                  const firstName = meals[0]?.analysis_result?.food_type || meals[0]?.analysis_result?.coffee_type;
                  return (
                    <div key={mt} style={{
                      display: "grid",
                      gridTemplateColumns: "40px 1fr auto",
                      gap: 12,
                      padding: 12,
                      background: "var(--n-800)",
                      border: "1px solid var(--n-700)",
                      borderRadius: "var(--r-sm)",
                      alignItems: "center",
                      opacity: isEmpty ? 0.5 : 1,
                    }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: "var(--r-sm)",
                        background: "var(--n-900)",
                        border: "1px solid var(--n-700)",
                        display: "grid",
                        placeItems: "center",
                        color: "var(--primary-300)",
                      }}>
                        <Icon.Apple width={16} height={16} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--n-100)" }}>{MEAL_LABELS[mt]}</div>
                        <div style={{ fontSize: 10, color: "var(--n-400)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {isEmpty ? "Bekliyor" : meals.length === 1 ? firstName : `${meals.length} öğe · ${firstName}`}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: "var(--n-100)", fontFamily: "var(--font-mono)" }}>
                          {isEmpty ? "—" : `${cal} kcal`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All photos grid */}
            <div className="lm-panel">
              <div className="lm-panel-head">
                <h3>Tüm görseller</h3>
                <span style={{ fontSize: 11, color: "var(--n-400)", fontFamily: "var(--font-mono)" }}>
                  {items.length} toplam
                </span>
              </div>
              <div className="mt-scrollable-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {[...items].reverse().map((img) => {
                  const r = img.analysis_result || {};
                  return (
                    <div key={img.id} style={{
                      background: "var(--n-800)",
                      border: "1px solid var(--n-700)",
                      borderRadius: "var(--r-md)",
                      overflow: "hidden",
                      position: "relative",
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.image_url}
                        alt={r.food_type || "Beslenme görseli"}
                        style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                      />
                      {/* Sil butonu — görselin sağ üst köşesinde, her zaman görünür */}
                      <button
                        onClick={() => handleDelete(img.id)}
                        title="Görseli sil"
                        aria-label="Görseli sil"
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 32,
                          height: 32,
                          padding: 0,
                          borderRadius: 8,
                          background: "rgba(0,0,0,0.65)",
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                          color: "#fff",
                          border: "1px solid rgba(255,255,255,0.15)",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                          zIndex: 2,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--danger)";
                          e.currentTarget.style.borderColor = "var(--danger)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(0,0,0,0.65)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                        }}
                      >
                        <Icon.Trash width={16} height={16} />
                      </button>
                      <div style={{ padding: 12 }}>
                        <div style={{ marginBottom: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--n-100)" }}>
                            {r.food_type || r.coffee_type || "Bilinmeyen"}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {r.estimated_calories !== undefined && (
                            <span style={{ padding: "2px 8px", borderRadius: 999, background: "rgba(244,183,64,0.15)", color: "var(--warning)", fontSize: 10, fontFamily: "var(--font-mono)" }}>
                              {r.estimated_calories} kcal
                            </span>
                          )}
                          {r.estimated_caffeine_mg !== undefined && (
                            <span style={{ padding: "2px 8px", borderRadius: 999, background: "rgba(45,175,254,0.15)", color: "var(--secondary)", fontSize: 10, fontFamily: "var(--font-mono)" }}>
                              {r.estimated_caffeine_mg} mg
                            </span>
                          )}
                          {img.meal_type && MEAL_LABELS[img.meal_type] && (
                            <span style={{ padding: "2px 8px", borderRadius: 999, background: "rgba(124,90,237,0.15)", color: "var(--primary-300)", fontSize: 10 }}>
                              {MEAL_LABELS[img.meal_type]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
