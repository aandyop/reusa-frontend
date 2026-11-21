import { useState } from "react";
import { X, ShieldCheck, Sparkles, KeyRound } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/common/Navbar";
import FeedPage from "./pages/FeedPage";
import EventsPage from "./pages/EventsPage";
import BlogPage from "./pages/BlogPage";
import ProfilePage from "./pages/ProfilePage";
import PublishModal from "./components/feed/PublishModal";
import RequestModal from "./components/chat/RequestModal";
import ApplicantReviewModal from "./components/chat/ApplicantReviewModal";
import ChatDrawer from "./components/chat/ChatDrawer";

const DEMO_PROFILES = {
  verified: {
    token: "demo-token-verified",
    user: {
      id: "usr-001",
      nickname: "NomadaVerde",
      role: "user",
      is_verified: true,
      verification_status: "verified",
      re_points: 185,
      completed_donations_count: 3,
      completed_received_count: 2,
      negative_reports_count: 0,
      approx_zone_name: "Sector El Mirador",
      approx_lat: 8.6095,
      approx_lng: -70.6082,
    },
  },
  releader: {
    token: "demo-token-releader",
    user: {
      id: "usr-002",
      nickname: "LiderSostenible",
      role: "releader",
      is_verified: true,
      verification_status: "verified",
      re_points: 540,
      completed_donations_count: 7,
      completed_received_count: 4,
      negative_reports_count: 0,
      approx_zone_name: "Centro Histórico",
      approx_lat: 8.6128,
      approx_lng: -70.6051,
    },
  },
  unverified: {
    token: "demo-token-basic",
    user: {
      id: "usr-004",
      nickname: "VecinoCurioso",
      role: "user",
      is_verified: false,
      verification_status: "unverified",
      re_points: 0,
      completed_donations_count: 0,
      completed_received_count: 0,
      negative_reports_count: 0,
      approx_zone_name: "Las Acacias",
      approx_lat: 8.6152,
      approx_lng: -70.6114,
    },
  },
};

function QuickAuthModal({ isOpen, onClose }) {
  const { login, updateUserState } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRealLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);
    try {
      await login({ email, password });
      onClose?.();
    } catch (err) {
      setErrorMsg(
        err?.message ||
          "No se pudo conectar con /api/auth/login. Usa un acceso rápido de prueba mientras levantas el backend."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = (profileKey) => {
    const chosen = DEMO_PROFILES[profileKey];
    if (!chosen) return;
    localStorage.setItem("reusa_token", chosen.token);
    localStorage.setItem("reusa_user", JSON.stringify(chosen.user));
    updateUserState(chosen.user);
    // Sincroniza el token en memoria recargando suavemente si es necesario
    window.location.reload();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-stone-200 bg-[#FAF9F6] shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#2D6A4F]" />
            <h2
              id="auth-modal-title"
              className="text-base font-extrabold text-stone-900"
            >
              Ingresar a ReUsa
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-xl p-2 text-stone-500 hover:bg-stone-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Accesos rápidos para probar roles en frontend */}
          <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/75 p-4">
            <p className="text-xs font-bold text-[#2D6A4F]">
              Probar roles de interfaz (sin backend):
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin("verified")}
                className="flex items-center justify-between rounded-xl border border-emerald-200 bg-white px-3.5 py-2 text-left text-xs font-bold text-stone-800 hover:bg-emerald-50"
              >
                <span>@NomadaVerde (Verificado · 3/5 donaciones)</span>
                <ShieldCheck className="h-4 w-4 text-[#2D6A4F]" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("releader")}
                className="flex items-center justify-between rounded-xl border border-emerald-200 bg-white px-3.5 py-2 text-left text-xs font-bold text-stone-800 hover:bg-emerald-50"
              >
                <span>@LiderSostenible (ReLeader · Eventos y Blog)</span>
                <Sparkles className="h-4 w-4 text-[#2D6A4F]" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("unverified")}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-left text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                <span>@VecinoCurioso (Básico sin verificar)</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleRealLogin} className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              O inicia sesión con tu cuenta API
            </p>

            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {errorMsg}
              </div>
            )}

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#2D6A4F] focus:outline-none"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#2D6A4F] focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#2D6A4F] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#245640] disabled:opacity-50"
            >
              {submitting ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ReUsaShell() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("feed");
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [requestTargetPub, setRequestTargetPub] = useState(null);
  const [reviewTargetPub, setReviewTargetPub] = useState(null);
  const [chatInitialPubId, setChatInitialPubId] = useState(null);

  const [newPublication, setNewPublication] = useState(null);
  const [extraConversations, setExtraConversations] = useState([]);
  const [removedPubIds, setRemovedPubIds] = useState([]);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((current) => (current === msg ? "" : current));
    }, 4000);
  };

  const handlePublicationCreated = (createdPub) => {
    setNewPublication(createdPub);
    setActiveTab("feed");
    showToast(`Artículo "${createdPub.title}" publicado en el feed.`);
  };

  const handleRequestSubmitted = (pubId) => {
    showToast(
      "Solicitud enviada. El donante podrá revisar tu perfil verificado y responder."
    );
    return pubId;
  };

  const handleApprovedRequest = ({
    publicationId,
    applicantId,
    applicantNickname,
  }) => {
    const newConv = {
      id: `conv-${publicationId}-${Date.now()}`,
      publication_id: publicationId,
      publication_title: reviewTargetPub?.title || "Artículo aprobado",
      publication_status: "RESERVADO",
      re_points_reward: reviewTargetPub?.re_points_reward || 30,
      donor_id: user?.id || "usr-002",
      donor_nickname: user?.nickname || "LiderSostenible",
      recipient_id: applicantId,
      recipient_nickname: applicantNickname || "vecino_aprobado",
      unread_count: 0,
      is_active: true,
      messages: [
        {
          id: `msg-welcome-${Date.now()}`,
          sender_id: user?.id || "usr-002",
          body: "¡Solicitud aprobada! Por aquí podemos coordinar la hora y punto exacto de entrega.",
          created_at: new Date().toISOString(),
        },
      ],
    };

    setExtraConversations((prev) => [newConv, ...prev]);
    setChatInitialPubId(publicationId);
    setReviewTargetPub(null);
    setIsChatOpen(true);
    showToast("Reserva aprobada: el artículo pasó a RESERVADO y se abrió el chat.");
  };

  const handleDeliveryConfirmed = (publicationId) => {
    // Al marcar ENTREGADO, desaparece del feed principal
    setRemovedPubIds((prev) =>
      prev.includes(publicationId) ? prev : [...prev, publicationId]
    );
    showToast(
      "Entrega confirmada (ENTREGADO): salió del feed, se sumaron RePoints y quedó en el historial del perfil."
    );
  };

  const handleReservationCancelled = (publicationId) => {
    showToast(
      `Reserva liberada para la publicación ${publicationId}: vuelve a estar DISPONIBLE.`
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenPublishModal={() => setIsPublishModalOpen(true)}
        onOpenChatDrawer={() => {
          setChatInitialPubId(null);
          setIsChatOpen(true);
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {toastMsg && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-100/90 px-4 py-2.5 text-xs font-bold text-[#2D6A4F] shadow-2xs">
            {toastMsg}
          </div>
        </div>
      )}

      {activeTab === "feed" && (
        <FeedPage
          externalNewPublication={newPublication}
          onRequestItem={(pub) => setRequestTargetPub(pub)}
          onInspectRequests={(pub) => setReviewTargetPub(pub)}
          onOpenChat={(pub) => {
            setChatInitialPubId(pub.id);
            setIsChatOpen(true);
          }}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />
      )}

      {activeTab === "events" && (
        <EventsPage onOpenAuthModal={() => setIsAuthModalOpen(true)} />
      )}

      {activeTab === "blog" && <BlogPage />}

      {activeTab === "profile" && (
        <ProfilePage onOpenAuthModal={() => setIsAuthModalOpen(true)} />
      )}

      {/* Modales y Drawer de Flujos */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublicationCreated={handlePublicationCreated}
        onOpenProfileVerification={() => setActiveTab("profile")}
      />

      <RequestModal
        publication={requestTargetPub}
        isOpen={Boolean(requestTargetPub)}
        onClose={() => setRequestTargetPub(null)}
        onRequestSubmitted={handleRequestSubmitted}
      />

      <ApplicantReviewModal
        publication={reviewTargetPub}
        isOpen={Boolean(reviewTargetPub)}
        onClose={() => setReviewTargetPub(null)}
        onApprovedRequest={handleApprovedRequest}
      />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialPublicationId={chatInitialPubId}
        extraConversations={extraConversations}
        onDeliveryConfirmed={(pubId) => {
          handleDeliveryConfirmed(pubId);
          // Filtra la publicación entregada si está en el feed
          if (newPublication?.id === pubId) {
            setNewPublication(null);
          }
          if (removedPubIds.includes(pubId)) return;
        }}
        onReservationCancelled={handleReservationCancelled}
      />

      <QuickAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ReUsaShell />
    </AuthProvider>
  );
}