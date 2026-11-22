import { useState } from "react";
import { X, ShieldCheck, Sparkles, KeyRound } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider, useChat } from "./context/ChatContext";
import { SavedAndReportsProvider } from "./context/SavedAndReportsContext";
import Navbar from "./components/common/Navbar";
import ChatPanel from "./components/chat/ChatPanel";
import ReportPublicationModal from "./components/feed/ReportPublicationModal";
import FeedPage from "./pages/FeedPage";
import EventsPage from "./pages/EventsPage";
import BlogPage from "./pages/BlogPage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";
import RegisterPage from "./pages/RegisterPage";
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
      approx_zone_name: "Las Acacias · Valera",
      approx_lat: 9.3177,
      approx_lng: -70.6036,
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
      approx_zone_name: "Centro de Valera · Trujillo",
      approx_lat: 9.3189,
      approx_lng: -70.6041,
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
      approx_zone_name: "La Beatriz · Valera",
      approx_lat: 9.3125,
      approx_lng: -70.6122,
    },
  },
};

function QuickAuthModal({ isOpen, onClose, onGoToRegister }) {
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
          "No se pudo conectar con /auth/login (Failed to fetch). Usa un acceso rápido de prueba en Valera o regístrate mientras levantas el backend."
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
              Ingresar a ReUsa · Valera
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
          <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/75 p-4">
            <p className="text-xs font-bold text-[#2D6A4F]">
              Perfiles de prueba en Valera, Trujillo:
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin("verified")}
                className="flex items-center justify-between rounded-xl border border-emerald-200 bg-white px-3.5 py-2 text-left text-xs font-bold text-stone-800 hover:bg-emerald-50"
              >
                <span>@NomadaVerde · Las Acacias (Verificado · 3/5)</span>
                <ShieldCheck className="h-4 w-4 text-[#2D6A4F]" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("releader")}
                className="flex items-center justify-between rounded-xl border border-emerald-200 bg-white px-3.5 py-2 text-left text-xs font-bold text-stone-800 hover:bg-emerald-50"
              >
                <span>@LiderSostenible · Centro de Valera (ReLeader)</span>
                <Sparkles className="h-4 w-4 text-[#2D6A4F]" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("unverified")}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-left text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                <span>@VecinoCurioso · La Beatriz (Básico sin verificar)</span>
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

          {onGoToRegister && (
            <div className="border-t border-stone-200 pt-3 text-center text-xs text-stone-600">
              <span>¿Aún no tienes cuenta? </span>
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onGoToRegister();
                }}
                className="font-extrabold text-[#2D6A4F] hover:underline"
              >
                Crear cuenta aquí
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReUsaShell() {
  const { user, isAuthenticated } = useAuth();
  const { openChat, closeChat, totalUnreadCount } = useChat();

  const [activeTab, setActiveTab] = useState("feed");
  const [initialFeedPublicationId, setInitialFeedPublicationId] = useState(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

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

  const handleOpenChatForPublication = (pubId = null) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setChatInitialPubId(pubId);
    openChat();
  };

  const handleOpenFullChatPage = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    closeChat();
    setIsChatDrawerOpen(false);
    setActiveTab("chat");
  };

  const handleRegisteredUser = (registeredUser) => {
    setActiveTab("feed");
    showToast(
      `¡Bienvenido a ReUsa, @${registeredUser?.nickname || "vecino"}! Tu cuenta está lista.`
    );
  };

  const handlePublicationCreated = (createdPub) => {
    setNewPublication(createdPub);
    setActiveTab("feed");
    showToast(`Artículo "${createdPub.title}" publicado en Valera.`);
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
          body: "¡Solicitud aprobada! Por aquí podemos coordinar la hora y punto exacto en Valera.",
          created_at: new Date().toISOString(),
        },
      ],
    };

    setExtraConversations((prev) => [newConv, ...prev]);
    setReviewTargetPub(null);
    handleOpenChatForPublication(publicationId);
    showToast(
      "Reserva aprobada: el artículo pasó a RESERVADO y se abrió el chat."
    );
  };

  const handleDeliveryConfirmed = (publicationId) => {
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

  const effectiveTab =
    !isAuthenticated && activeTab === "chat" ? "feed" : activeTab;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900">
      <Navbar
        activeTab={effectiveTab}
        onSelectTab={(tab) => {
          if (tab !== "feed") {
            setInitialFeedPublicationId(null);
          }
          setActiveTab(tab);
        }}
        onOpenPublishModal={() => setIsPublishModalOpen(true)}
        onOpenChatDrawer={() => handleOpenChatForPublication(null)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenRegisterPage={() => setActiveTab("register")}
      />

      {toastMsg && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-100/90 px-4 py-2.5 text-xs font-bold text-[#2D6A4F] shadow-2xs">
            {toastMsg}
          </div>
        </div>
      )}

      {effectiveTab === "register" && (
        <RegisterPage
          onRegistered={handleRegisteredUser}
          onGoToLogin={() => setIsAuthModalOpen(true)}
          onBackToFeed={() => setActiveTab("feed")}
        />
      )}

      {effectiveTab === "feed" && (
        <FeedPage
          externalNewPublication={newPublication}
          initialSelectedPublicationId={initialFeedPublicationId}
          onClearInitialSelectedPublication={() =>
            setInitialFeedPublicationId(null)
          }
          unreadChatCount={isAuthenticated ? totalUnreadCount : 0}
          onRequestItem={(pub) => setRequestTargetPub(pub)}
          onInspectRequests={(pub) => setReviewTargetPub(pub)}
          onOpenChat={(pub) => handleOpenChatForPublication(pub?.id || null)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onActionFeedback={showToast}
        />
      )}

      {effectiveTab === "events" && (
        <EventsPage onOpenAuthModal={() => setIsAuthModalOpen(true)} />
      )}

      {effectiveTab === "blog" && <BlogPage />}

      {effectiveTab === "chat" && (
        <ChatPage
          onOpenProfile={() => setActiveTab("profile")}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />
      )}

      {effectiveTab === "profile" && (
        <ProfilePage
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onSelectPublication={(pub) => {
            setInitialFeedPublicationId(pub?.id || null);
            setActiveTab("feed");
          }}
          onActionFeedback={showToast}
        />
      )}

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

      {isAuthenticated && (
        <ChatDrawer
          isOpen={isChatDrawerOpen}
          onClose={() => setIsChatDrawerOpen(false)}
          initialPublicationId={chatInitialPubId}
          extraConversations={extraConversations}
          onDeliveryConfirmed={(pubId) => {
            handleDeliveryConfirmed(pubId);
            if (newPublication?.id === pubId) {
              setNewPublication(null);
            }
            if (removedPubIds.includes(pubId)) return;
          }}
          onReservationCancelled={handleReservationCancelled}
        />
      )}

      <ChatPanel onOpenFullChatPage={handleOpenFullChatPage} />

      <ReportPublicationModal
        onReported={(rep) =>
          showToast(`Reporte enviado para "${rep.publication_title}".`)
        }
      />

      <QuickAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onGoToRegister={() => setActiveTab("register")}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <SavedAndReportsProvider>
          <ReUsaShell />
        </SavedAndReportsProvider>
      </ChatProvider>
    </AuthProvider>
  );
}