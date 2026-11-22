import { useEffect, useState } from "react";
import {
  MessageSquare,
  Send,
  X,
  CheckCheck,
  Maximize2,
} from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";

const PRIMARY_GREEN = "#2d6a4f";
const TERRACOTTA_NOTIFICATION = "#E76F51";

function formatMsgTime(timestamp) {
  if (!timestamp) return "";
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPanel({ onOpenFullChatPage }) {
  const { user, isAuthenticated } = useAuth();
  const {
    threads,
    activeThreadId,
    isChatOpen,
    totalUnreadCount,
    closeChat,
    selectThread,
    markThreadAsRead,
    sendMessage,
  } = useChat();

  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (isAuthenticated && isChatOpen && activeThreadId) {
      markThreadAsRead(activeThreadId);
    }
  }, [isAuthenticated, isChatOpen, activeThreadId, markThreadAsRead]);

  if (!isAuthenticated || !isChatOpen) return null;

  const activeThread =
    threads.find((t) => t.id === activeThreadId) || threads[0] || null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMessage(draft, user?.nickname || "yo", activeThread?.id);
    setDraft("");
  };

  const handleExpandToFullPage = () => {
    closeChat();
    onOpenFullChatPage?.();
  };

  return (
    <aside
      aria-label="Mensajería directa"
      className="fixed bottom-4 right-4 z-50 flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
    >
      {/* Cabecera */}
      <div
        style={{ backgroundColor: PRIMARY_GREEN }}
        className="flex items-center justify-between px-4 py-3 text-white"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm font-extrabold">Mensajes de entrega</span>
          {totalUnreadCount > 0 && (
            <span
              style={{ backgroundColor: TERRACOTTA_NOTIFICATION }}
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold text-white"
            >
              {totalUnreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onOpenFullChatPage && (
            <button
              type="button"
              onClick={handleExpandToFullPage}
              title="Abrir página completa del chat"
              aria-label="Abrir página completa del chat"
              className="rounded-lg p-1.5 text-white/90 transition hover:bg-white/15 hover:text-white"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={closeChat}
            aria-label="Cerrar panel de chat"
            className="rounded-lg p-1.5 text-white/90 transition hover:bg-white/15 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Selector de conversaciones */}
      <div className="flex gap-1.5 overflow-x-auto border-b border-stone-100 bg-[#FAF9F6] p-2">
        {threads.map((thread) => {
          const isSelected = thread.id === activeThread?.id;
          return (
            <button
              key={thread.id}
              type="button"
              onClick={() => selectThread(thread.id)}
              style={
                isSelected
                  ? { backgroundColor: PRIMARY_GREEN, color: "#ffffff" }
                  : undefined
              }
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                isSelected
                  ? "text-white"
                  : "border border-stone-200 bg-white text-stone-700 hover:border-[#2d6a4f]"
              }`}
            >
              <span>@{thread.peer_nickname}</span>
              {(thread.unreadCount || 0) > 0 && (
                <span
                  style={{ backgroundColor: TERRACOTTA_NOTIFICATION }}
                  className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-extrabold text-white"
                >
                  {thread.unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mensajes del hilo activo con timestamp */}
      <div className="max-h-72 flex-1 space-y-2.5 overflow-y-auto bg-white p-4">
        {activeThread?.messages?.map((msg) => {
          const isMine = msg.sender === (user?.nickname || "yo");
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isMine ? "items-end" : "items-start"
              }`}
            >
              <div
                style={
                  isMine
                    ? { backgroundColor: PRIMARY_GREEN, color: "#ffffff" }
                    : undefined
                }
                className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                  isMine
                    ? "text-white"
                    : "bg-[#FAF9F6] text-stone-800 ring-1 ring-stone-200"
                }`}
              >
                <p>{msg.text}</p>
              </div>
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-stone-400">
                <span>@{msg.sender}</span>
                {msg.timestamp && <span>· {formatMsgTime(msg.timestamp)}</span>}
                {msg.read && <CheckCheck className="h-3 w-3 text-[#2d6a4f]" />}
              </span>
            </div>
          );
        })}
      </div>

      {/* Entrada de texto */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-stone-100 bg-[#FAF9F6] p-3"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
        />
        <button
          type="submit"
          style={{ backgroundColor: PRIMARY_GREEN }}
          aria-label="Enviar mensaje"
          className="inline-flex items-center justify-center rounded-xl p-2.5 text-white transition hover:opacity-90"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}