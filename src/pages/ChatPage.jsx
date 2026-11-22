import { useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  Send,
  Search,
  User,
  CheckCheck,
  Check,
  X,
  Inbox,
  MapPin,
  ExternalLink,
  Lock,
} from "lucide-react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";

const PRIMARY_GREEN = "#2d6a4f";
const TERRACOTTA_NOTIFICATION = "#E76F51";

function formatFullTimestamp(timestamp) {
  if (!timestamp) return "";
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AvatarBadge({ nickname = "vecino", avatarUrl = null, size = "md" }) {
  const dimensions =
    size === "lg" ? "h-12 w-12 text-sm" : "h-10 w-10 text-xs";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`@${nickname}`}
        className={`${dimensions} shrink-0 rounded-full border border-stone-200 object-cover`}
      />
    );
  }

  return (
    <div
      style={{ backgroundColor: PRIMARY_GREEN }}
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-full font-extrabold text-white`}
    >
      {String(nickname).slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function ChatPage({ onOpenProfile, onOpenAuthModal }) {
  const { user, isAuthenticated } = useAuth();
  const {
    threads,
    messageRequests,
    activeThreadId,
    totalUnreadCount,
    selectThread,
    markThreadAsRead,
    markAllAsRead,
    sendMessage,
    acceptMessageRequest,
    declineMessageRequest,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarView, setSidebarView] = useState("chats"); // "chats" | "requests"
  const [messageInput, setMessageInput] = useState("");

  useEffect(() => {
    if (isAuthenticated && activeThreadId) {
      markThreadAsRead(activeThreadId);
    }
  }, [isAuthenticated, activeThreadId, markThreadAsRead]);

  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.peer_nickname?.toLowerCase().includes(q) ||
        t.publication_title?.toLowerCase().includes(q) ||
        t.peer_zone?.toLowerCase().includes(q)
    );
  }, [threads, searchQuery]);

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-2xs">
          <Lock
            style={{ color: PRIMARY_GREEN }}
            className="mx-auto h-10 w-10"
          />
          <h1 className="mt-3 text-lg font-extrabold text-stone-900">
            Inicia sesión para ver tus chats
          </h1>
          <p className="mx-auto mt-1 max-w-md text-xs text-stone-500">
            La mensajería y las solicitudes de entrega están disponibles solo para
            usuarios con sesión iniciada.
          </p>
          {onOpenAuthModal && (
            <button
              type="button"
              style={{ backgroundColor: PRIMARY_GREEN }}
              onClick={onOpenAuthModal}
              className="mt-4 rounded-xl px-4 py-2.5 text-xs font-extrabold text-white transition hover:opacity-90"
            >
              Ingresar a mi cuenta
            </button>
          )}
        </div>
      </main>
    );
  }

  const activeThread =
    threads.find((t) => t.id === activeThreadId) || filteredThreads[0] || null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeThread) return;
    sendMessage(messageInput, user?.nickname || "yo", activeThread.id);
    setMessageInput("");
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <section aria-label="Centro de mensajería completo" className="space-y-5">
        {/* Cabecera superior con avatar del usuario, link a su perfil y utilidades */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200/90 bg-white px-5 py-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <AvatarBadge
              nickname={user?.nickname || "vecino"}
              avatarUrl={user?.avatar || null}
              size="lg"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-extrabold text-stone-900">
                  Mensajería directa
                </h1>
                {totalUnreadCount > 0 && (
                  <span
                    style={{ backgroundColor: TERRACOTTA_NOTIFICATION }}
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold text-white"
                  >
                    {totalUnreadCount} sin leer
                  </span>
                )}
              </div>

              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                <span>Conectado como @{user?.nickname || "vecino"}</span>
                {onOpenProfile && (
                  <button
                    type="button"
                    onClick={() => onOpenProfile(user)}
                    className="inline-flex items-center gap-1 font-bold text-[#2d6a4f] hover:underline"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Ir a mi perfil</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {totalUnreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2 text-xs font-bold text-stone-700 transition hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
              >
                <CheckCheck className="h-4 w-4 text-[#2d6a4f]" />
                <span>Marcar todo como leído</span>
              </button>
            )}
          </div>
        </div>

        {/* Grid principal: Lista de chats y solicitudes (4/12) + Conversación activa (8/12) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Columna izquierda: Todos los chats y solicitudes */}
          <aside className="space-y-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs lg:col-span-4">
            <div className="flex gap-1.5 rounded-xl bg-[#FAF9F6] p-1 ring-1 ring-stone-200/80">
              <button
                type="button"
                onClick={() => setSidebarView("chats")}
                style={
                  sidebarView === "chats"
                    ? { backgroundColor: PRIMARY_GREEN, color: "#ffffff" }
                    : undefined
                }
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold transition ${
                  sidebarView === "chats"
                    ? "text-white"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Todos los chats ({threads.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarView("requests")}
                style={
                  sidebarView === "requests"
                    ? { backgroundColor: PRIMARY_GREEN, color: "#ffffff" }
                    : undefined
                }
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold transition ${
                  sidebarView === "requests"
                    ? "text-white"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Inbox className="h-3.5 w-3.5" />
                <span>Solicitudes</span>
                {messageRequests.length > 0 && (
                  <span
                    style={{ backgroundColor: TERRACOTTA_NOTIFICATION }}
                    className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-extrabold text-white"
                  >
                    {messageRequests.length}
                  </span>
                )}
              </button>
            </div>

            {sidebarView === "chats" ? (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por @vecino o artículo..."
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] py-2 pl-9 pr-3 text-xs text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
                  />
                </div>

                <div className="max-h-[460px] space-y-2 overflow-y-auto pr-0.5">
                  {filteredThreads.map((thread) => {
                    const isSelected = thread.id === activeThread?.id;
                    const lastMsg =
                      Array.isArray(thread.messages) &&
                      thread.messages[thread.messages.length - 1];

                    return (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => selectThread(thread.id)}
                        className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${
                          isSelected
                            ? "border-[#2d6a4f] bg-emerald-50/60"
                            : "border-stone-200/80 bg-[#FAF9F6] hover:border-[#2d6a4f]/60"
                        }`}
                      >
                        <AvatarBadge
                          nickname={thread.peer_nickname}
                          avatarUrl={thread.peer_avatar}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-extrabold text-stone-900">
                              @{thread.peer_nickname}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {lastMsg?.timestamp && (
                                <span className="text-[10px] text-stone-400">
                                  {formatFullTimestamp(lastMsg.timestamp)}
                                </span>
                              )}
                              {(thread.unreadCount || 0) > 0 && (
                                <span
                                  style={{
                                    backgroundColor: TERRACOTTA_NOTIFICATION,
                                  }}
                                  className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-extrabold text-white"
                                >
                                  {thread.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-[#2d6a4f]">
                            {thread.publication_title}
                          </p>

                          <p className="mt-0.5 line-clamp-1 text-xs text-stone-600">
                            {lastMsg?.text || "Sin mensajes aún"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="max-h-[480px] space-y-3 overflow-y-auto">
                {messageRequests.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-stone-200 bg-[#FAF9F6] p-6 text-center text-xs text-stone-500">
                    No tienes solicitudes de mensajes pendientes.
                  </p>
                ) : (
                  messageRequests.map((req) => (
                    <div
                      key={req.id}
                      className="space-y-2.5 rounded-2xl border border-stone-200 bg-[#FAF9F6] p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <AvatarBadge
                            nickname={req.requester_nickname}
                            avatarUrl={req.requester_avatar}
                          />
                          <div>
                            <p className="text-xs font-extrabold text-stone-900">
                              @{req.requester_nickname}
                            </p>
                            <p className="text-[10px] text-stone-500">
                              {req.requester_zone}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-stone-400">
                          {formatFullTimestamp(req.created_at)}
                        </span>
                      </div>

                      <p className="text-[11px] font-bold text-[#2d6a4f]">
                        Artículo: {req.publication_title}
                      </p>

                      <p className="rounded-xl bg-white p-2.5 text-xs text-stone-700 ring-1 ring-stone-200/70">
                        {req.note}
                      </p>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => declineMessageRequest(req.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Rechazar</span>
                        </button>
                        <button
                          type="button"
                          style={{ backgroundColor: PRIMARY_GREEN }}
                          onClick={() => {
                            acceptMessageRequest(req.id);
                            setSidebarView("chats");
                          }}
                          className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-extrabold text-white hover:opacity-90"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Aceptar chat</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </aside>

          {/* Columna derecha: Conversación activa completa */}
          <div className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xs lg:col-span-8">
            {activeThread ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-[#FAF9F6] px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <AvatarBadge
                      nickname={activeThread.peer_nickname}
                      avatarUrl={activeThread.peer_avatar}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-stone-900">
                          @{activeThread.peer_nickname}
                        </span>
                        {onOpenProfile && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenProfile({
                                id: activeThread.peer_id,
                                nickname: activeThread.peer_nickname,
                                avatar: activeThread.peer_avatar,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-[#2d6a4f] ring-1 ring-[#2d6a4f]/25 hover:bg-emerald-100"
                          >
                            <User className="h-3 w-3" />
                            <span>Ver perfil</span>
                          </button>
                        )}
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                        <span>{activeThread.publication_title}</span>
                        {activeThread.peer_zone && (
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin
                              style={{ color: PRIMARY_GREEN }}
                              className="h-3 w-3"
                            />
                            {activeThread.peer_zone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {activeThread.messages?.map((msg) => {
                    const isMine = msg.sender === (user?.nickname || "yo");
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isMine && (
                          <AvatarBadge
                            nickname={msg.sender}
                            avatarUrl={activeThread.peer_avatar}
                          />
                        )}

                        <div
                          className={`flex max-w-[75%] flex-col ${
                            isMine ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            style={
                              isMine
                                ? { backgroundColor: PRIMARY_GREEN, color: "#ffffff" }
                                : undefined
                            }
                            className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                              isMine
                                ? "text-white"
                                : "bg-[#FAF9F6] text-stone-800 ring-1 ring-stone-200"
                            }`}
                          >
                            <p>{msg.text}</p>
                          </div>

                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-stone-400">
                            <span>@{msg.sender}</span>
                            {msg.timestamp && (
                              <span>· {formatFullTimestamp(msg.timestamp)}</span>
                            )}
                            {msg.read && (
                              <CheckCheck className="h-3 w-3 text-[#2d6a4f]" />
                            )}
                          </span>
                        </div>

                        {isMine && (
                          <AvatarBadge
                            nickname={user?.nickname || "yo"}
                            avatarUrl={user?.avatar || null}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <form
                  onSubmit={handleSend}
                  className="flex items-center gap-2.5 border-t border-stone-100 bg-[#FAF9F6] p-4"
                >
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={`Escribe un mensaje para @${activeThread.peer_nickname}...`}
                    className="flex-1 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
                  />
                  <button
                    type="submit"
                    style={{ backgroundColor: PRIMARY_GREEN }}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-extrabold text-white transition hover:opacity-90"
                  >
                    <Send className="h-4 w-4" />
                    <span>Enviar</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-stone-500">
                <MessageSquare
                  style={{ color: PRIMARY_GREEN }}
                  className="h-10 w-10 opacity-70"
                />
                <p className="mt-2 text-sm font-bold text-stone-800">
                  Selecciona una conversación para comenzar
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}