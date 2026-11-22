import {
  Leaf,
  Plus,
  LogIn,
  LogOut,
  Award,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ChatBadgeButton from "../chat/ChatBadgeButton";
import { REPOINTS_COLOR } from "../../utils/constants";

const PRIMARY_GREEN = "#2d6a4f";

export default function Navbar({
  activeTab = "feed",
  onSelectTab,
  onOpenPublishModal,
  onOpenChatDrawer,
  onOpenAuthModal,
  onOpenRegisterPage,
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const userPoints = user?.re_points ?? user?.rePoints ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/90 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => onSelectTab?.("feed")}
          className="flex items-center gap-2 text-left"
        >
          <span
            style={{ backgroundColor: PRIMARY_GREEN }}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-2xs"
          >
            <Leaf className="h-5 w-5" />
          </span>
          <div>
            <span className="text-base font-extrabold tracking-tight text-stone-900">
              ReUsa
            </span>
            <span className="ml-1.5 hidden text-[11px] font-semibold text-stone-500 sm:inline">
              Valera · Trujillo
            </span>
          </div>
        </button>

        <nav
          aria-label="Navegación principal"
          className="flex flex-wrap items-center gap-1.5"
        >
          {[
            { id: "feed", label: "Feed" },
            { id: "events", label: "Eventos" },
            { id: "blog", label: "Blog" },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab?.(item.id)}
                style={
                  isActive
                    ? { backgroundColor: PRIMARY_GREEN, color: "#ffffff" }
                    : undefined
                }
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  isActive
                    ? "text-white shadow-2xs"
                    : "text-stone-700 hover:bg-emerald-50 hover:text-[#2d6a4f]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          {isAuthenticated && (
            <ChatBadgeButton onClick={() => onOpenChatDrawer?.()} />
          )}

          {onOpenPublishModal && (
            <button
              type="button"
              style={{ backgroundColor: PRIMARY_GREEN }}
              onClick={onOpenPublishModal}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold text-white transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              <span>Publicar</span>
            </button>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1.5 text-xs font-extrabold text-stone-900 ring-1 ring-amber-200">
                <Award
                  className="h-3.5 w-3.5"
                  style={{ color: REPOINTS_COLOR || "#d97706" }}
                />
                <span>{userPoints} RePoints</span>
              </span>

              <button
                type="button"
                onClick={() => onSelectTab?.("profile")}
                title="Ver mi perfil"
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-[#2d6a4f] ring-1 ring-[#2d6a4f]/25 transition hover:bg-emerald-100"
              >
                {user?.is_verified && <ShieldCheck className="h-3.5 w-3.5" />}
                <span>@{user?.nickname || "vecino"}</span>
              </button>

              <button
                type="button"
                onClick={logout}
                aria-label="Cerrar sesión"
                className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 py-2 text-xs font-bold text-stone-700 transition hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {onOpenAuthModal && (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 py-2 text-xs font-bold text-stone-700 transition hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Ingresar</span>
                </button>
              )}

              {onOpenRegisterPage && (
                <button
                  type="button"
                  style={{ backgroundColor: PRIMARY_GREEN }}
                  onClick={onOpenRegisterPage}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold text-white transition hover:opacity-90"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Registrarse</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}