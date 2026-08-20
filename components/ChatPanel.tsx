"use client";

import { useState } from "react";
import { useLockBodyScroll } from "@/lib/hooks/useLockBodyScroll";
import type { MealTotals } from "@/lib/targets";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export function ChatPanel({
  open,
  onClose,
  dayTotals,
}: {
  open: boolean;
  onClose: () => void;
  dayTotals: MealTotals;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  useLockBodyScroll(open);

  if (!open) return null;

  async function handleSend() {
    const message = text.trim();
    if (!message) return;

    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: message }]);
    setText("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, dayTotals }),
      });
      const json = await res.json();

      if (!res.ok) {
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", text: json.error ?? "Erro ao consultar o chat." }]);
        return;
      }

      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", text: json.text ?? "" }]);
    } catch {
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", text: "Não consegui conectar ao chat." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex h-[70vh] w-full max-w-[420px] flex-col rounded-t-2xl border-t border-line bg-panel">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="font-display text-base font-bold">Pergunte sobre seu progresso</h3>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-dim hover:text-chalk" aria-label="Fechar chat">
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.length === 0 && (
            <p className="text-sm leading-relaxed text-dim">
              Pergunte algo como &quot;quantas calorias eu já comi hoje?&quot; ou &quot;quanto falta de proteína?&quot;. Pra
              registrar uma refeição por foto, use o botão de câmera na navegação.
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                  m.role === "user" ? "bg-accent text-[#0B0B0C]" : "border border-line bg-track text-chalk"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {sending && <div className="text-xs text-dim">Pensando...</div>}
        </div>

        <div className="flex items-center gap-2 border-t border-line p-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Pergunte algo..."
            className="h-10 flex-1 rounded-lg border border-line bg-track px-3 text-sm outline-none focus:border-accent"
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="h-10 shrink-0 rounded-lg bg-accent px-4 text-sm font-bold text-[#0B0B0C] disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
