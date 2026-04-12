"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

export default function NewHealthDataPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    date: today,
    pain_level: "",
    sleep_hours: "",
    sleep_quality: "",
    stress_level: "",
    mood: "",
    notes: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data: Record<string, unknown> = { date: form.date };

      if (form.pain_level !== "") data.pain_level = Number(form.pain_level);
      if (form.sleep_hours !== "") data.sleep_hours = Number(form.sleep_hours);
      if (form.sleep_quality !== "") data.sleep_quality = Number(form.sleep_quality);
      if (form.stress_level !== "") data.stress_level = Number(form.stress_level);
      if (form.mood !== "") data.mood = form.mood;
      if (form.notes.trim() !== "") data.notes = form.notes.trim();

      await api.createHealthData(data);
      router.push("/dashboard");
    } catch {
      setError("Kayıt oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">MindTrack</h1>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Geri Dön
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Yeni Sağlık Kaydı
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarih
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ağrı Seviyesi (0-10)
            </label>
            <input
              type="number"
              name="pain_level"
              value={form.pain_level}
              onChange={handleChange}
              min="0"
              max="10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="0 = Ağrı yok, 10 = Çok şiddetli"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uyku Süresi (saat)
              </label>
              <input
                type="number"
                name="sleep_hours"
                value={form.sleep_hours}
                onChange={handleChange}
                min="0"
                max="24"
                step="0.5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Örn: 7.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uyku Kalitesi (1-5)
              </label>
              <select
                name="sleep_quality"
                value={form.sleep_quality}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Seçiniz</option>
                <option value="1">1 - Çok Kötü</option>
                <option value="2">2 - Kötü</option>
                <option value="3">3 - Orta</option>
                <option value="4">4 - İyi</option>
                <option value="5">5 - Çok İyi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stres Seviyesi (0-10)
            </label>
            <input
              type="number"
              name="stress_level"
              value={form.stress_level}
              onChange={handleChange}
              min="0"
              max="10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="0 = Stres yok, 10 = Çok stresli"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ruh Hali
            </label>
            <select
              name="mood"
              value={form.mood}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Seçiniz</option>
              <option value="very_bad">Çok Kötü</option>
              <option value="bad">Kötü</option>
              <option value="neutral">Normal</option>
              <option value="good">İyi</option>
              <option value="very_good">Çok İyi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notlar
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              maxLength={1000}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="Bugün nasıl hissediyorsunuz? Ek bilgi ekleyebilirsiniz..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>
      </main>
    </div>
  );
}
