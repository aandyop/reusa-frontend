import { useEffect, useState } from "react";
import {
  X,
  Send,
  CheckCircle2,
  Award,
  RotateCcw,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { chatService } from "../../services/chatService";
import { publicationsService } from "../../services/publicationsService";
import { REPOINTS_COLOR } from "../../utils/constants";

const FALLBACK_CONVERSATIONS = [
  {
    id: "conv-01",
    publication_id: "pub-104",
    publication_title: "Microondas doméstico funcional",
    publication_status: "RESERVADO",
    re_points_reward: 35,
    donor_id: "usr-005",
    donor_nickname: "HogarSegundoCiclo",
    recipient_id: "usr-001",
    recipient_nickname: "NomadaVerde",
    unread_count: 2,
    is_active: true,
    messages: [
      {
        id: "msg-01",
        sender_id: "usr-001",
        body: "Hola Sofía, ¿confirmamos la hora de entrega del microondas?",
        created_at: "2026-11-21T10:15:00Z",
      },
      {
        id: "msg-02",
        sender_id: "usr-005",
        body: "¡Hola! Sí, estoy en casa desde las 3:30 PM. Te paso la referencia exacta.",
        created_at: "2026-11-21T10:18:00Z",
      },
      {
        id: "msg-03",
        sender_id: "usr-005",
        body: "Avísame cuando vayas saliendo para tenerlo listo.",
        created_at: "2026-11-21T10:19:00Z",
      },
    ],
  },
];

export default function ChatDrawer({
  isOpen,
  onClose,
  initialPublicationId = null,
  extraConversations = [],
  onDeliveryConfirmed,
  onReservationCancelled,
}) {
  const { token, user, setUnreadCount, updateUserState } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [promotedBanner, setPromotedBanner] = useState(false);

  // Cargar conversaciones al abrir el drawer
  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    async function loadConversations() {
      try {
        const res = await chatService.getConversations(token);
        const list = Array.isArray(res) ? res : res?.conversations || [];
        if (active) {
          const merged = [...extraConversations, ...list];
          setConversations(merged);
          const matchByPub = initialPublicationId
            ? merged.find((c) => c.publication_id === initialPublicationId)
            : null;
          setSelectedConvId(matchByPub?.id || merged[0]?.id || null);
        }
      } catch {
        if (active) {
          const merged = [...extraConversations, ...FALLBACK_CONVERSATIONS];
          setConversations(merged);
          const matchByPub = initialPublicationId
            ? merged.find((c) => c.publication_id === initialPublicationId)
            : null;
          setSelectedConvId(matchByPub?.id || merged[0]?.id || null);
        }
      }
    }

    loadConversations();
    return () => {
      active = false;
    };
  }, [isOpen, token, initialPublicationId, extraConversations]);

  const activeConversation = conversations.find((c) => c.id === selectedConvId);

  // Marcar conversación como leída al seleccionarla y actualizar badge global
  useEffect(() => {
    if (!isOpen || !activeConversation) return;

    if (activeConversation.unread_count > 0) {
      chatService.markAsRead(activeConversation.id, token).catch(() => {});

      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === activeConversation.id ? { ...c, unread_count: 0 } : c
        );
        const remainingUnread = updated.reduce(
          (acc, c) => acc + (c.unread_count || 0),
          0
        );
        setUnreadCount(remainingUnread);
        return updated;
      });
    }
  }, [isOpen, activeConversation, token, setUnreadCount]);

  if (!isOpen) return null;

  const isDonor = Boolean(
    user?.id && activeConversation?.donor_id === user.id
  );

  const counterpartNickname = isDonor
    ? activeConversation?.recipient_nickname
    : activeConversation?.donor_nickname;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!draftMessage.trim() || !activeConversation) return;

    const text = draftMessage.trim();
    setDraftMessage("");

    const optimisticMsg = {
      id: `msg-${Date.now()}`,
      sender_id: user?.id || "usr-local",
      body: text,
      created_at: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? { ...c, messages: [...(c.messages || []), optimisticMsg] }
          : c
      )
    );

    try {
      await chatService.sendMessage(activeConversation.id, text, token);
    } catch {
      // Mantiene el mensaje en vista previa local
    }
  };

  // Transición RESERVADO -> ENTREGADO (desaparece del feed y suma RePoints)
  const handleConfirmDelivery = async () => {
    if (!activeConversation) return;
    setConfirmingDelivery(true);
    try {
      await publicationsService.confirmDelivery(
        activeConversation.publication_id,
        token
      );
    } catch {
      // Continúa flujo reactivo local
    } finally {
      const reward = activeConversation.re_points_reward || 30;

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, publication_status: "ENTREGADO", is_active: false }
            : c
        )
      );

      // Actualiza RePoints, donaciones completadas y evalúa ascenso a ReLeader
      updateUserState((prev) => {
        if (!prev) return prev;
        const nextDonations = (prev.completed_donations_count ?? 0) + 1;
        const reports = prev.negative_reports_count ?? 0;
        const verified = Boolean(prev.is_verified ?? prev.isVerified);
        const becomesReLeader =
          verified && nextDonations >= 5 && reports === 0;

        if (becomesReLeader && prev.role !== "releader") {
          setPromotedBanner(true);
        }

        return {
          ...prev,
          re_points: (prev.re_points ?? prev.rePoints ?? 0) + reward,
          completed_donations_count: nextDonations,
          role: becomesReLeader ? "releader" : prev.role,
        };
      });

      onDeliveryConfirmed?.(activeConversation.publication_id);
      setConfirmingDelivery(false);
    }
  };

  // Cancelar reserva -> vuelve a DISPONIBLE en el feed
  const handleCancelReservation = async () => {
    if (!activeConversation) return;
    try {
      await publicationsService.cancelReservation(
        activeConversation.publication_id,
        token
      );
    } catch {
      // Continúa flujo local
    } finally {
      onReservationCancelled?.(activeConversation.publication_id);
      onClose?.();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mensajes y coordinación de entregas"
      className="fixed inset-0 z-50 flex justify-end bg-stone-950/45 backdrop-blur-xs"
    >
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-stone-200 bg-[#FAF9F6] shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#2D6A4F]" />
            <div>
              <h2 className="text-base font-extrabold text-stone-900">
                Mensajes y Entregas
              </h2>
              <p className="text-xs text-stone-500">
                Coordina punto y hora exacta de forma segura
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar mensajes"
            className="rounded-xl p-2 text-stone-500 hover:bg-stone-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Banner si acaba de ascender automáticamente a ReLeader */}
        {promotedBanner && (
          <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-100 px-5 py-2.5 text-xs font-bold text-[#2D6A4F]">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>
              ¡Felicidades! Alcanzaste 5 donaciones exitosas sin reportes y ahora eres ReLeader.
            </span>
          </div>
        )}

        {/* Cuerpo dividido: Lista de hilos + Ventana de chat */}
        <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-12">
          {/* Lista de conversaciones */}
          <div className="border-b border-stone-200 bg-white sm:col-span-5 sm:border-b-0 sm:border-r">
            {conversations.length === 0 ? (
              <p className="p-5 text-xs text-stone-500">
                No tienes conversaciones activas todavía. Aprueba una solicitud o espera aprobación en un artículo.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {conversations.map((conv) => {
                  const selected = conv.id === selectedConvId;
                  const otherNick =
                    user?.id === conv.donor_id
                      ? conv.recipient_nickname
                      : conv.donor_nickname;

                  return (
                    <li key={conv.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`w-full px-4 py-3.5 text-left transition ${
                          selected ? "bg-emerald-50/90" : "hover:bg-stone-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-stone-900">
                            @{otherNick || "vecino"}
                          </span>
                          {conv.unread_count > 0 && (
                            <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs font-medium text-[#2D6A4F]">
                          {conv.publication_title}
                        </p>
                        <span className="mt-1 inline-block rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600">
                          {conv.publication_status}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Conversación activa */}
          <div className="flex min-h-0 flex-col sm:col-span-7">
            {activeConversation ? (
              <>
                {/* Barra de estado del artículo y botones del donante */}
                <div className="border-b border-stone-200 bg-white p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-stone-900">
                        Chat con @{counterpartNickname || "vecino"}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Artículo: {activeConversation.publication_title}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-stone-800 ring-1 ring-amber-200">
                      <Award
                        className="h-3 w-3"
                        style={{ color: REPOINTS_COLOR, fill: REPOINTS_COLOR }}
                      />
                      +{activeConversation.re_points_reward || 30}
                    </span>
                  </div>

                  {/* Controles del donante mientras está RESERVADO */}
                  {isDonor &&
                    activeConversation.publication_status === "RESERVADO" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={confirmingDelivery}
                          onClick={handleConfirmDelivery}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#2D6A4F] px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#245640]"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Confirmar entrega realizada</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelReservation}
                          title="Liberar artículo y volver a DISPONIBLE en el feed"
                          className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-[#FAF9F6] px-2.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Liberar</span>
                        </button>
                      </div>
                    )}

                  {activeConversation.publication_status === "ENTREGADO" && (
                    <div className="mt-2.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-[#2D6A4F]">
                      ✓ Entrega confirmada. El artículo salió del feed y quedó guardado en el historial de tu perfil.
                    </div>
                  )}
                </div>

                {/* Historial de mensajes */}
                <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
                  {(activeConversation.messages || []).map((msg) => {
                    const mine = msg.sender_id === (user?.id || "usr-local");
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs ${
                            mine
                              ? "bg-[#2D6A4F] text-white"
                              : "border border-stone-200 bg-white text-stone-800"
                          }`}
                        >
                          <p>{msg.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Caja de envío */}
                {activeConversation.publication_status !== "ENTREGADO" && (
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-2 border-t border-stone-200 bg-white p-3"
                  >
                    <input
                      type="text"
                      value={draftMessage}
                      onChange={(e) => setDraftMessage(e.target.value)}
                      placeholder="Escribe la dirección exacta o acuerda la hora..."
                      className="flex-1 rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2 text-xs text-stone-900 focus:border-[#2D6A4F] focus:bg-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      aria-label="Enviar mensaje"
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2D6A4F] text-white transition hover:bg-[#245640]"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6 text-xs text-stone-400">
                Selecciona una conversación para ver los mensajes.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}