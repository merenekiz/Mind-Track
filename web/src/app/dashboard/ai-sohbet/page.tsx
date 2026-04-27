"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/Icons";
import { buildLocalInsight } from "@/services/insights";
import type { HealthData, Symptom } from "@/services/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED = [
  "Son haftamı nasıl değerlendirirsin?",
  "Uyku düzenim baş ağrılarımla ilişkili mi?",
  "Stresimi azaltmak için ne öneriyorsun?",
  "Kafein tüketimim sağlığımı nasıl etkiliyor?",
];

const QUICK_ACTIONS = ["Gevşeme rutini kur", "Yarını planla", "PDF olarak dışa aktar"];

export default function AISohbetPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Merhaba ${user?.full_name?.split(" ")[0] || "👋"} — ben MindTrack AI. Sağlık verilerinize göre kişiselleştirilmiş yorumlar yapabilirim.`,
      timestamp: new Date(),
    },
    {
      id: "welcome-2",
      role: "assistant",
      content: "Aşağıdan bir soru seçebilir veya kendi sorunuzu yazabilirsiniz.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadCtx = useCallback(async () => {
    try {
      const [hd, sym] = await Promise.all([api.getHealthData().catch(() => []), api.getSymptoms().catch(() => [])]);
      setHealthData(hd || []);
      setSymptoms(sym || []);
    } catch { /* */ }
  }, []);

  useEffect(() => { loadCtx(); }, [loadCtx]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed, timestamp: new Date() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);

    setTimeout(() => {
      const insight = buildLocalInsight({ healthData, imageAnalyses: [], symptoms });
      let answer = "";
      if (insight) {
        answer = insight.summary;
        if (insight.suggestion) answer += `\n\nÖnerim: ${insight.suggestion}`;
        if (insight.confidence) answer += `\n\nGüven: %${Math.round(insight.confidence * 100)}.`;
      } else {
        answer = "Henüz analiz edebileceğim yeterli veri yok. Birkaç günlük kayıt sonrası daha kişiselleştirilmiş yorumlar yapabilirim.";
      }
      answer += "\n\nBu yorum bilgilendirme amaçlıdır, tıbbi tanı niteliği taşımaz.";

      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: answer, timestamp: new Date() },
      ]);
      setThinking(false);
    }, 900);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="lm-topbar">
        <h1>
          MindTrack AI <span className="date-sub">{healthData.length} kayıt · {symptoms.length} belirti analizi</span>
        </h1>
        <div className="actions">
          <button className="lm-icon-btn" title="Bildirimler">
            <Icon.Bell width={16} height={16} />
            <i className="dot" />
          </button>
          <span style={{
            padding: "6px 10px",
            background: "rgba(43,206,137,0.12)",
            color: "var(--success)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            borderRadius: "var(--r-full)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}>
            <i style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }} />
            Çevrimiçi · Beta
          </span>
        </div>
      </header>

      <div className="lm-content flex-1 overflow-hidden" style={{ display: "flex", flexDirection: "column" }}>
        <div className="lm-panel" style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
        }}>
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column" }}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`lm-chat-msg ${m.role === "assistant" ? "ai" : "user"}`}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {m.content}
              </div>
            ))}

            {thinking && (
              <div className="lm-chat-msg ai" style={{ display: "inline-flex", gap: 6 }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--primary-300)",
                      animation: `lm-dot 1.4s ${i * 0.18}s infinite ease-in-out`,
                    }}
                  />
                ))}
                <style jsx>{`
                  @keyframes lm-dot {
                    0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); }
                    40% { opacity: 1; transform: scale(1); }
                  }
                `}</style>
              </div>
            )}

            {/* Suggestions show only on first turn */}
            {messages.length <= 2 && !thinking && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "var(--r-full)",
                      border: "1px solid rgba(124,90,237,0.4)",
                      background: "rgba(124,90,237,0.1)",
                      color: "var(--primary-300)",
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Quick actions show after first AI reply (more than welcome msgs) */}
            {messages.length > 2 && !thinking && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                {QUICK_ACTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "var(--r-full)",
                      border: "1px solid rgba(124,90,237,0.4)",
                      background: "rgba(124,90,237,0.1)",
                      color: "var(--primary-300)",
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="lm-chat-input"
            style={{ margin: 16 }}
          >
            <button type="button" style={{
              border: "none",
              background: "transparent",
              color: "var(--n-400)",
              cursor: "pointer",
              padding: 4,
              display: "inline-flex",
            }}>
              <Icon.Plus width={16} height={16} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="MindTrack'e sor…"
              className="field"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--n-100)",
                fontSize: 13,
                width: "100%",
              }}
            />
            <button type="button" style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--n-700)",
              border: "none",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "var(--n-200)",
            }}>
              <Icon.Image width={14} height={14} />
            </button>
            <button type="submit" disabled={!input.trim() || thinking} className="send" style={{ border: "none", cursor: input.trim() ? "pointer" : "not-allowed" }}>
              <Icon.Send width={14} height={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
