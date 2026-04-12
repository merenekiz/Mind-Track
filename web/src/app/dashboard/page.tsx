"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
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

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

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

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Yükleniyor...</div>
      </div>
    );
  }

  const moodLabels: Record<string, string> = {
    very_bad: "Çok Kötü",
    bad: "Kötü",
    neutral: "Normal",
    good: "İyi",
    very_good: "Çok İyi",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">MindTrack</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Merhaba, {user.full_name}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:underline"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Sağlık Günlüğüm
          </h2>
          <Link
            href="/dashboard/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            + Yeni Kayıt
          </Link>
        </div>

        {dataLoading ? (
          <div className="text-center text-gray-400 py-12">Yükleniyor...</div>
        ) : healthData.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-500 mb-4">
              Henüz sağlık kaydınız bulunmuyor.
            </p>
            <Link
              href="/dashboard/new"
              className="text-blue-600 hover:underline text-sm"
            >
              İlk kaydınızı oluşturun
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {healthData.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl shadow-sm p-5 flex items-start justify-between"
              >
                <div className="space-y-1">
                  <div className="font-medium text-gray-900">{record.date}</div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    {record.pain_level !== null && (
                      <span>Ağrı: {record.pain_level}/10</span>
                    )}
                    {record.sleep_hours !== null && (
                      <span>Uyku: {record.sleep_hours} saat</span>
                    )}
                    {record.sleep_quality !== null && (
                      <span>Uyku Kalitesi: {record.sleep_quality}/5</span>
                    )}
                    {record.stress_level !== null && (
                      <span>Stres: {record.stress_level}/10</span>
                    )}
                    {record.mood && (
                      <span>Ruh Hali: {moodLabels[record.mood] || record.mood}</span>
                    )}
                  </div>
                  {record.notes && (
                    <p className="text-sm text-gray-500 mt-1">{record.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="text-sm text-red-500 hover:underline ml-4 shrink-0"
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
