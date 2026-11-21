import {
  Award,
  MapPin,
  Package,
  Repeat,
  Gift,
  ShieldCheck,
  Users,
  MessageCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { REPOINTS_COLOR, SIZE_SCALES } from "../../utils/constants";

const STATUS_STYLES = {
  DISPONIBLE: {
    label: "Disponible",
    badgeClass: "bg-emerald-100 text-[#2D6A4F] border-emerald-200",
  },
  RESERVADO: {
    label: "Reservado",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  ENTREGADO: {
    label: "Entregado",
    badgeClass: "bg-stone-200 text-stone-700 border-stone-300",
  },
};

export default function PublicationCard({
  publication,
  isHighlighted = false,
  readOnlyHistory = false,
  onHoverPublication,
  onRequestItem,
  onInspectRequests,
  onOpenChat,
  onOpenAuthModal,
}) {
  const { user, isAuthenticated, isVerified } = useAuth();

  const {
    id,
    title,
    description,
    images = [],
    category,
    item_condition: itemCondition,
    modality,
    trade_preference: tradePreference,
    size_scale: sizeScale,
    tags = [],
    status = "DISPONIBLE",
    zone_name: zoneName,
    re_points_reward: rePointsReward = 25,
    author_id: authorId,
    author_nickname: authorNickname = "vecino_reusa",
    author_role: authorRole = "user",
    author_is_verified: authorIsVerified = true,
    pending_requests_count: pendingRequestsCount = 0,
    approved_applicant_id: approvedApplicantId = null,
    created_at: createdAt,
  } = publication;

  const isOwner = Boolean(user?.id && user.id === authorId);
  const isApprovedRecipient = Boolean(user?.id && user.id === approvedApplicantId);
  const statusConfig = STATUS_STYLES[status] || STATUS_STYLES.DISPONIBLE;
  const sizeInfo = SIZE_SCALES.find((s) => s.code === sizeScale);

  const primaryImage =
    Array.isArray(images) && images.length > 0
      ? typeof images[0] === "string"
        ? images[0]
        : images[0].image_url
      : null;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("es-VE", {
        day: "numeric",
        month: "short",
      })
    : "Reciente";

  return (
    <article
      onMouseEnter={() => onHoverPublication?.(id)}
      onMouseLeave={() => onHoverPublication?.(null)}
      className={`overflow-hidden rounded-2xl border bg-white transition-all duration-200 ${
        isHighlighted
          ? "border-[#2D6A4F] ring-2 ring-[#2D6A4F]/20 shadow-md"
          : "border-stone-200/90 shadow-xs hover:border-stone-300"
      }`}
    >
      {/* Cabecera tipo red social: Nickname + Insignias + Estado */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-[#2D6A4F]">
            {authorNickname.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-bold text-stone-900">
                @{authorNickname}
              </span>
              {authorIsVerified && (
                <ShieldCheck
                  className="h-4 w-4 text-[#2D6A4F]"
                  title="Identidad verificada"
                />
              )}
              {authorRole === "releader" && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-[#2D6A4F] ring-1 ring-emerald-200">
                  ReLeader
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <MapPin className="h-3 w-3 text-stone-400" />
              <span>{zoneName || "Zona cercana"}</span>
              <span>·</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Estado de la publicación y RePoints */}
        <div className="flex items-center gap-2">
          <div
            title="RePoints al completar la entrega"
            className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-stone-800 ring-1 ring-amber-200"
          >
            <Award
              className="h-3.5 w-3.5"
              style={{ color: REPOINTS_COLOR, fill: REPOINTS_COLOR }}
            />
            <span>+{rePointsReward}</span>
          </div>

          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusConfig.badgeClass}`}
          >
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Imagen principal */}
      {primaryImage ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
          <img
            src={primaryImage}
            alt={title}
            className={`h-full w-full object-cover transition duration-300 ${
              status === "ENTREGADO" ? "grayscale-[35%] opacity-90" : "hover:scale-[1.01]"
            }`}
          />
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-lg bg-stone-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-xs">
              {modality === "Trueque" ? (
                <Repeat className="h-3.5 w-3.5 text-amber-300" />
              ) : (
                <Gift className="h-3.5 w-3.5 text-emerald-300" />
              )}
              {modality}
            </span>
            <span className="rounded-lg bg-white/95 px-2.5 py-1 text-xs font-semibold text-stone-800 shadow-xs">
              {category}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-[#FAF9F6] px-4 pt-3">
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#2D6A4F] px-2.5 py-1 text-xs font-semibold text-white">
            {modality === "Trueque" ? (
              <Repeat className="h-3.5 w-3.5" />
            ) : (
              <Gift className="h-3.5 w-3.5" />
            )}
            {modality}
          </span>
          <span className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700">
            {category}
          </span>
        </div>
      )}

      {/* Cuerpo descriptivo + Clasificación completa */}
      <div className="p-4">
        <h3 className="text-lg font-bold leading-snug text-stone-900">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
          {description}
        </p>

        {modality === "Trueque" && tradePreference && (
          <div className="mt-2.5 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-xs text-amber-950">
            <span className="font-semibold">Busca intercambiar por: </span>
            {tradePreference}
          </div>
        )}

        {/* Metadatos físicos: Estado y Talla/Peso */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 font-medium text-stone-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#2D6A4F]" />
            Estado: <strong className="font-semibold">{itemCondition}</strong>
          </span>

          <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 font-medium text-stone-700">
            <Package className="h-3.5 w-3.5 text-stone-500" />
            Talla {sizeScale}
            {sizeInfo ? ` (${sizeInfo.label})` : ""}
          </span>
        </div>

        {/* Etiquetas rápidas (incluyendo "Está en la calle") */}
        {Array.isArray(tags) && tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tagItem, index) => {
              const label = typeof tagItem === "string" ? tagItem : tagItem.tag_name;
              const isStreet = label === "Está en la calle";
              return (
                <span
                  key={`${id}-tag-${index}`}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    isStreet
                      ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300"
                      : "bg-[#FAF9F6] text-stone-600 ring-1 ring-stone-200"
                  }`}
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}

        {/* Pie de tarjeta: Acciones según estado, rol y dueño */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
          <p className="text-[11px] italic text-stone-400">
            “Dar sin firmar el gesto deja que el objeto vuelva a tener vida.”
          </p>

          {/* Modo historial (ENTREGADO en perfil): solo lectura */}
          {readOnlyHistory || status === "ENTREGADO" ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-600">
              <CheckCircle2 className="h-4 w-4 text-[#2D6A4F]" />
              Entrega completada · Solo lectura
            </span>
          ) : isOwner ? (
            /* Acciones cuando el usuario actual es el donante */
            <div className="flex items-center gap-2">
              {status === "DISPONIBLE" ? (
                <button
                  type="button"
                  onClick={() => onInspectRequests?.(publication)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2D6A4F] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#245640]"
                >
                  <Users className="h-4 w-4" />
                  <span>
                    Revisar interesados
                    {pendingRequestsCount > 0 ? ` (${pendingRequestsCount})` : ""}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenChat?.(publication)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2D6A4F] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#245640]"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Coordinar entrega en chat</span>
                </button>
              )}
            </div>
          ) : status === "RESERVADO" ? (
            /* Cuando está RESERVADO por otro o por el usuario actual */
            isApprovedRecipient ? (
              <button
                type="button"
                onClick={() => onOpenChat?.(publication)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2D6A4F] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#245640]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Abrir chat de coordinación</span>
              </button>
            ) : (
              <span className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                En coordinación con un vecino
              </span>
            )
          ) : !isAuthenticated ? (
            /* Visitante sin sesión */
            <button
              type="button"
              onClick={() => onOpenAuthModal?.()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#2D6A4F] bg-white px-3.5 py-2 text-xs font-semibold text-[#2D6A4F] transition hover:bg-emerald-50"
            >
              Ingresar para solicitar
            </button>
          ) : !isVerified ? (
            /* Usuario básico sin identidad verificada */
            <span
              title="Debes verificar tu identidad en tu perfil para solicitar artículos"
              className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 px-3 py-2 text-xs font-medium text-stone-500"
            >
              <Lock className="h-3.5 w-3.5" />
              Verifica tu identidad para solicitar
            </span>
          ) : (
            /* Usuario verificado listo para solicitar */
            <button
              type="button"
              onClick={() => onRequestItem?.(publication)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2D6A4F] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#245640]"
            >
              Solicitar artículo
            </button>
          )}
        </div>
      </div>
    </article>
  );
}