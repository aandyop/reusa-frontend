import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Check,
  UserPlus,
} from "lucide-react";

const PRIMARY_GREEN = "#2d6a4f";

export default function EventDetailView({
  eventItem,
  allEvents = [],
  onSelectEvent,
  onJoinEvent,
  onBack,
}) {
  const [joined, setJoined] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    setJoined(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [eventItem?.id]);

  useEffect(() => {
    if (!eventItem) return;

    const lat = Number(eventItem.lat) || 9.3188;
    const lng = Number(eventItem.lng) || -70.6042;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: "custom-reusa-event-detail-pin",
        html: `<div style="width:22px;height:22px;border-radius:9999px;background:${PRIMARY_GREEN};border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      L.marker([lat, lng], { icon: pinIcon }).addTo(map);
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
  }, [eventItem]);

  const relatedEvents = useMemo(() => {
    if (!eventItem) return [];
    return allEvents.filter((item) => item.id !== eventItem.id).slice(0, 4);
  }, [allEvents, eventItem]);

  if (!eventItem) return null;

  const {
    id,
    title,
    description,
    content,
    cover_image,
    zone_name = "Centro de Valera",
    event_date,
    event_time,
    expected_attendance = 20,
    participants_count = 1,
    organizer_nickname = "comunidad_reusa",
  } = eventItem;

  const currentParticipants = participants_count + (joined ? 1 : 0);

  const formattedDate = event_date
    ? new Date(event_date).toLocaleDateString("es-VE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Fecha por confirmar";

  const formattedTime =
    event_time ||
    (event_date
      ? new Date(event_date).toLocaleTimeString("es-VE", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Hora por acordar");

  const handleJoin = () => {
    if (joined) return;
    setJoined(true);
    onJoinEvent?.(eventItem);
  };

  return (
    <section aria-label={`Evento: ${title}`} className="space-y-6">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white px-5 py-3.5 shadow-2xs">
        <button
          type="button"
          style={{ backgroundColor: PRIMARY_GREEN }}
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a eventos</span>
        </button>

        <span
          style={{ color: PRIMARY_GREEN }}
          className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold ring-1 ring-[#2d6a4f]/25"
        >
          Evento comunitario
        </span>
      </div>

      {/* Imagen principal en grande + Detalles */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xs">
            {cover_image ? (
              <img
                src={cover_image}
                alt={title}
                className="h-72 w-full object-cover sm:h-96"
              />
            ) : (
              <div className="flex h-64 w-full flex-col items-center justify-center bg-emerald-50/60 text-[#2d6a4f]">
                <Calendar className="h-10 w-10 opacity-75" />
                <span className="mt-2 text-xs font-bold">
                  Evento comunitario ReUsa
                </span>
              </div>
            )}

            <div className="p-5 sm:p-6">
              <h1 className="text-xl font-extrabold text-stone-900 sm:text-2xl">
                {title}
              </h1>

              <p className="mt-1.5 text-xs font-semibold text-stone-500">
                Organizado por @{organizer_nickname}
              </p>

              <p className="mt-4 text-sm leading-relaxed text-stone-700">
                {description}
              </p>

              <div className="mt-5 border-t border-stone-100 pt-4">
                <h2 className="text-xs font-extrabold uppercase tracking-wide text-stone-700">
                  Detalles y desarrollo del evento
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-700">
                  {content || description}
                </p>
              </div>
            </div>
          </div>

          {/* Ubicación textual y en el mapa */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs">
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-stone-900">
              <MapPin style={{ color: PRIMARY_GREEN }} className="h-4 w-4" />
              <span>Punto de encuentro: {zone_name}</span>
            </h2>

            <div className="mt-3.5 overflow-hidden rounded-xl border border-stone-200">
              <div
                ref={mapContainerRef}
                className="z-0 h-56 w-full bg-stone-100"
              />
            </div>
          </div>
        </div>

        {/* Columna lateral: Fecha, hora, asistencia y confirmación */}
        <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
          <div className="space-y-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs">
            <div className="space-y-3 text-xs text-stone-700">
              <div className="flex items-center gap-2.5 rounded-xl bg-[#FAF9F6] p-3">
                <Calendar
                  style={{ color: PRIMARY_GREEN }}
                  className="h-4 w-4 shrink-0"
                />
                <div>
                  <p className="text-[10px] font-bold uppercase text-stone-400">
                    Fecha
                  </p>
                  <p className="font-bold capitalize text-stone-900">
                    {formattedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl bg-[#FAF9F6] p-3">
                <Clock
                  style={{ color: PRIMARY_GREEN }}
                  className="h-4 w-4 shrink-0"
                />
                <div>
                  <p className="text-[10px] font-bold uppercase text-stone-400">
                    Hora
                  </p>
                  <p className="font-bold text-stone-900">{formattedTime}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl bg-[#FAF9F6] p-3">
                <Users
                  style={{ color: PRIMARY_GREEN }}
                  className="h-4 w-4 shrink-0"
                />
                <div>
                  <p className="text-[10px] font-bold uppercase text-stone-400">
                    Asistencia
                  </p>
                  <p className="font-bold text-stone-900">
                    {currentParticipants} confirmados · {expected_attendance}{" "}
                    esperados
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleJoin}
              style={{ backgroundColor: PRIMARY_GREEN }}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-extrabold text-white transition hover:opacity-90"
            >
              {joined ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Asistencia confirmada</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Confirmar asistencia</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

      {/* Otros eventos */}
      {relatedEvents.length > 0 && (
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6">
          <h2 className="mb-4 text-base font-extrabold text-stone-900">
            Otros eventos comunitarios
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {relatedEvents.map((rel) => (
              <article
                key={rel.id || id}
                onClick={() => onSelectEvent?.(rel)}
                className="cursor-pointer rounded-2xl border border-stone-200/90 bg-[#FAF9F6] p-4 transition hover:border-[#2d6a4f]"
              >
                <h3 className="text-sm font-extrabold text-stone-900">
                  {rel.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-stone-600">
                  {rel.description}
                </p>
                <p className="mt-2.5 text-[11px] font-semibold text-[#2d6a4f]">
                  {rel.zone_name || "Valera"} · {rel.expected_attendance || 20}{" "}
                  esperados
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}