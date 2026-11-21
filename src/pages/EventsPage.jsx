import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Gift,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { eventsService } from "../services/centersEventsBlogService";

const FALLBACK_EVENTS = [
  {
    id: "evt-01",
    organizer_id: "usr-002",
    organizer_nickname: "LiderSostenible",
    title: "Jornada de Recolección de Mobiliario y Escolar · Valera",
    description:
      "Punto de encuentro vecinal en Valera para recibir escritorios, sillas, lámparas y material en buen estado para familias y estudiantes de la zona.",
    event_datetime: "2026-11-28T09:00:00",
    place_name: "Plaza Bolívar de Valera - Zona Techada",
    zone_name: "Centro de Valera",
    lat: 9.3183,
    lng: -70.6037,
    expected_attendance: 35,
    participants: [
      {
        id: "ep-01",
        user_id: "usr-001",
        nickname: "NomadaVerde",
        participation_role: "donor",
      },
      {
        id: "ep-02",
        user_id: "usr-005",
        nickname: "HogarSegundoCiclo",
        participation_role: "assistant",
      },
    ],
  },
  {
    id: "evt-02",
    organizer_id: "usr-003",
    organizer_nickname: "TallerRaiz",
    title: "Sábado de Restauración y Segundo Ciclo · La Beatriz",
    description:
      "Taller y punto de acopio en Valera para muebles que requieran ajustes menores, lijado, bisagras o piezas reutilizables por la comunidad.",
    event_datetime: "2026-12-05T10:00:00",
    place_name: "Cancha Techada La Beatriz",
    zone_name: "La Beatriz · Valera",
    lat: 9.3126,
    lng: -70.6124,
    expected_attendance: 25,
    participants: [
      {
        id: "ep-03",
        user_id: "usr-001",
        nickname: "NomadaVerde",
        participation_role: "assistant",
      },
    ],
  },
];

const INITIAL_EVENT_FORM = {
  title: "",
  description: "",
  event_datetime: "2026-12-12T09:30",
  place_name: "",
  zone_name: "",
  expected_attendance: 25,
};

export default function EventsPage({ onOpenAuthModal }) {
  const { token, user, isAuthenticated, isVerified, isReLeader } = useAuth();

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(INITIAL_EVENT_FORM);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventsService.getAll(token);
      const list = Array.isArray(res) ? res : res?.events || [];
      setEvents(list);
      setSelectedEventId((prev) => prev || list[0]?.id || null);
    } catch {
      setEvents(FALLBACK_EVENTS);
      setSelectedEventId((prev) => prev || FALLBACK_EVENTS[0]?.id || null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const selectedEvent = useMemo(
    () => events.find((evt) => evt.id === selectedEventId) || events[0] || null,
    [events, selectedEventId]
  );

  const currentUserId = user?.id || "usr-local";
  const currentNickname = user?.nickname || "NomadaVerde";

  const currentUserParticipation = useMemo(() => {
    if (!selectedEvent) return null;
    return (
      (selectedEvent.participants || []).find(
        (p) => p.user_id === currentUserId
      ) || null
    );
  }, [selectedEvent, currentUserId]);

  const handleJoinEvent = async (roleInEvent) => {
    setFeedbackMsg("");
    setErrorMsg("");

    if (!isAuthenticated) {
      onOpenAuthModal?.();
      return;
    }

    if (!isVerified) {
      setErrorMsg(
        "Debes tener tu identidad verificada para unirte a un evento como asistente o donante."
      );
      return;
    }

    if (!selectedEvent) return;

    try {
      await eventsService.join(selectedEvent.id, roleInEvent, token);
    } catch {
      // Actualiza estado reactivo localmente si el backend aún no está disponible
    }

    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== selectedEvent.id) return evt;
        const existingList = evt.participants || [];
        const filtered = existingList.filter((p) => p.user_id !== currentUserId);
        const updatedParticipant = {
          id: `ep-${Date.now()}`,
          user_id: currentUserId,
          nickname: currentNickname,
          participation_role: roleInEvent,
        };
        return {
          ...evt,
          participants: [...filtered, updatedParticipant],
        };
      })
    );

    setFeedbackMsg(
      roleInEvent === "donor"
        ? `Te uniste a "${selectedEvent.title}" como donante.`
        : `Te uniste a "${selectedEvent.title}" como asistente.`
    );
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setFeedbackMsg("");
    setErrorMsg("");

    if (!isReLeader) {
      setErrorMsg(
        "Solo los usuarios con rol ReLeader pueden crear nuevos eventos de recolección."
      );
      return;
    }

    if (!form.title.trim() || !form.place_name.trim()) {
      setErrorMsg("Completa el título y el lugar del evento.");
      return;
    }

    const chosenZone = form.zone_name.trim() || "Valera, Trujillo";
    const baseLat = Number(user?.approx_lat) || 9.3177;
    const baseLng = Number(user?.approx_lng) || -70.6036;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      event_datetime: form.event_datetime,
      place_name: form.place_name.trim(),
      zone_name: chosenZone,
      lat: baseLat,
      lng: baseLng,
      expected_attendance: Number(form.expected_attendance) || 20,
    };

    let createdEvent = null;
    try {
      const res = await eventsService.create(payload, token);
      createdEvent = res?.event || res;
    } catch {
      // Respaldo reactivo local
    }

    const newEvent = createdEvent || {
      ...payload,
      id: `evt-local-${Date.now()}`,
      organizer_id: currentUserId,
      organizer_nickname: currentNickname,
      participants: [],
    };

    setEvents((prev) => [newEvent, ...prev]);
    setSelectedEventId(newEvent.id);
    setForm(INITIAL_EVENT_FORM);
    setShowCreateForm(false);
    setFeedbackMsg("Evento de recolección en Valera creado y publicado.");
  };

  const getCounts = (evt) => {
    const list = evt?.participants || [];
    const donorsCount = list.filter(
      (p) => p.participation_role === "donor"
    ).length;
    const assistantsCount = list.filter(
      (p) => p.participation_role === "assistant"
    ).length;
    const confirmedCount = list.length;
    const expected = Number(evt?.expected_attendance) || 20;
    const progressPct = Math.min(
      100,
      Math.round((confirmedCount / Math.max(1, expected)) * 100)
    );
    return { donorsCount, assistantsCount, confirmedCount, expected, progressPct };
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-[#2D6A4F]">
            <Sparkles className="h-3.5 w-3.5" />
            Jornadas ReUsa · Valera, Trujillo
          </span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900">
            Eventos de Recolección y Encuentros
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Consulta los detalles de cada jornada en Valera, revisa la asistencia esperada y súmate como asistente o donante.
          </p>
        </div>

        <div className="shrink-0">
          {isReLeader ? (
            <button
              type="button"
              onClick={() => {
                setErrorMsg("");
                setShowCreateForm((prev) => !prev);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2D6A4F] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#245640]"
            >
              <Plus className="h-4 w-4" />
              <span>{showCreateForm ? "Cerrar formulario" : "Crear evento"}</span>
            </button>
          ) : (
            <div
              title="Los ReLeaders (identidad verificada + 5 donaciones sin reportes) crean y gestionan eventos"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2 text-xs font-semibold text-stone-500"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Creación exclusiva de ReLeaders</span>
            </div>
          )}
        </div>
      </div>

      {isReLeader && showCreateForm && (
        <form
          onSubmit={handleCreateEvent}
          className="mb-6 space-y-4 rounded-2xl border border-emerald-200 bg-white p-6 shadow-xs"
        >
          <h2 className="text-base font-extrabold text-stone-900">
            Nuevo Evento de Recolección en Valera (ReLeader @{currentNickname})
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-stone-700">
                Título del evento *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Ej. Recolección comunitaria en Las Acacias"
                className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2 text-sm focus:border-[#2D6A4F] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-stone-700">
                Asistencia esperada (personas) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={form.expected_attendance}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    expected_attendance: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2 text-sm focus:border-[#2D6A4F] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-stone-700">
                Lugar o punto de encuentro en Valera *
              </label>
              <input
                type="text"
                required
                value={form.place_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, place_name: e.target.value }))
                }
                placeholder="Ej. Plaza Bolívar de Valera / Av. Bolívar"
                className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2 text-sm focus:border-[#2D6A4F] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-stone-700">
                Sector en Valera
              </label>
              <input
                type="text"
                value={form.zone_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, zone_name: e.target.value }))
                }
                placeholder="Ej. Centro de Valera · Trujillo"
                className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2 text-sm focus:border-[#2D6A4F] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-stone-700">
                Fecha y hora *
              </label>
              <input
                type="datetime-local"
                required
                value={form.event_datetime}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    event_datetime: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2 text-sm focus:border-[#2D6A4F] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-stone-700">
              Descripción y artículos prioritarios
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Detalla qué artículos se recibirán, horarios o recomendaciones..."
              className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2 text-sm focus:border-[#2D6A4F] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#2D6A4F] px-4 py-2 text-xs font-bold text-white hover:bg-[#245640]"
            >
              Publicar evento
            </button>
          </div>
        </form>
      )}

      {feedbackMsg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-[#2D6A4F]">
          {feedbackMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl border border-stone-200 bg-white" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-5">
            {events.map((evt) => {
              const isSelected = selectedEvent?.id === evt.id;
              const counts = getCounts(evt);
              const dateLabel = evt.event_datetime
                ? new Date(evt.event_datetime).toLocaleDateString("es-VE", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Próximamente";

              return (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => {
                    setFeedbackMsg("");
                    setErrorMsg("");
                    setSelectedEventId(evt.id);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? "border-[#2D6A4F] bg-white ring-2 ring-[#2D6A4F]/15 shadow-xs"
                      : "border-stone-200/90 bg-white/80 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#2D6A4F]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {dateLabel}
                    </span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-700">
                      {counts.confirmedCount} / {counts.expected} esperados
                    </span>
                  </div>

                  <h2 className="mt-1.5 text-base font-extrabold text-stone-900">
                    {evt.title}
                  </h2>

                  <p className="mt-1 flex items-center gap-1 text-xs text-stone-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                    <span>
                      {evt.place_name} · {evt.zone_name}
                    </span>
                  </p>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-7">
            {selectedEvent ? (
              <article className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs">
                {(() => {
                  const counts = getCounts(selectedEvent);
                  const dateFormatted = selectedEvent.event_datetime
                    ? new Date(selectedEvent.event_datetime).toLocaleString(
                        "es-VE",
                        {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : "Fecha por confirmar";

                  return (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#2D6A4F] ring-1 ring-emerald-200">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Organizado por ReLeader @{selectedEvent.organizer_nickname}
                        </span>
                        <span className="text-xs font-semibold text-stone-500">
                          {dateFormatted}
                        </span>
                      </div>

                      <h2 className="mt-3 text-xl font-extrabold text-stone-900">
                        {selectedEvent.title}
                      </h2>

                      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-stone-600">
                        <MapPin className="h-4 w-4 text-[#2D6A4F]" />
                        <span>
                          {selectedEvent.place_name} ({selectedEvent.zone_name})
                        </span>
                      </p>

                      <p className="mt-4 text-sm leading-relaxed text-stone-700">
                        {selectedEvent.description}
                      </p>

                      <div className="mt-5 rounded-2xl border border-stone-200 bg-[#FAF9F6] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-stone-800">
                            Se espera la asistencia de{" "}
                            <span className="text-[#2D6A4F]">
                              {counts.expected} personas
                            </span>
                          </span>
                          <span className="font-extrabold text-stone-900">
                            {counts.confirmedCount} confirmados ({counts.progressPct}%)
                          </span>
                        </div>

                        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-stone-200">
                          <div
                            className="h-full rounded-full bg-[#2D6A4F] transition-all duration-300"
                            style={{ width: `${counts.progressPct}%` }}
                          />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-stone-600">
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-[#2D6A4F]" />
                            <strong>{counts.assistantsCount}</strong> asistentes
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Gift className="h-4 w-4 text-amber-600" />
                            <strong>{counts.donorsCount}</strong> donantes
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => handleJoinEvent("assistant")}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                            currentUserParticipation?.participation_role ===
                            "assistant"
                              ? "border-2 border-[#2D6A4F] bg-emerald-50 text-[#2D6A4F]"
                              : "bg-[#2D6A4F] text-white shadow-xs hover:bg-[#245640]"
                          }`}
                        >
                          <Users className="h-4 w-4" />
                          <span>
                            {currentUserParticipation?.participation_role ===
                            "assistant"
                              ? "Unido como asistente ✓"
                              : "Unirme como asistente"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleJoinEvent("donor")}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                            currentUserParticipation?.participation_role ===
                            "donor"
                              ? "border-[#2D6A4F] bg-amber-100 text-stone-900"
                              : "border-stone-300 bg-[#FAF9F6] text-stone-800 hover:bg-stone-100"
                          }`}
                        >
                          <Gift className="h-4 w-4 text-amber-600" />
                          <span>
                            {currentUserParticipation?.participation_role ===
                            "donor"
                              ? "Unido como donante ✓"
                              : "Unirme como donante"}
                          </span>
                        </button>
                      </div>

                      <div className="mt-6 border-t border-stone-100 pt-4">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500">
                          Participantes confirmados ({counts.confirmedCount})
                        </h3>

                        {(selectedEvent.participants || []).length === 0 ? (
                          <p className="mt-2 text-xs text-stone-400">
                            Aún no hay participantes confirmados. ¡Sé el primero en sumarte!
                          </p>
                        ) : (
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {(selectedEvent.participants || []).map((p) => (
                              <span
                                key={p.id || p.user_id}
                                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-[#FAF9F6] px-3 py-1 text-xs font-semibold text-stone-700"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#2D6A4F]" />
                                <span>@{p.nickname}</span>
                                <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-stone-500 ring-1 ring-stone-200">
                                  {p.participation_role === "donor"
                                    ? "Donante"
                                    : "Asistente"}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </article>
            ) : (
              <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
                Selecciona un evento para ver sus detalles.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}