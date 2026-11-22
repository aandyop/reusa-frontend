import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  Plus,
  MapPin,
  Users,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { eventsService } from "../services/centersEventsBlogService";
import CreateEventForm from "../components/events/CreateEventForm";
import EventDetailView from "../components/events/EventDetailView";

const PRIMARY_GREEN = "#2d6a4f";
const EVENTS_STORAGE_KEY = "reusa_events_cache";

const DEFAULT_EVENTS = [
  {
    id: "evt-201",
    title: "Jornada de Clasificación y Empaque Solidario",
    description:
      "Organización de ropa, calzado, abrigo y artículos para el hogar destinados a familias afectadas y puntos de apoyo.",
    content:
      "Nos reuniremos en el punto de encuentro para revisar prendas limpias, emparejar calzado, etiquetar cajas por tamaño y preparar los lotes para su traslado. Si puedes, lleva cinta de embalaje, marcadores o bolsas resistentes.",
    cover_image: null,
    organizer_nickname: "LiderSostenible",
    zone_name: "Centro de Valera",
    lat: 9.3188,
    lng: -70.6042,
    event_date: "2026-11-26T10:00:00Z",
    event_time: "10:00",
    expected_attendance: 25,
    participants_count: 14,
  },
  {
    id: "evt-202",
    title: "Taller de Reparación y Segundo Ciclo de Muebles",
    description:
      "Encuentro vecinal para lijar, encolar y recuperar sillas, mesas y piezas de madera antes de entregarlas.",
    content:
      "Compartiremos técnicas básicas de restauración de madera, ajuste de bisagras y acabado protector para dar una segunda vida útil a muebles comunitarios. Habrá herramientas básicas disponibles y espacio para trabajar en equipo.",
    cover_image: null,
    organizer_nickname: "TallerRaiz",
    zone_name: "La Beatriz · Valera",
    lat: 9.3119,
    lng: -70.6132,
    event_date: "2026-11-29T14:00:00Z",
    event_time: "14:00",
    expected_attendance: 18,
    participants_count: 9,
  },
];

function readEventsCache() {
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!raw) return DEFAULT_EVENTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    if (Array.isArray(parsed?.data) && parsed.data.length > 0)
      return parsed.data;
    if (Array.isArray(parsed?.events) && parsed.events.length > 0)
      return parsed.events;
    return DEFAULT_EVENTS;
  } catch {
    return DEFAULT_EVENTS;
  }
}

function writeEventsCache(list) {
  try {
    if (Array.isArray(list)) {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(list));
    }
  } catch {
    // Ignorar errores de almacenamiento
  }
}

function extractEventsList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.events)) return res.events;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

export default function EventsPage({
  externalEvents = null,
  onEventCreated,
  onJoinEvent,
}) {
  const { token, user } = useAuth();

  const [events, setEvents] = useState(() =>
    Array.isArray(externalEvents) && externalEvents.length > 0
      ? externalEvents
      : readEventsCache()
  );
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const localList = readEventsCache();

    try {
      const res = await eventsService?.getAll?.(token);
      const apiList = extractEventsList(res);
      const merged = apiList.length > 0 ? apiList : localList;
      setEvents(merged);
      writeEventsCache(merged);
    } catch {
      setEvents(localList);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (Array.isArray(externalEvents) && externalEvents.length > 0) {
      setEvents(externalEvents);
      writeEventsCache(externalEvents);
    }
  }, [externalEvents]);

  const selectedEvent =
    events.find((item) => item.id === selectedEventId) || null;

  const handleEventCreated = (newEvent) => {
    setEvents((prev) => {
      const next = [newEvent, ...prev];
      writeEventsCache(next);
      return next;
    });
    setShowCreateForm(false);
    setSelectedEventId(newEvent.id);
    onEventCreated?.(newEvent);
  };

  const handleJoinEvent = (joinedEvt) => {
    if (!joinedEvt?.id) return;
    setEvents((prev) => {
      const next = prev.map((item) =>
        item.id === joinedEvt.id
          ? { ...item, participants_count: (item.participants_count || 1) + 1 }
          : item
      );
      writeEventsCache(next);
      return next;
    });
    onJoinEvent?.(joinedEvt);
  };

  if (selectedEvent) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <EventDetailView
          eventItem={selectedEvent}
          allEvents={events}
          onSelectEvent={(evt) => setSelectedEventId(evt.id)}
          onJoinEvent={handleJoinEvent}
          onBack={() => setSelectedEventId(null)}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <section aria-label="Página de Eventos comunitarios" className="space-y-6">
        {/* Encabezado de la página de Eventos */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white px-5 py-4 shadow-2xs">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-extrabold text-stone-900">
              <Calendar style={{ color: PRIMARY_GREEN }} className="h-5 w-5" />
              <span>Eventos comunitarios</span>
            </h1>
            <p className="mt-0.5 text-xs text-stone-500">
              Jornadas solidarias, talleres de reparación y encuentros en la comunidad.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadEvents}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 py-2 text-xs font-bold text-stone-700 transition hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Actualizar</span>
            </button>

            <button
              type="button"
              style={{ backgroundColor: PRIMARY_GREEN }}
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold text-white transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              <span>{showCreateForm ? "Ocultar formulario" : "Crear evento"}</span>
            </button>
          </div>
        </div>

        {/* Formulario de Crear Evento */}
        {showCreateForm && (
          <CreateEventForm
            currentUser={user}
            onCancel={() => setShowCreateForm(false)}
            onEventCreated={handleEventCreated}
          />
        )}

        {/* Listado de tarjetas de Eventos con imagen principal */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((sk) => (
              <div
                key={sk}
                className="h-72 animate-pulse rounded-2xl border border-stone-200 bg-white p-4"
              >
                <div className="h-40 w-full rounded-xl bg-stone-200" />
                <div className="mt-3 h-4 w-2/3 rounded-md bg-stone-200" />
                <div className="mt-2 h-10 w-full rounded-md bg-stone-100" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
            <Calendar className="mx-auto h-10 w-10 text-stone-400" />
            <h2 className="mt-3 text-base font-bold text-stone-900">
              Aún no hay eventos registrados
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Crea el primer evento comunitario usando el botón superior.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.map((evt) => {
              const coverImg = evt.cover_image || evt.image_url || null;

              return (
                <article
                  key={evt.id}
                  onClick={() => setSelectedEventId(evt.id)}
                  className="cursor-pointer overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xs transition hover:border-[#2d6a4f] hover:shadow-sm"
                >
                  <div className="h-44 w-full bg-stone-100">
                    {coverImg ? (
                      <img
                        src={coverImg}
                        alt={evt.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-emerald-50/60 text-[#2d6a4f]">
                        <Calendar className="h-8 w-8 opacity-75" />
                        <span className="mt-1.5 text-[11px] font-bold">
                          Evento ReUsa
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500">
                      <span className="inline-flex items-center gap-1 font-bold text-[#2d6a4f]">
                        <Clock className="h-3 w-3" />
                        {evt.event_date
                          ? new Date(evt.event_date).toLocaleDateString("es-VE", {
                              day: "numeric",
                              month: "short",
                            })
                          : "Próximamente"}
                      </span>

                      <span className="inline-flex items-center gap-1 font-semibold">
                        <Users className="h-3 w-3" />
                        {evt.expected_attendance || evt.participants_count || 10}{" "}
                        esperados
                      </span>
                    </div>

                    <h2 className="mt-2 line-clamp-1 text-base font-extrabold text-stone-900">
                      {evt.title}
                    </h2>

                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">
                      {evt.description}
                    </p>

                    <div className="mt-3.5 flex items-center justify-between border-t border-stone-100 pt-3 text-[11px]">
                      <span className="inline-flex items-center gap-1 text-stone-600">
                        <MapPin
                          style={{ color: PRIMARY_GREEN }}
                          className="h-3.5 w-3.5"
                        />
                        {evt.zone_name || "Valera"}
                      </span>
                      <span className="font-bold text-[#2d6a4f]">
                        Ver evento →
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}