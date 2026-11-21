import {
  Calendar,
  BookOpen,
  Compass,
  MessageCircle,
  Plus,
  ShieldCheck,
  Award,
  LogOut,
  LogIn,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { REPOINTS_COLOR } from "../../utils/constants";

export default function Navbar({
  activeTab = "feed",
  onSelectTab,
  onOpenPublishModal,
  onOpenChatDrawer,
  onOpenAuthModal,
}) {
  const {
    user,
    isAuthenticated,
    isVerified,
    isReLeader,
    unreadCount,
    logout,
  } = useAuth();

  const rePoints = user?.re_points ?? user?.rePoints ?? 0;

  const navItems = [
    { id: "feed", label: "Explorar", icon: Compass },
    { id: "events", label: "Eventos", icon: Calendar },
    { id: "blog", label: "Blog", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/90 bg-[#FAF9F6]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        {/* Marca / Logo ReUsa */}
        <button
          type="button"
          onClick={() => onSelectTab?.("feed")}
          className="flex items-center gap-2.5 text-left transition hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D6A4F] text-white shadow-sm">
            <span className="text-lg font-bold tracking-tight">R</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-stone-900">
                ReUsa
              </span>
              {isReLeader && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-[#2D6A4F]">
                  ReLeader
                </span>
              )}
            </div>
            <p className="hidden text-[11px] text-stone-500 sm:block">
              Comunidad y segunda vida
            </p>
          </div>
        </button>

        {/* Navegación principal */}
        <nav aria-label="Secciones principales" className="flex items-center gap-1 sm:gap-2">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectTab?.(id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[#2D6A4F] text-white shadow-xs"
                    : "text-stone-700 hover:bg-stone-200/70"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Acciones de usuario, RePoints y mensajes reactivos */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {isAuthenticated ? (
            <>
              {/* Contador de RePoints (#FFC639) */}
              <div
                title="Tus RePoints acumulados por intercambios y entregas"
                className="flex items-center gap-1.5 rounded-xl border border-amber-300/80 bg-amber-50/90 px-2.5 py-1.5 text-xs font-bold text-stone-800 sm:text-sm"
              >
                <Award
                  className="h-4 w-4 shrink-0"
                  style={{ color: REPOINTS_COLOR, fill: REPOINTS_COLOR }}
                />
                <span>{rePoints}</span>
                <span className="hidden text-stone-600 lg:inline">RePoints</span>
              </div>

              {/* Botón de Mensajes con contador reactivo */}
              <button
                type="button"
                onClick={() => onOpenChatDrawer?.()}
                aria-label="Mensajes"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 transition hover:border-[#2D6A4F]/40 hover:bg-stone-100"
              >
                <MessageCircle className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span
                    data-testid="unread-badge"
                    className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow-xs"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Botón + Publicar */}
              <button
                type="button"
                onClick={() => onOpenPublishModal?.()}
                title={
                  isVerified
                    ? "Publicar un artículo"
                    : "Verifica tu identidad para poder publicar"
                }
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isVerified
                    ? "bg-[#2D6A4F] text-white hover:bg-[#245640]"
                    : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                }`}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Publicar</span>
              </button>

              {/* Perfil / Nickname */}
              <button
                type="button"
                onClick={() => onSelectTab?.("profile")}
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-sm font-medium transition ${
                  activeTab === "profile"
                    ? "border-[#2D6A4F] bg-emerald-50 text-[#2D6A4F]"
                    : "border-stone-200 bg-white text-stone-800 hover:bg-stone-100"
                }`}
              >
                <span className="max-w-[110px] truncate">
                  @{user?.nickname || "usuario"}
                </span>
                {isVerified && (
                  <ShieldCheck
                    className="h-4 w-4 shrink-0 text-[#2D6A4F]"
                    title="Identidad verificada"
                  />
                )}
              </button>

              {/* Cerrar sesión */}
              <button
                type="button"
                onClick={logout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuthModal?.()}
              className="flex items-center gap-1.5 rounded-xl bg-[#2D6A4F] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#245640]"
            >
              <LogIn className="h-4 w-4" />
              <span>Ingresar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}