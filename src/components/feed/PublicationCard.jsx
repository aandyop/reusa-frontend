import {
  MapPin,
  ShieldCheck,
  Sparkles,
  Award,
  MessageSquare,
  Inbox,
  Tag,
  Package,
  Repeat,
  Gift,
  Images,
} from "lucide-react";
import { REPOINTS_COLOR } from "../../utils/constants";
import PublicationActionButtons from "./PublicationActionButtons";

const PRIMARY_GREEN = "#2d6a4f";
const SECONDARY_TERRACOTTA = "#E76F51";

const STATUS_BADGE_MAP = {
  DISPONIBLE: {
    label: "DISPONIBLE",
    className: "bg-emerald-50 text-[#2d6a4f] ring-1 ring-[#2d6a4f]/30",
  },
  RESERVADO: {
    label: "RESERVADO",
    className: "bg-emerald-100/80 text-[#2d6a4f] ring-1 ring-[#2d6a4f]/40",
  },
  ENTREGADO: {
    label: "ENTREGADO",
    className: "bg-emerald-900 text-white",
  },
};

export default function PublicationCard({
  publication,
  currentUser = null,
  isHighlighted = false,
  readOnlyHistory = false,
  onHoverChange,
  onSelectPublication,
  onRequestItem,
  onInspectRequests,
  onOpenChat,
  onRequireAuth,
  onActionFeedback,
}) {
  if (!publication) return null;

  const {
    id,
    author_id,
    author_nickname = "vecino_reusa",
    author_role = "user",
    author_is_verified = true,
    approved_applicant_id = null,
    title,
    description,
    primary_image = null,
    images = [],
    category,
    item_condition,
    modality = "Donación",
    trade_preference,
    size_scale = "M",
    tags = [],
    status = "DISPONIBLE",
    zone_name = "Valera, Trujillo",
    re_points_reward = 25,
    pending_requests_count = 0,
    unread_messages_count = 0,
    created_at,
  } = publication;

  const currentUserId = currentUser?.id;
  const isOwner = Boolean(currentUserId && author_id === currentUserId);
  const isApprovedApplicant = Boolean(
    currentUserId && approved_applicant_id === currentUserId
  );

  const statusMeta = STATUS_BADGE_MAP[status] || STATUS_BADGE_MAP.DISPONIBLE;
  const isTrade = modality === "Trueque";

  const allImages = (() => {
    const list = [];
    if (primary_image) list.push(primary_image);
    if (Array.isArray(images)) {
      images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list;
  })();

  const coverImage = allImages[0] || null;
  const extraImagesCount = allImages.length > 1 ? allImages.length - 1 : 0;

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString("es-VE", {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <article
      onMouseEnter={() => onHoverChange?.(id)}
      onMouseLeave={() => onHoverChange?.(null)}
      onClick={() => !readOnlyHistory && onSelectPublication?.(publication)}
      style={isHighlighted ? { borderColor: PRIMARY_GREEN } : undefined}
      className={`rounded-2xl border bg-white p-5 transition ${
        readOnlyHistory ? "cursor-default" : "cursor-pointer"
      } ${
        isHighlighted
          ? "bg-emerald-50/20 shadow-md ring-1 ring-[#2d6a4f]/30"
          : "border-stone-200/90 shadow-2xs hover:border-[#2d6a4f]/60"
      }`}
    >
      {/* Cabecera: Autor + Nickname + Insignias + Estado */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div
            style={{ color: PRIMARY_GREEN }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-extrabold"
          >
            {String(author_nickname).slice(0, 2).toUpperCase()}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-extrabold text-stone-900">
                @{author_nickname}
              </span>

              {author_is_verified && (
                <span
                  style={{ color: PRIMARY_GREEN }}
                  className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold ring-1 ring-[#2d6a4f]/25"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Verificado
                </span>
              )}

              {author_role === "releader" && (
                <span
                  style={{ backgroundColor: PRIMARY_GREEN }}
                  className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                >
                  <Sparkles className="h-3 w-3" />
                  ReLeader
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-stone-500">
              <span className="inline-flex items-center gap-1">
                <MapPin
                  style={{ color: PRIMARY_GREEN }}
                  className="h-3 w-3"
                />
                {zone_name}
              </span>
              {formattedDate && <span>· {formattedDate}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-[#2d6a4f] ring-1 ring-[#2d6a4f]/25">
            <Award
              className="h-3.5 w-3.5"
              style={{ color: REPOINTS_COLOR || PRIMARY_GREEN }}
            />
            <span>+{re_points_reward} RePoints</span>
          </span>

          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${statusMeta.className}`}
          >
            {statusMeta.label}
          </span>
        </div>
      </div>

      {/* Cuerpo principal: Portada + Título + Descripción */}
      <div className="mt-3.5 flex flex-col gap-4 sm:flex-row">
        {coverImage && (
          <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 sm:w-44">
            <img
              src={coverImage}
              alt={title}
              className="h-full w-full object-cover"
            />
            {extraImagesCount > 0 && (
              <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-stone-950/75 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                <Images className="h-3 w-3" />
                <span>+{extraImagesCount}</span>
              </span>
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              style={{ backgroundColor: PRIMARY_GREEN }}
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold text-white"
            >
              {isTrade ? (
                <Repeat className="h-3 w-3" />
              ) : (
                <Gift className="h-3 w-3" />
              )}
              {modality}
            </span>

            {category && (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-[#2d6a4f]">
                {category}
              </span>
            )}

            {item_condition && (
              <span className="rounded-md border border-[#2d6a4f]/25 bg-white px-2 py-0.5 text-[11px] font-medium text-[#2d6a4f]">
                {item_condition}
              </span>
            )}

            {size_scale && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-[#2d6a4f]">
                <Package className="h-3 w-3" />
                Medida {size_scale}
              </span>
            )}
          </div>

          <h3 className="mt-2 text-base font-extrabold text-stone-900">
            {title}
          </h3>

          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">
            {description}
          </p>

          {isTrade && trade_preference && (
            <div className="mt-2.5 rounded-xl border border-[#2d6a4f]/25 bg-emerald-50/70 px-3 py-2 text-xs text-[#2d6a4f]">
              <span className="font-extrabold">Busca a cambio: </span>
              <span>{trade_preference}</span>
            </div>
          )}

          {/* Etiquetas en color secundario terracota (#E76F51) */}
          {Array.isArray(tags) && tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: "rgba(231, 111, 81, 0.14)",
                    color: SECONDARY_TERRACOTTA,
                    borderColor: "rgba(231, 111, 81, 0.35)",
                  }}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pie de tarjeta: Guardar, Compartir, Reportar y Acciones principales */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3.5"
      >
        <div className="flex flex-wrap items-center gap-2">
          {!readOnlyHistory && (
            <button
              type="button"
              onClick={() => onSelectPublication?.(publication)}
              className="text-[11px] font-bold text-[#2d6a4f] underline-offset-2 hover:underline"
            >
              Ver detalles y mapa →
            </button>
          )}

          {!readOnlyHistory && status !== "ENTREGADO" && (
            <PublicationActionButtons
              publication={publication}
              onRequireAuth={onRequireAuth}
              onActionFeedback={onActionFeedback}
              compact
            />
          )}
        </div>

        {!readOnlyHistory && (
          <div className="flex flex-wrap items-center gap-2">
            {isOwner && (
              <button
                type="button"
                style={{ backgroundColor: PRIMARY_GREEN }}
                onClick={() => onInspectRequests?.(publication)}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-90"
              >
                <Inbox className="h-3.5 w-3.5" />
                <span>Solicitudes</span>
                {pending_requests_count > 0 && (
                  <span
                    style={{ backgroundColor: SECONDARY_TERRACOTTA }}
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold text-white"
                  >
                    {pending_requests_count}
                  </span>
                )}
              </button>
            )}

            {!isOwner && status === "DISPONIBLE" && (
              <button
                type="button"
                style={{ backgroundColor: PRIMARY_GREEN }}
                onClick={() => onRequestItem?.(publication)}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-90"
              >
                <span>
                  {isTrade ? "Proponer trueque" : "Solicitar artículo"}
                </span>
              </button>
            )}

            {(isOwner || isApprovedApplicant) && status === "RESERVADO" && (
              <button
                type="button"
                style={{ backgroundColor: PRIMARY_GREEN }}
                onClick={() => onOpenChat?.(publication)}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-90"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Abrir chat de entrega</span>
                {unread_messages_count > 0 && (
                  <span
                    style={{ backgroundColor: SECONDARY_TERRACOTTA }}
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold text-white"
                  >
                    {unread_messages_count}
                  </span>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}