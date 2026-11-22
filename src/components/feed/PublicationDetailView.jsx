import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  ArrowLeft,
  Heart,
  Flag,
  Share2,
  Check,
  Clock,
  MapPin,
  Tag,
  Package,
  ShieldCheck,
  Sparkles,
  Award,
  ExternalLink,
  MessageSquare,
  Inbox,
  Repeat,
  Gift,
  Maximize2,
  Star,
  X,
} from "lucide-react";
import { REPOINTS_COLOR } from "../../utils/constants";

const PRIMARY_GREEN = "#2d6a4f";
const SECONDARY_TERRACOTTA = "#E76F51";

function formatRelativePublishedTime(createdAt, modality = "Donación") {
  const prefix =
    modality === "Trueque" ? "Trueque publicado" : "Donación publicada";
  if (!createdAt) return `${prefix} hace un momento`;

  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return `${prefix} hace un momento`;

  const diffSeconds = Math.max(
    0,
    Math.floor((Date.now() - parsed.getTime()) / 1000)
  );
  if (diffSeconds < 60) return `${prefix} hace unos segundos`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${prefix} hace ${diffMinutes} ${
      diffMinutes === 1 ? "minuto" : "minutos"
    }`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${prefix} hace ${diffHours} ${
      diffHours === 1 ? "hora" : "horas"
    }`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${prefix} hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  return `${prefix} hace ${diffMonths} ${diffMonths === 1 ? "mes" : "meses"}`;
}

export default function PublicationDetailView({
  publication,
  allPublications = [],
  currentUser = null,
  isFavorite = false,
  onToggleFavorite,
  onReportPublication,
  onSelectPublication,
  onOpenDonorProfile,
  onRequestItem,
  onInspectRequests,
  onOpenChat,
  onBackToFeed,
}) {
  const imagesList = useMemo(() => {
    if (!publication) return [];
    const list = [];
    if (publication.primary_image) list.push(publication.primary_image);
    if (Array.isArray(publication.images)) {
      publication.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list;
  }, [publication]);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [reportedNotice, setReportedNotice] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    setActiveImageIdx(0);
    setLightboxOpen(false);
    setCopiedLink(false);
    setReportedNotice(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [publication?.id]);

  // Inicializar mapa de área aproximada de la publicación
  useEffect(() => {
    if (!publication) return;

    const lat = Number(publication.lat) || 9.3037778;
    const lng = Number(publication.lng) || -70.6123056;
    const radius = Number(publication.radius_meters) || 320;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      const circle = L.circle([lat, lng], {
        radius,
        color: PRIMARY_GREEN,
        weight: 2.2,
        fillColor: PRIMARY_GREEN,
        fillOpacity: 0.18,
      }).addTo(map);

      map.fitBounds(circle.getBounds(), { padding: [18, 18], maxZoom: 15 });
      map.invalidateSize();
      mapInstanceRef.current = map;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [publication]);

  const similarPublications = useMemo(() => {
    if (!publication) return [];
    const candidates = allPublications.filter(
      (item) => item.id !== publication.id && item.status !== "ENTREGADO"
    );
    const sameCategory = candidates.filter(
      (item) => item.category === publication.category
    );
    const others = candidates.filter(
      (item) => item.category !== publication.category
    );
    return [...sameCategory, ...others].slice(0, 6);
  }, [allPublications, publication]);

  if (!publication) return null;

  const {
    id,
    author_id,
    author_nickname = "vecino_reusa",
    author_avatar = null,
    author_role = "user",
    author_is_verified = true,
    author_re_points,
    approved_applicant_id = null,
    title,
    description,
    category = "General",
    item_condition = "Buen estado",
    modality = "Donación",
    trade_preference = null,
    size_scale = "M",
    availability = "Hora y fecha por acordar",
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
  const isTrade = modality === "Trueque";
  const activeImage = imagesList[activeImageIdx] || null;
  const publishedTimeLabel = formatRelativePublishedTime(created_at, modality);
  const donorPoints =
    author_re_points ?? (isOwner ? currentUser?.re_points : undefined) ?? 120;

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${
      window.location.pathname
    }?publication=${encodeURIComponent(id)}`;
    const shareText = `${title} (${modality}) en ReUsa — ${zone_name}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} · ReUsa`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback a copiar enlace
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleReport = () => {
    onReportPublication?.(publication);
    setReportedNotice(true);
    setTimeout(() => setReportedNotice(false), 3000);
  };

  return (
    <section
      aria-label={`Detalle de publicación: ${title}`}
      className="space-y-6"
    >
      {/* Barra superior normal para volver al feed */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white px-5 py-3.5 shadow-2xs">
        <button
          type="button"
          style={{ backgroundColor: PRIMARY_GREEN }}
          onClick={onBackToFeed}
          className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al feed</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span>Publicación</span>
          <span>·</span>
          <span
            style={{ color: PRIMARY_GREEN }}
            className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold ring-1 ring-[#2d6a4f]/25"
          >
            {status}
          </span>
        </div>
      </div>

      {/* Cuerpo principal en 2 columnas: Detalle (8/12) + Tarjeta del donante (4/12) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Columna izquierda (8/12) */}
        <div className="space-y-6 lg:col-span-8">
          {/* 1. Galería de imágenes con imagen principal destacada */}
          <div className="space-y-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs">
            {imagesList.length > 0 ? (
              <>
                <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
                  <img
                    src={activeImage}
                    alt={`${title} - imagen ${activeImageIdx + 1}`}
                    className="h-72 w-full object-cover sm:h-96"
                  />

                  {activeImageIdx === 0 && (
                    <span
                      style={{ backgroundColor: PRIMARY_GREEN }}
                      className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold text-white shadow-xs"
                    >
                      <Star className="h-3 w-3 fill-white" />
                      <span>Imagen principal</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    title="Ampliar imagen"
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-xl bg-stone-950/75 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-stone-950"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Ver completa</span>
                  </button>
                </div>

                {imagesList.length > 1 && (
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                    {imagesList.map((imgUrl, idx) => {
                      const selected = idx === activeImageIdx;
                      return (
                        <button
                          key={`${imgUrl}-${idx}`}
                          type="button"
                          onClick={() => setActiveImageIdx(idx)}
                          style={
                            selected
                              ? { borderColor: PRIMARY_GREEN }
                              : undefined
                          }
                          className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                            selected
                              ? "ring-2 ring-[#2d6a4f]/25"
                              : "border-stone-200 opacity-75 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Miniatura ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          {idx === 0 && (
                            <span
                              style={{ backgroundColor: PRIMARY_GREEN }}
                              className="absolute inset-x-0 bottom-0 py-0.5 text-center text-[9px] font-bold text-white"
                            >
                              Principal
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-[#FAF9F6] text-stone-500">
                <Package
                  style={{ color: PRIMARY_GREEN }}
                  className="h-10 w-10 opacity-75"
                />
                <p className="mt-2 text-xs font-semibold">
                  Este artículo no tiene fotografías adjuntas
                </p>
              </div>
            )}
          </div>

          {/* 2. Título + Botones de Favorito, Reporte y Compartir + Categoría + Tiempo */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    style={{ backgroundColor: PRIMARY_GREEN }}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold text-white"
                  >
                    {isTrade ? (
                      <Repeat className="h-3.5 w-3.5" />
                    ) : (
                      <Gift className="h-3.5 w-3.5" />
                    )}
                    {modality}
                  </span>

                  <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-[#2d6a4f] ring-1 ring-[#2d6a4f]/25">
                    {category}
                  </span>

                  {item_condition && (
                    <span className="rounded-md border border-stone-200 bg-[#FAF9F6] px-2.5 py-1 text-xs font-semibold text-stone-700">
                      {item_condition}
                    </span>
                  )}
                </div>

                <h1 className="mt-3 text-xl font-extrabold text-stone-900 sm:text-2xl">
                  {title}
                </h1>

                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-stone-500">
                  <Clock
                    style={{ color: PRIMARY_GREEN }}
                    className="h-3.5 w-3.5"
                  />
                  <span>{publishedTimeLabel}</span>
                </p>
              </div>

              {/* Botones de Favorito, Reporte y Compartir */}
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleFavorite?.(publication)}
                  title={
                    isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"
                  }
                  style={
                    isFavorite
                      ? {
                          borderColor: PRIMARY_GREEN,
                          backgroundColor: "rgba(45, 106, 79, 0.10)",
                          color: PRIMARY_GREEN,
                        }
                      : undefined
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 py-2 text-xs font-bold text-stone-700 transition hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
                >
                  <Heart
                    className="h-4 w-4"
                    style={
                      isFavorite
                        ? { color: PRIMARY_GREEN, fill: PRIMARY_GREEN }
                        : undefined
                    }
                  />
                  <span>{isFavorite ? "Favorito" : "Guardar"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  title="Compartir en redes sociales o copiar enlace"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 py-2 text-xs font-bold text-stone-700 transition hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
                >
                  {copiedLink ? (
                    <>
                      <Check
                        style={{ color: PRIMARY_GREEN }}
                        className="h-4 w-4"
                      />
                      <span style={{ color: PRIMARY_GREEN }}>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      <span>Compartir</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReport}
                  title="Reportar publicación"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 py-2 text-xs font-bold text-stone-700 transition hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
                >
                  <Flag className="h-4 w-4" />
                  <span>Reportar</span>
                </button>
              </div>
            </div>

            {reportedNotice && (
              <div className="mt-3 rounded-xl border border-[#2d6a4f]/25 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-[#2d6a4f]">
                Gracias por tu reporte. Nuestro equipo comunitario revisará esta
                publicación.
              </div>
            )}

            {/* 3. Descripción larga de la publicación */}
            <div className="mt-5 border-t border-stone-100 pt-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-stone-700">
                Descripción detallada
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-700">
                {description}
              </p>

              {isTrade && trade_preference && (
                <div className="mt-3 rounded-xl border border-[#2d6a4f]/25 bg-emerald-50/70 px-3.5 py-2.5 text-xs text-[#2d6a4f]">
                  <span className="font-extrabold">Preferencia de trueque: </span>
                  <span>{trade_preference}</span>
                </div>
              )}
            </div>

            {/* 4. Disponibilidad y Medidas */}
            <div className="mt-5 grid grid-cols-1 gap-4 border-t border-stone-100 pt-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-stone-200/80 bg-[#FAF9F6] p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-stone-500">
                  <Clock
                    style={{ color: PRIMARY_GREEN }}
                    className="h-3.5 w-3.5"
                  />
                  <span>Disponibilidad</span>
                </p>
                <p className="mt-1 text-sm font-bold text-stone-900">
                  {availability}
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200/80 bg-[#FAF9F6] p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-stone-500">
                  <Package
                    style={{ color: PRIMARY_GREEN }}
                    className="h-3.5 w-3.5"
                  />
                  <span>Medidas (Tamaño y peso estimado)</span>
                </p>
                <p className="mt-1 text-sm font-bold text-stone-900">
                  Escala {size_scale}
                </p>
              </div>
            </div>

            {/* Etiquetas en color secundario terracota (#E76F51) */}
            {Array.isArray(tags) && tags.length > 0 && (
              <div className="mt-4 border-t border-stone-100 pt-4">
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-stone-500">
                  Etiquetas del artículo
                </p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        backgroundColor: "rgba(231, 111, 81, 0.14)",
                        color: SECONDARY_TERRACOTTA,
                        borderColor: "rgba(231, 111, 81, 0.35)",
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold"
                    >
                      <Tag className="h-3 w-3" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. Ubicación textual y en el mapa */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-stone-900">
                  <MapPin
                    style={{ color: PRIMARY_GREEN }}
                    className="h-4 w-4"
                  />
                  <span>Ubicación aproximada</span>
                </h2>
                <p className="mt-0.5 text-xs font-semibold text-stone-600">
                  {zone_name}
                </p>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-[#2d6a4f] ring-1 ring-[#2d6a4f]/25">
                Área de referencia por privacidad
              </span>
            </div>

            <div className="mt-3.5 overflow-hidden rounded-2xl border border-stone-200">
              <div
                ref={mapContainerRef}
                className="z-0 h-56 w-full bg-stone-100"
              />
            </div>
          </div>
        </div>

        {/* Columna derecha (4/12): Tarjeta del perfil del donante + Acciones */}
        <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-stone-500">
              Publicado por
            </p>

            <div className="mt-3 flex items-center gap-3">
              {author_avatar ? (
                <img
                  src={author_avatar}
                  alt={`@${author_nickname}`}
                  className="h-12 w-12 rounded-full border border-stone-200 object-cover"
                />
              ) : (
                <div
                  style={{ backgroundColor: PRIMARY_GREEN }}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
                >
                  {String(author_nickname).slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-sm font-extrabold text-stone-900">
                    @{author_nickname}
                  </span>
                  {author_is_verified && (
                    <span
                      style={{ color: PRIMARY_GREEN }}
                      className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      Verificado
                    </span>
                  )}
                </div>

                {author_role === "releader" && (
                  <span
                    style={{ backgroundColor: PRIMARY_GREEN }}
                    className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    ReLeader comunitario
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#FAF9F6] px-3.5 py-2.5 ring-1 ring-stone-200/80">
              <span className="text-xs font-semibold text-stone-600">
                RePoints acumulados
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-stone-900">
                <Award
                  className="h-4 w-4"
                  style={{ color: REPOINTS_COLOR || PRIMARY_GREEN }}
                />
                <span>{donorPoints} pts</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => onOpenDonorProfile?.(publication)}
              style={{ color: PRIMARY_GREEN, borderColor: PRIMARY_GREEN }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border bg-emerald-50/50 px-4 py-2.5 text-xs font-extrabold transition hover:bg-emerald-50"
            >
              <span>Ver perfil del donante</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>

            <div className="mt-4 space-y-2.5 border-t border-stone-100 pt-4">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
                <span>Recompensa al completar</span>
                <span style={{ color: PRIMARY_GREEN }} className="font-extrabold">
                  +{re_points_reward} RePoints
                </span>
              </div>

              {isOwner && (
                <button
                  type="button"
                  style={{ backgroundColor: PRIMARY_GREEN }}
                  onClick={() => onInspectRequests?.(publication)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-extrabold text-white transition hover:opacity-90"
                >
                  <Inbox className="h-4 w-4" />
                  <span>Ver solicitudes</span>
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-extrabold text-white transition hover:opacity-90"
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-extrabold text-white transition hover:opacity-90"
                >
                  <MessageSquare className="h-4 w-4" />
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
          </div>
        </aside>
      </div>

      {/* 6. Anuncios similares en sección normal */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-stone-900">
            Anuncios similares
          </h2>
          <span className="text-xs font-semibold text-stone-500">
            {similarPublications.length}{" "}
            {similarPublications.length === 1 ? "sugerencia" : "sugerencias"}
          </span>
        </div>

        {similarPublications.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-200 bg-[#FAF9F6] p-5 text-center text-xs text-stone-500">
            No hay otros anuncios similares disponibles por el momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {similarPublications.map((sim) => {
              const simImage =
                sim.primary_image ||
                (Array.isArray(sim.images) && sim.images[0]) ||
                null;

              return (
                <article
                  key={sim.id}
                  onClick={() => onSelectPublication?.(sim)}
                  className="cursor-pointer overflow-hidden rounded-2xl border border-stone-200/90 bg-[#FAF9F6] transition hover:border-[#2d6a4f] hover:shadow-sm"
                >
                  <div className="h-36 w-full bg-stone-200">
                    {simImage ? (
                      <img
                        src={simImage}
                        alt={sim.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-stone-400">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="p-3.5">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span style={{ color: PRIMARY_GREEN }} className="font-bold">
                        {sim.modality || "Donación"}
                      </span>
                      <span className="text-stone-500">
                        {sim.zone_name || "Valera"}
                      </span>
                    </div>

                    <h3 className="mt-1 line-clamp-1 text-sm font-extrabold text-stone-900">
                      {sim.title}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-xs text-stone-600">
                      {sim.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox para ampliar la imagen seleccionada */}
      {lightboxOpen && activeImage && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 p-4"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Cerrar imagen completa"
            className="absolute right-5 top-5 rounded-xl bg-white/15 p-2.5 text-white hover:bg-white/25"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={activeImage}
            alt={title}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </section>
  );
}