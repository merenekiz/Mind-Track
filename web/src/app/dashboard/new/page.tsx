"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

const symptomChips = [
  { key: "nausea", label: "Bulantı", emoji: "\ud83e\udd22" },
  { key: "dizziness", label: "Baş Dönmesi", emoji: "\ud83d\udcab" },
  { key: "palpitation", label: "Çarpıntı", emoji: "\ud83d\udc93" },
  { key: "bloating", label: "Şişkinlik", emoji: "\ud83e\udec4" },
  { key: "headache", label: "Baş Ağrısı", emoji: "\ud83e\udd15" },
];

const moodOptions = [
  { value: "very_bad", label: "Çok Kötü" },
  { value: "bad", label: "Kötü" },
  { value: "neutral", label: "Normal" },
  { value: "good", label: "İyi" },
  { value: "very_good", label: "Çok İyi" },
];

export default function NewHealthDataPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [painLevel, setPainLevel] = useState(0);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [stressLevel, setStressLevel] = useState(5);
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data: Record<string, unknown> = {
        date,
        pain_level: painLevel,
        sleep_hours: sleepHours,
        sleep_quality: sleepQuality,
        stress_level: stressLevel,
      };
      if (mood) data.mood = mood;
      if (notes.trim()) data.notes = notes.trim();

      await api.createHealthData(data);
      router.push("/dashboard");
    } catch {
      setError("Kayıt oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  function painColor(v: number) {
    if (v >= 7) return "text-mt-accent3";
    if (v >= 4) return "text-mt-warn";
    return "text-mt-accent4";
  }

  return (
    <>
      {/* Topbar */}
      <div className="px-5 py-3 border-b border-mt-border bg-mt-surface flex items-center justify-between shrink-0">
        <div>
          <div className="text-[16px] font-bold">Manuel Giriş</div>
          <div className="text-[11px] text-mt-muted">Günlük sağlık verisi ekle</div>
        </div>
        <Link
          href="/dashboard"
          className="bg-transparent border border-mt-border text-mt-text px-3 py-1.5 rounded-md text-[12px] font-semibold hover:border-mt-accent hover:text-mt-accent transition-colors"
        >
          ← Geri Dön
        </Link>
      </div>

      {/* Content */}
      <div className="p-5 flex-1">
        <div className="flex gap-3">
          {/* Left Column - Form */}
          <div className="flex-1">
            {/* Date Info */}
            <div className="bg-mt-accent/5 border border-mt-accent/20 text-mt-accent px-3 py-2 rounded-lg mb-3 text-[12px]">
              {new Date().toLocaleDateString("tr-TR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>

            {error && (
              <div className="bg-mt-accent3/10 border border-mt-accent3/25 text-mt-accent3 px-3 py-2 rounded-lg mb-3 text-[12px]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Davranışsal Veriler */}
              <div className="bg-mt-surface border border-mt-border rounded-xl p-4 mb-3">
                <div className="text-[13px] font-bold mb-3">Davranışsal Veriler</div>
                <div className="grid grid-cols-3 gap-4">
                  {/* Uyku */}
                  <div>
                    <label className="block text-[10px] text-mt-muted uppercase tracking-wide mb-1">
                      Uyku
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="12"
                        step="0.5"
                        value={sleepHours}
                        onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-[15px] font-extrabold text-mt-accent min-w-[40px] text-right">
                        {sleepHours}
                        <small className="text-[9px] text-mt-muted">sa</small>
                      </span>
                    </div>
                  </div>

                  {/* Stres */}
                  <div>
                    <label className="block text-[10px] text-mt-muted uppercase tracking-wide mb-1">
                      Stres
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={stressLevel}
                        onChange={(e) => setStressLevel(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-[15px] font-extrabold text-mt-warn min-w-[40px] text-right">
                        {stressLevel}
                        <small className="text-[9px] text-mt-muted">/10</small>
                      </span>
                    </div>
                  </div>

                  {/* Uyku Kalitesi */}
                  <div>
                    <label className="block text-[10px] text-mt-muted uppercase tracking-wide mb-1">
                      Uyku Kalitesi
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={sleepQuality}
                        onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-[15px] font-extrabold text-mt-accent4 min-w-[40px] text-right">
                        {sleepQuality}
                        <small className="text-[9px] text-mt-muted">/5</small>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Semptomlar */}
              <div className="bg-mt-surface border border-mt-border rounded-xl p-4 mb-3">
                <div className="text-[13px] font-bold mb-3">Semptomlar</div>

                {/* Ağrı Şiddeti */}
                <div className="mb-3">
                  <label className="block text-[10px] text-mt-muted uppercase tracking-wide mb-1">
                    Ağrı Şiddeti
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={painLevel}
                      onChange={(e) => setPainLevel(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span
                      className={`text-[15px] font-extrabold min-w-[40px] text-right ${painColor(painLevel)}`}
                    >
                      {painLevel}
                      <small className="text-[9px] text-mt-muted">/10</small>
                    </span>
                  </div>
                </div>

                {/* Symptom Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {symptomChips.map((chip) => (
                    <span
                      key={chip.key}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-mt-border text-mt-muted cursor-pointer transition-all hover:border-mt-accent hover:text-mt-accent select-none"
                    >
                      {chip.emoji} {chip.label}
                    </span>
                  ))}
                </div>

                {/* Ruh Hali */}
                <div className="mt-4">
                  <label className="block text-[10px] text-mt-muted uppercase tracking-wide mb-2">
                    Ruh Hali
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {moodOptions.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setMood(mood === m.value ? "" : m.value)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                          mood === m.value
                            ? "bg-mt-accent/10 border-mt-accent text-mt-accent"
                            : "border-mt-border text-mt-muted hover:border-mt-accent hover:text-mt-accent"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notlar */}
                <div className="mt-4">
                  <label className="block text-[10px] text-mt-muted uppercase tracking-wide mb-1">
                    Notlar
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    className="w-full bg-mt-surface2 border border-mt-border rounded-md px-3 py-2 text-[13px] text-mt-text outline-none transition-colors focus:border-mt-accent placeholder:text-mt-muted/60 resize-y"
                    placeholder="Bugün nasıl hissettin?"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-mt-accent text-black font-semibold py-3 rounded-md text-[14px] transition-opacity hover:opacity-85 disabled:opacity-45 disabled:cursor-not-allowed"
              >
                {submitting ? "Kaydediliyor..." : "Günlük Kaydı Oluştur"}
              </button>
            </form>
          </div>

          {/* Right Column - Date & Info */}
          <div className="w-[200px] shrink-0">
            <div className="bg-mt-surface border border-mt-border rounded-xl p-4 sticky top-0">
              <div className="text-[13px] font-bold mb-2">Kayıt Bilgisi</div>
              <div className="text-[11px] text-mt-muted mb-3">
                Tarih seçin
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-mt-surface2 border border-mt-border rounded-md px-3 py-2 text-[13px] text-mt-text outline-none transition-colors focus:border-mt-accent"
                required
              />
              <div className="mt-4 pt-3 border-t border-mt-border">
                <div className="text-[10px] text-mt-muted uppercase tracking-wider mb-2">
                  Özet
                </div>
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-mt-muted">Ağrı</span>
                    <span className={`font-bold ${painColor(painLevel)}`}>
                      {painLevel}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mt-muted">Uyku</span>
                    <span className="font-bold text-mt-accent">
                      {sleepHours} sa
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mt-muted">Stres</span>
                    <span className="font-bold text-mt-warn">
                      {stressLevel}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mt-muted">Kalite</span>
                    <span className="font-bold text-mt-accent4">
                      {sleepQuality}/5
                    </span>
                  </div>
                  {mood && (
                    <div className="flex justify-between">
                      <span className="text-mt-muted">Ruh Hali</span>
                      <span className="font-bold text-mt-purple">
                        {moodOptions.find((m) => m.value === mood)?.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
