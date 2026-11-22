import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ImagePlus,
  Crosshair,
  X,
  FileText,
  AlignLeft,
} from "lucide-react";

const PRIMARY_GREEN = "#2d6a4f";
const FIXED_DEFAULT_LAT = 9.3188;
const FIXED_DEFAULT_LNG = -70.6042;

const INITIAL_EVENT_FORM = {
  title: "",
  expected_attendance: 20,
  zone_name: "",
  lat: FIXED_DEFAULT_LAT,
  lng: FIXED_DEFAULT_LNG,
  event_date: "",
  event_time: "10:00",
  description: "",
  content: "",
  cover_image: "",
};

export default function CreateEventForm({
  currentUser = null,
  onCancel,
  onEventCreated,
}) {
  const [form, setForm] = useState(INITIAL_EVENT_FORM);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const startLat = Number(form.lat) || FIXED_DEFAULT_LAT;
      const startLng = Number(form.lng) || FIXED_DEFAULT_LNG;

      const map = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: "custom-reusa-event-pin",
        html: `<div style="width:22px;height:22px;border-radius:9999px;background:${PRIMARY_GREEN};border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([startLat, startLng], {
        draggable: true,
        icon: pinIcon,
      }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setForm((prev) => ({
          ...prev,
          lat: Number(pos.lat.toFixed(7)),
          lng: Number(pos.lng.toFixed(7)),
        }));
      });

      map.on("click", (e) => {
        const nextLat = Number(e.latlng.lat.toFixed(7));
        const nextLng = Number(e.latlng.lng.toFixed(7));
        marker.setLatLng([nextLat, nextLng]);
        setForm((prev) => ({
          ...prev,
          lat: nextLat,
          lng: nextLng,
        }));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((prev) => ({ ...prev, cover_image: reader.result }));
        setErrorMsg("");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleApplyUrlImage = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setForm((prev) => ({ ...prev, cover_image: trimmed }));
    setImageUrlInput("");
  };

  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Tu navegador no soporta geolocalización automática.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLat = Number(pos.coords.latitude.toFixed(7));
        const nextLng = Number(pos.coords.longitude.toFixed(7));
        setForm((prev) => ({ ...prev, lat: nextLat, lng: nextLng }));
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([nextLat, nextLng], 15, {
            animate: true,
          });
          markerRef.current.setLatLng([nextLat, nextLng]);
        }
      },
      () => {
        setErrorMsg(
          "No se pudo obtener la ubicación actual. Puedes marcarla en el mapa."
        );
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (
      !form.title.trim() ||
      !form.zone_name.trim() ||
      !form.description.trim() ||
      !form.content.trim()
    ) {
      setErrorMsg(
        "Completa el título, punto de encuentro, descripción y contenido del evento."
      );
      return;
    }

    const combinedDate = (() => {
      if (!form.event_date) return new Date().toISOString();
      const isoCandidate = new Date(
        `${form.event_date}T${form.event_time || "10:00"}:00`
      );
      return Number.isNaN(isoCandidate.getTime())
        ? new Date().toISOString()
        : isoCandidate.toISOString();
    })();

    setSubmitting(true);

    const newEvent = {
      id: `evt-${Date.now()}`,
      title: form.title.trim(),
      expected_attendance: Math.max(1, Number(form.expected_attendance) || 1),
      participants_count: 1,
      zone_name: form.zone_name.trim(),
      lat: Number(form.lat) || FIXED_DEFAULT_LAT,
      lng: Number(form.lng) || FIXED_DEFAULT_LNG,
      event_date: combinedDate,
      event_time: form.event_time || "10:00",
      description: form.description.trim(),
      content: form.content.trim(),
      cover_image: form.cover_image || null,
      organizer_nickname: currentUser?.nickname || "LiderSostenible",
      created_at: new Date().toISOString(),
    };

    onEventCreated?.(newEvent);
    setForm(INITIAL_EVENT_FORM);
    setSubmitting(false);
  };

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div>
          <h2 className="text-lg font-extrabold text-stone-900">
            Crear nuevo evento comunitario
          </h2>
          <p className="text-xs text-stone-500">
            Define el punto de encuentro, fecha, asistencia esperada y detalles del evento.
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar formulario de evento"
            className="rounded-xl p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {errorMsg}
          </div>
        )}

        {/* 1. Título del evento */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-700">
            Título del evento *
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Ej. Jornada de Clasificación y Empaque Solidario"
            className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
          />
        </div>

        {/* 2. Asistencia esperada + Fecha y hora */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
              <Users style={{ color: PRIMARY_GREEN }} className="h-3.5 w-3.5" />
              <span>Asistencia esperada *</span>
            </label>
            <input
              type="number"
              min={1}
              required
              value={form.expected_attendance}
              onChange={(e) =>
                handleChange("expected_attendance", e.target.value)
              }
              className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
              <Calendar
                style={{ color: PRIMARY_GREEN }}
                className="h-3.5 w-3.5"
              />
              <span>Fecha *</span>
            </label>
            <input
              type="date"
              required
              value={form.event_date}
              onChange={(e) => handleChange("event_date", e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
              <Clock style={{ color: PRIMARY_GREEN }} className="h-3.5 w-3.5" />
              <span>Hora *</span>
            </label>
            <input
              type="time"
              required
              value={form.event_time}
              onChange={(e) => handleChange("event_time", e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
            />
          </div>
        </div>

        {/* 3. Adjuntar imagen principal del evento */}
        <div className="rounded-2xl border border-stone-200 bg-[#FAF9F6] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
              <ImagePlus
                style={{ color: PRIMARY_GREEN }}
                className="h-4 w-4"
              />
              <span>Imagen principal del evento</span>
            </label>

            <label
              style={{ backgroundColor: PRIMARY_GREEN }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
            >
              <span>Adjuntar imagen principal</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="hidden"
              />
            </label>
          </div>

          <div className="mt-3 flex gap-2">
            <input
              type="url"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="O pega una URL de imagen (https://...)"
              className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
            />
            <button
              type="button"
              style={{ backgroundColor: PRIMARY_GREEN }}
              onClick={handleApplyUrlImage}
              className="rounded-xl px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-90"
            >
              Usar URL
            </button>
          </div>

          {form.cover_image && (
            <div className="relative mt-3 overflow-hidden rounded-xl border border-stone-200 bg-white">
              <img
                src={form.cover_image}
                alt="Vista previa de imagen principal del evento"
                className="h-48 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleChange("cover_image", "")}
                className="absolute right-2.5 top-2.5 rounded-lg bg-stone-950/75 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-stone-950"
              >
                Quitar imagen
              </button>
            </div>
          )}
        </div>

        {/* 4. Descripción del evento + Contenido del evento */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
            <AlignLeft
              style={{ color: PRIMARY_GREEN }}
              className="h-3.5 w-3.5"
            />
            <span>Descripción del evento *</span>
          </label>
          <textarea
            rows={2}
            required
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Resumen corto sobre el propósito y actividad principal del evento..."
            className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
            <FileText
              style={{ color: PRIMARY_GREEN }}
              className="h-3.5 w-3.5"
            />
            <span>Contenido del evento *</span>
          </label>
          <textarea
            rows={5}
            required
            value={form.content}
            onChange={(e) => handleChange("content", e.target.value)}
            placeholder="Detalla la agenda, qué llevar, cómo se organizará la jornada o cualquier información importante para los asistentes..."
            className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
          />
        </div>

        {/* 5. Lugar o punto de encuentro (textual + mapa) */}
        <div className="space-y-3 rounded-2xl border border-stone-200 bg-[#FAF9F6] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
              <MapPin style={{ color: PRIMARY_GREEN }} className="h-4 w-4" />
              <span>Lugar o punto de encuentro (textual y mapa) *</span>
            </label>

            <button
              type="button"
              onClick={handleUseCurrentGPS}
              className="inline-flex items-center gap-1 rounded-lg border border-[#2d6a4f]/30 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-[#2d6a4f] transition hover:bg-emerald-100"
            >
              <Crosshair className="h-3.5 w-3.5" />
              <span>Usar ubicación actual</span>
            </button>
          </div>

          <input
            type="text"
            required
            value={form.zone_name}
            onChange={(e) => handleChange("zone_name", e.target.value)}
            placeholder="Ej. Plaza Bolívar / Centro de Acopio · Centro de Valera"
            className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
          />

          <div className="overflow-hidden rounded-xl border border-stone-200">
            <div
              ref={mapContainerRef}
              className="z-0 h-52 w-full bg-stone-100"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
            <span>
              Haz clic en el mapa o arrastra el marcador para fijar el punto de encuentro.
            </span>
            <span className="font-mono font-semibold text-stone-700">
              {Number(form.lat).toFixed(5)}, {Number(form.lng).toFixed(5)}
            </span>
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end gap-2.5 border-t border-stone-100 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 transition hover:bg-stone-100"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: PRIMARY_GREEN }}
            className="rounded-xl px-5 py-2.5 text-xs font-extrabold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Guardando evento..." : "Publicar evento"}
          </button>
        </div>
      </form>
    </div>
  );
}