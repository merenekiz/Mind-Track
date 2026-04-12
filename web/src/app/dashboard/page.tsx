"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";

interface HealthData {
  id: number;
  date: string;
  pain_level: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  stress_level: number | null;
  mood: string | null;
  notes: string | null;
  created_at: string;
}

const moodLabels: Record<string, string> = {
  very_bad: "Çok Kötü",
  bad: "Kötü",
  neutral: "Normal",
  good: "İyi",
  very_good: "Çok İyi",
};

const moodColors: Record<string, string> = {
  very_bad: "text-mt-accent3",
  bad: "text-mt-warn",
  neutral: "text-mt-muted",
  good: "text-mt-accent4",
  very_good: "text-mt-accent4",
};

function painColor(level: number) {
  if (level >= 7) return "text-mt-accent3";
  if (level >= 4) return "text-mt-warn";
  return "text-mt-accent4";
}

function stressColor(level: number) {
  if (level >= 7) return "text-mt-accent3";
  if (level >= 5) return "text-mt-warn";
  return "text-mt-text";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api
        .getHealthData()
        .then((data) => setHealthData(data || []))
        .catch(() => setHealthData([]))
        .finally(() => setDataLoading(false));
    }
  }, [user]);

  const handleDelete = async (id: number) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    await api.deleteHealthData(id);
    setHealthData((prev) => prev.filter((d) => d.id !== id));
  };

  // Stat calculations
  const last7 = healthData.slice(-7);
  const avgPain =
    last7.filter((d) => d.pain_level !== null).length > 0
      ? (
          last7.reduce((s, d) => s + (d.pain_level || 0), 0) /
          last7.filter((d) => d.pain_level !== null).length
        ).toFixed(1)
      : "-";
  const avgSleep =
    last7.filter((d) => d.sleep_hours !== null).length > 0
      ? (
          last7.reduce((s, d) => s + (d.sleep_hours || 0), 0) /
          last7.filter((d) => d.sleep_hours !== null).length
        ).toFixed(1)
      : "-";
  const avgStress =
    last7.filter((d) => d.stress_level !== null).length > 0
      ? (
          last7.reduce((s, d) => s + (d.stress_level || 0), 0) /
          last7.filter((d) => d.stress_level !== null).length
        ).toFixed(1)
      : "-";

  const stats = [
    {
      label: "Ort. Uyku",
      value: avgSleep,
      unit: "sa",
      delta:
        avgSleep !== "-" && parseFloat(avgSleep) >= 7
          ? "Yeterli"
          : avgSleep !== "-"
          ? "Yetersiz"
          : "",
      deltaColor:
        avgSleep !== "-" && parseFloat(avgSleep) >= 7
          ? "text-mt-accent4"
          : "text-mt-accent3",
      valueColor:
        avgSleep !== "-" && parseFloat(avgSleep) < 6
          ? "text-mt-accent3"
          : "text-mt-text",
    },
    {
      label: "Ort. Stres",
      value: avgStress,
      unit: "/10",
      delta:
        avgStress !== "-" && parseFloat(avgStress) < 5
          ? "Düşük"
          : avgStress !== "-"
          ? "Yüksek"
          : "",
      deltaColor:
        avgStress !== "-" && parseFloat(avgStress) < 5
          ? "text-mt-accent4"
          : "text-mt-accent3",
      valueColor:
        avgStress !== "-" && parseFloat(avgStress) >= 7
          ? "text-mt-accent3"
          : avgStress !== "-" && parseFloat(avgStress) >= 5
          ? "text-mt-warn"
          : "text-mt-text",
    },
    {
      label: "Ort. Ağrı",
      value: avgPain,
      unit: "/10",
      delta:
        avgPain !== "-" && parseFloat(avgPain) < 4
          ? "Kontrol altında"
          : avgPain !== "-"
          ? "Dikkat"
          : "",
      deltaColor:
        avgPain !== "-" && parseFloat(avgPain) < 4
          ? "text-mt-accent4"
          : "text-mt-accent3",
      valueColor:
        avgPain !== "-" && parseFloat(avgPain) >= 6
          ? "text-mt-accent3"
          : avgPain !== "-" && parseFloat(avgPain) >= 4
          ? "text-mt-warn"
          : "text-mt-text",
    },
    {
      label: "Toplam Kayıt",
      value: String(healthData.length),
      unit: "",
      delta: healthData.length > 0 ? "günlük kayıt" : "",
      deltaColor: "text-mt-accent",
      valueColor: "text-mt-text",
    },
  ];

  return (
    <>
      {/* Topbar */}
      <div className="px-5 py-3 border-b border-mt-border bg-mt-surface flex items-center justify-between shrink-0">
        <div>
          <div className="text-[16px] font-bold">Kontrol Paneli</div>
          <div className="text-[11px] text-mt-muted">Günlük özet ve trendler</div>
        </div>
        <Link
          href="/dashboard/new"
          className="bg-mt-accent text-black px-3 py-1.5 rounded-md text-[12px] font-semibold hover:opacity-85 transition-opacity inline-flex items-center gap-1"
        >
          + Manuel Giriş
        </Link>
      </div>

      {/* Content */}
      <div className="p-5 flex-1">
        {dataLoading ? (
          <div className="flex items-center justify-center h-64 text-mt-muted text-sm">
            Yükleniyor...
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-3 mb-3">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="bg-mt-surface border border-mt-border rounded-xl p-3.5"
                >
                  <div className="text-[10px] text-mt-muted uppercase tracking-wider mb-1.5">
                    {s.label}
                  </div>
                  <div className={`text-[23px] font-extrabold ${s.valueColor}`}>
                    {s.value}
                    <span className="text-[11px] font-normal text-mt-muted ml-0.5">
                      {s.unit}
                    </span>
                  </div>
                  {s.delta && (
                    <div className={`text-[11px] mt-1 ${s.deltaColor}`}>
                      {s.delta}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Records */}
            {healthData.length === 0 ? (
              <div className="bg-mt-surface border border-mt-border rounded-xl p-12 text-center">
                <p className="text-mt-muted mb-3 text-[13px]">
                  Henüz sağlık kaydınız bulunmuyor.
                </p>
                <Link
                  href="/dashboard/new"
                  className="text-mt-accent hover:underline text-[12px]"
                >
                  İlk kaydınızı oluşturun
                </Link>
              </div>
            ) : (
              <div className="bg-mt-surface border border-mt-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-mt-border">
                  <div className="text-[13px] font-bold">Son Kayıtlar</div>
                  <div className="text-[11px] text-mt-muted">
                    {healthData.length} kayıt listeleniyor
                  </div>
                </div>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-mt-border">
                      <th className="text-left px-4 py-2 text-[10px] font-semibold text-mt-muted uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="text-left px-4 py-2 text-[10px] font-semibold text-mt-muted uppercase tracking-wider">
                        Uyku
                      </th>
                      <th className="text-left px-4 py-2 text-[10px] font-semibold text-mt-muted uppercase tracking-wider">
                        Stres
                      </th>
                      <th className="text-left px-4 py-2 text-[10px] font-semibold text-mt-muted uppercase tracking-wider">
                        Ağrı
                      </th>
                      <th className="text-left px-4 py-2 text-[10px] font-semibold text-mt-muted uppercase tracking-wider">
                        Ruh Hali
                      </th>
                      <th className="text-left px-4 py-2 text-[10px] font-semibold text-mt-muted uppercase tracking-wider">
                        Notlar
                      </th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {healthData.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-mt-border hover:bg-mt-surface2 transition-colors"
                      >
                        <td className="px-4 py-2.5 font-medium">
                          {record.date}
                        </td>
                        <td className="px-4 py-2.5 text-mt-accent">
                          {record.sleep_hours !== null
                            ? `${record.sleep_hours} sa`
                            : "-"}
                          {record.sleep_quality !== null && (
                            <span className="text-mt-muted ml-1">
                              ({record.sleep_quality}/5)
                            </span>
                          )}
                        </td>
                        <td
                          className={`px-4 py-2.5 font-bold ${
                            record.stress_level !== null
                              ? stressColor(record.stress_level)
                              : "text-mt-muted"
                          }`}
                        >
                          {record.stress_level !== null
                            ? `${record.stress_level}/10`
                            : "-"}
                        </td>
                        <td
                          className={`px-4 py-2.5 font-bold ${
                            record.pain_level !== null
                              ? painColor(record.pain_level)
                              : "text-mt-muted"
                          }`}
                        >
                          {record.pain_level !== null
                            ? `${record.pain_level}/10`
                            : "-"}
                        </td>
                        <td
                          className={`px-4 py-2.5 ${
                            record.mood
                              ? moodColors[record.mood] || "text-mt-muted"
                              : "text-mt-muted"
                          }`}
                        >
                          {record.mood
                            ? moodLabels[record.mood] || record.mood
                            : "-"}
                        </td>
                        <td className="px-4 py-2.5 text-mt-muted max-w-[200px] truncate">
                          {record.notes || "-"}
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-mt-accent3/60 hover:text-mt-accent3 text-[11px] transition-colors"
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* LLM Panel placeholder */}
            <div className="mt-3 bg-gradient-to-br from-mt-purple/5 to-mt-accent/3 border border-mt-purple/20 rounded-xl p-4">
              <div className="inline-flex items-center gap-1.5 bg-mt-purple/10 border border-mt-purple/30 text-mt-purple text-[10px] font-bold px-2.5 py-1 rounded-full mb-2.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-mt-purple"
                  style={{ animation: "pulse-glow 1.5s infinite" }}
                />
                Klinik YZ Yorumu
              </div>
              <p className="text-[13px] leading-relaxed text-mt-text">
                {healthData.length > 0
                  ? `Son ${Math.min(7, healthData.length)} günlük veriniz analiz edildi. Detaylı YZ yorumu için yeterli veri biriktikçe daha anlamlı sonuçlar alacaksınız.`
                  : "Henüz analiz edilecek veri bulunmuyor. Günlük kayıtlarınızı girmeye başlayın."}
              </p>
              <div className="text-[10px] text-mt-muted mt-2 pt-2 border-t border-mt-border">
                Bu sistem tanı koymaz. Yorumlar klinik değerlendirmenin yerini
                tutmaz.
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
