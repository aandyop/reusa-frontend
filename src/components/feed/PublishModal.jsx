import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  X,
  Award,
  ShieldAlert,
  MapPin,
  Check,
  ImagePlus,
  Star,
  Trash2,
  Clock,
  Crosshair,
  Plus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { publicationsService } from "../../services/publicationsService";
import {
  CATEGORIES,
  CONDITIONS,
  MODALITIES,
  SIZE_SCALES,
  QUICK_TAGS,
  REPOINTS_COLOR,
} from "../../utils/constants";

const PRIMARY_GREEN = "#2d6a4f";

const REWARD_BY_SIZE = {
  S: 20,
  M: 30,
  L: 40,
  XL: 50,
};

const AVAILABILITY_OPTIONS = [
  "Hora y fecha por acordar",
  "Horario flexible",
  "Mañanas (8:00 AM - 12:00 PM)",
  "Tardes (1:00 PM - 6:00 PM)",
  "Fines de semana",
  "Personalizado",
];

// 9°18'13.6"N 70°36'44.3"W
const FIXED_DEFAULT_LAT = 9.3037778;
const FIXED_DEFAULT_LNG = -70.6123056;

const INITIAL_FORM = {
  title: "",
  description: "",
  category: CATEGORIES[0],
  item_condition: CONDITIONS[1],
  modality: "Donación",
  trade_preference: "",
  size_scale: "M",
  availability: AVAILABILITY_OPTIONS[0],
  custom_availability: "",
  tags: [],
  zone_name: "",
  lat: FIXED_DEFAULT_LAT,
  lng: FIXED_DEFAULT_LNG,
};

export default function PublishModal({
  isOpen,
  onClose,
  onPublicationCreated,
  onOpenProfileVerification,
}) {
  const { token, user, isVerified, updateUserState } = useAuth();

  const initialLat = Number(user?.approx_lat) || FIXED_DEFAULT_LAT;
  const initialLng = Number(user?.approx_lng) || FIXED_DEFAULT_LNG;

  const [form, setForm] = useState({
    ...INITIAL_FORM,
    lat: initialLat,
    lng: initialLng,
  });

  // Lista de imágenes: [{ id, src, name }]
  const [attachedImages, setAttachedImages] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  const estimatedPoints = REWARD_BY_SIZE[form.size_scale] || 25;
  const nickname = user?.nickname || "vecino_reusa";
  const defaultZone = user?.approx_zone_name || "Campo Alegre · Valera";

  // Inicializar mapa interactivo dentro del modal cuando se abre
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const startLat = Number(form.lat) || initialLat;
      const startLng = Number(form.lng) || initialLng;

      const map = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      const areaCircle = L.circle([startLat, startLng], {
        radius: 280,
        color: PRIMARY_GREEN,
        weight: 2,
        fillColor: PRIMARY_GREEN,
        fillOpacity: 0.16,
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: "custom-reusa-pin",
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
        const nextLat = Number(pos.lat.toFixed(7));
        const nextLng = Number(pos.lng.toFixed(7));
        areaCircle.setLatLng([nextLat, nextLng]);
        setForm((prev) => ({
          ...prev,
          lat: nextLat,
          lng: nextLng,
        }));
      });

      map.on("click", (e) => {
        const nextLat = Number(e.latlng.lat.toFixed(7));
        const nextLng = Number(e.latlng.lng.toFixed(7));
        marker.setLatLng([nextLat, nextLng]);
        areaCircle.setLatLng([nextLat, nextLng]);
        setForm((prev) => ({
          ...prev,
          lat: nextLat,
          lng: nextLng,
        }));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = areaCircle;
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Adjuntar archivos de imagen locales
  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setErrorMsg("");

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setAttachedImages((prev) => [
            ...prev,
            {
              id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              src: reader.result,
              name: file.name,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  // Adjuntar imagen por URL
  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setAttachedImages((prev) => [
      ...prev,
      {
        id: `img-url-${Date.now()}`,
        src: trimmed,
        name: "Imagen externa",
      },
    ]);
    setImageUrlInput("");
  };

  const handleRemoveImage = (indexToRemove) => {
    setAttachedImages((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      if (next.length === 0) {
        setPrimaryImageIndex(0);
      } else if (primaryImageIndex === indexToRemove) {
        setPrimaryImageIndex(0);
      } else if (primaryImageIndex > indexToRemove) {
        setPrimaryImageIndex((curr) => curr - 1);
      }
      return next;
    });
  };

  const handleToggleTag = (tagLabel) => {
    setErrorMsg("");
    setForm((prev) => {
      const exists = prev.tags.includes(tagLabel);
      if (exists) {
        return {
          ...prev,
          tags: prev.tags.filter((item) => item !== tagLabel),
        };
      }
      if (prev.tags.length >= 3) {
        setErrorMsg("Puedes seleccionar hasta 3 etiquetas rápidas por publicación.");
        return prev;
      }
      return {
        ...prev,
        tags: [...prev.tags, tagLabel],
      };
    });
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
        setForm((prev) => ({
          ...prev,
          lat: nextLat,
          lng: nextLng,
        }));
        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          mapInstanceRef.current.setView([nextLat, nextLng], 15, {
            animate: true,
          });
          markerRef.current.setLatLng([nextLat, nextLng]);
          circleRef.current.setLatLng([nextLat, nextLng]);
        }
      },
      () => {
        setErrorMsg(
          "No se pudo obtener tu ubicación GPS. Puedes marcar el punto directamente en el mapa."
        );
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isVerified) {
      setErrorMsg(
        "Necesitas tener tu identidad verificada para publicar en ReUsa."
      );
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setErrorMsg("Completa el título y una descripción breve del artículo.");
      return;
    }

    if (form.modality === "Trueque" && !form.trade_preference.trim()) {
      setErrorMsg(
        "Indica qué objeto o servicio buscas a cambio en la modalidad Trueque."
      );
      return;
    }

    const finalAvailability =
      form.availability === "Personalizado"
        ? form.custom_availability.trim() || "Hora y fecha por acordar"
        : form.availability;

    // Colocar la imagen principal elegida como índice 0 (images[0])
    const orderedImages = (() => {
      if (attachedImages.length === 0) return [];
      const safePrimaryIdx =
        primaryImageIndex >= 0 && primaryImageIndex < attachedImages.length
          ? primaryImageIndex
          : 0;
      const primary = attachedImages[safePrimaryIdx];
      const others = attachedImages.filter((_, idx) => idx !== safePrimaryIdx);
      return [primary.src, ...others.map((img) => img.src)];
    })();

    const chosenZone = form.zone_name.trim() || defaultZone;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      item_condition: form.item_condition,
      modality: form.modality,
      trade_preference:
        form.modality === "Trueque" ? form.trade_preference.trim() : null,
      size_scale: form.size_scale,
      availability: finalAvailability,
      tags: form.tags,
      zone_name: chosenZone,
      lat: Number(form.lat) || initialLat,
      lng: Number(form.lng) || initialLng,
      radius_meters: form.size_scale === "XL" ? 420 : 320,
      re_points_reward: estimatedPoints,
      images: orderedImages,
      primary_image: orderedImages[0] || null,
    };

    setSubmitting(true);
    try {
      const created = await publicationsService.create(payload, token);
      const finalPub = created?.publication || created || {
        ...payload,
        id: `pub-local-${Date.now()}`,
        author_id: user?.id,
        author_nickname: nickname,
        author_role: user?.role || "user",
        author_is_verified: true,
        status: "DISPONIBLE",
        pending_requests_count: 0,
        created_at: new Date().toISOString(),
      };

      onPublicationCreated?.(finalPub);
      setForm({ ...INITIAL_FORM, lat: initialLat, lng: initialLng });
      setAttachedImages([]);
      setPrimaryImageIndex(0);
      onClose?.();
    } catch (err) {
      if (err?.status === 403) {
        setErrorMsg(
          err.message ||
            "Tu cuenta no está verificada o no tiene permisos para publicar."
        );
      } else {
        const localFallbackPub = {
          ...payload,
          id: `pub-preview-${Date.now()}`,
          author_id: user?.id || "usr-local",
          author_nickname: nickname,
          author_role: user?.role || "user",
          author_is_verified: true,
          status: "DISPONIBLE",
          pending_requests_count: 0,
          created_at: new Date().toISOString(),
        };

        if (updateUserState) {
          updateUserState((prev) =>
            prev
              ? {
                  ...prev,
                  re_points: (prev.re_points ?? prev.rePoints ?? 0) + 5,
                }
              : prev
          );
        }

        onPublicationCreated?.(localFallbackPub);
        setForm({ ...INITIAL_FORM, lat: initialLat, lng: initialLng });
        setAttachedImages([]);
        setPrimaryImageIndex(0);
        onClose?.();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-stone-200 bg-[#FAF9F6] shadow-2xl">
        {/* Cabecera del Modal */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4">
          <div>
            <h2
              id="publish-modal-title"
              className="text-lg font-extrabold text-stone-900"
            >
              Publicar artículo en ReUsa
            </h2>
            <p className="text-xs text-stone-500">
              Se publicará como{" "}
              <span
                style={{ color: PRIMARY_GREEN }}
                className="font-bold"
              >
                @{nickname}
              </span>{" "}
              en estado <span className="font-semibold">DISPONIBLE</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#2d6a4f] ring-1 ring-[#2d6a4f]/25">
              <Award
                className="h-3.5 w-3.5"
                style={{
                  color: REPOINTS_COLOR || PRIMARY_GREEN,
                  fill: REPOINTS_COLOR || PRIMARY_GREEN,
                }}
              />
              <span>+{estimatedPoints} RePoints al entregar</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              className="rounded-xl p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {!isVerified && (
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-bold text-amber-950">
                    Identidad pendiente de verificación
                  </p>
                  <p className="text-xs text-amber-900/80">
                    Para proteger a la comunidad, solo los usuarios verificados pueden publicar o solicitar artículos.
                  </p>
                </div>
              </div>
              {onOpenProfileVerification && (
                <button
                  type="button"
                  style={{ backgroundColor: PRIMARY_GREEN }}
                  onClick={() => {
                    onClose?.();
                    onOpenProfileVerification();
                  }}
                  className="shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                  Ir a verificar
                </button>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          {/* 1. Título del artículo */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-700">
              Título del artículo *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Ej. Escritorio de madera, licuadora o lote de ropa infantil"
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
            />
          </div>

          {/* 2. Adjuntar imagen o imágenes + Selección de Imagen Principal */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
                <ImagePlus
                  style={{ color: PRIMARY_GREEN }}
                  className="h-4 w-4"
                />
                <span>Imágenes del artículo (elige la imagen principal)</span>
              </label>

              <label
                style={{ backgroundColor: PRIMARY_GREEN }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Subir desde dispositivo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFilesSelected}
                  className="hidden"
                />
              </label>
            </div>

            {/* Opción adicional para pegar URL de imagen */}
            <div className="mt-3 flex gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddImageUrl();
                  }
                }}
                placeholder="O pega el enlace de una imagen (https://...)"
                className="flex-1 rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 py-2 text-xs text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
              />
              <button
                type="button"
                style={{ backgroundColor: PRIMARY_GREEN }}
                onClick={handleAddImageUrl}
                className="rounded-xl px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-90"
              >
                Agregar URL
              </button>
            </div>

            {/* Galería de imágenes adjuntas con selector de imagen principal */}
            {attachedImages.length > 0 ? (
              <div className="mt-3.5">
                <p className="mb-2 text-[11px] text-stone-500">
                  Haz clic en <strong>“Principal”</strong> sobre la foto que quieres mostrar como portada en la tarjeta y en la vista individual:
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {attachedImages.map((img, index) => {
                    const isPrimary = index === primaryImageIndex;
                    return (
                      <div
                        key={img.id}
                        style={
                          isPrimary
                            ? { borderColor: PRIMARY_GREEN }
                            : undefined
                        }
                        className={`group relative overflow-hidden rounded-xl border-2 bg-stone-100 ${
                          isPrimary
                            ? "ring-2 ring-[#2d6a4f]/30"
                            : "border-stone-200"
                        }`}
                      >
                        <img
                          src={img.src}
                          alt={img.name || `Imagen ${index + 1}`}
                          className="h-28 w-full object-cover"
                        />

                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-stone-950/75 px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => setPrimaryImageIndex(index)}
                            style={
                              isPrimary
                                ? { backgroundColor: PRIMARY_GREEN }
                                : undefined
                            }
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition ${
                              isPrimary
                                ? "text-white"
                                : "bg-white/20 text-white hover:bg-white/30"
                            }`}
                          >
                            <Star
                              className={`h-2.5 w-2.5 ${
                                isPrimary ? "fill-white" : ""
                              }`}
                            />
                            <span>
                              {isPrimary ? "Principal" : "Hacer principal"}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            title="Eliminar imagen"
                            className="rounded-md bg-white/15 p-1 text-white transition hover:bg-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="mt-2.5 text-[11px] text-stone-500">
                Puedes adjuntar una o varias fotos. La que marques como principal será la portada del artículo.
              </p>
            )}
          </div>

          {/* 3. Descripción y detalles útiles */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-700">
              Descripción y detalles útiles *
            </label>
            <textarea
              rows={3}
              required
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Cuenta cómo está el objeto, si funciona, dimensiones o qué detalle necesita..."
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
            />
          </div>

          {/* 4. Categoría y Estado del producto */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-700">
                Categoría *
              </label>
              <select
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 focus:border-[#2d6a4f] focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-700">
                Estado del producto *
              </label>
              <select
                value={form.item_condition}
                onChange={(e) => handleChange("item_condition", e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 focus:border-[#2d6a4f] focus:outline-none"
              >
                {CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Modalidad y Medidas */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-700">
                Modalidad *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MODALITIES.map((mod) => {
                  const active = form.modality === mod;
                  return (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => handleChange("modality", mod)}
                      style={
                        active ? { backgroundColor: PRIMARY_GREEN } : undefined
                      }
                      className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                        active
                          ? "border-[#2d6a4f] text-white"
                          : "border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      {mod}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-700">
                Medidas (Tamaño y peso estimado) *
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {SIZE_SCALES.map((scale) => {
                  const active = form.size_scale === scale.code;
                  return (
                    <button
                      key={scale.code}
                      type="button"
                      title={scale.label}
                      onClick={() => handleChange("size_scale", scale.code)}
                      className={`rounded-xl border py-2 text-xs font-extrabold transition ${
                        active
                          ? "border-[#2d6a4f] bg-emerald-50 text-[#2d6a4f] ring-1 ring-[#2d6a4f]"
                          : "border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      {scale.code}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                {SIZE_SCALES.find((s) => s.code === form.size_scale)?.label}
              </p>
            </div>
          </div>

          {form.modality === "Trueque" && (
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-700">
                ¿Por qué te gustaría intercambiarlo? *
              </label>
              <input
                type="text"
                value={form.trade_preference}
                onChange={(e) => handleChange("trade_preference", e.target.value)}
                placeholder="Ej. Plantas, herramientas de mano, silla o libros..."
                className="w-full rounded-xl border border-[#2d6a4f]/40 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
              />
            </div>
          )}

          {/* 6. Disponibilidad */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
              <Clock style={{ color: PRIMARY_GREEN }} className="h-3.5 w-3.5" />
              <span>Disponibilidad para entrega o retiro *</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_OPTIONS.map((option) => {
                const selected = form.availability === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleChange("availability", option)}
                    style={
                      selected ? { backgroundColor: PRIMARY_GREEN } : undefined
                    }
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? "border-[#2d6a4f] text-white"
                        : "border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {form.availability === "Personalizado" && (
              <input
                type="text"
                value={form.custom_availability}
                onChange={(e) =>
                  handleChange("custom_availability", e.target.value)
                }
                placeholder="Ej. Lunes a viernes después de las 5:00 PM"
                className="mt-2.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
              />
            )}
          </div>

          {/* 7. Etiquetas rápidas */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-700">
              Etiquetas rápidas (hasta 3)
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => {
                const selected = form.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    style={
                      selected ? { backgroundColor: PRIMARY_GREEN } : undefined
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? "border-[#2d6a4f] text-white"
                        : "border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 8. Ubicación textual y en el mapa */}
          <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
                <MapPin
                  style={{ color: PRIMARY_GREEN }}
                  className="h-4 w-4"
                />
                <span>Ubicación textual y en el mapa *</span>
              </label>

              <button
                type="button"
                onClick={handleUseCurrentGPS}
                className="inline-flex items-center gap-1 rounded-lg border border-[#2d6a4f]/30 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-[#2d6a4f] transition hover:bg-emerald-100"
              >
                <Crosshair className="h-3.5 w-3.5" />
                <span>Usar mi ubicación actual</span>
              </button>
            </div>

            <input
              type="text"
              value={form.zone_name}
              onChange={(e) => handleChange("zone_name", e.target.value)}
              placeholder={`Ej. ${defaultZone}`}
              className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
            />

            <div className="overflow-hidden rounded-xl border border-stone-200">
              <div
                ref={mapContainerRef}
                className="z-0 h-52 w-full bg-stone-100"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
              <span>
                Haz clic en el mapa o arrastra el marcador verde para ajustar la zona.
              </span>
              <span className="font-mono font-semibold text-stone-700">
                {Number(form.lat).toFixed(5)}, {Number(form.lng).toFixed(5)}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2.5 border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !isVerified}
              style={{ backgroundColor: PRIMARY_GREEN }}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Publicando..." : "Publicar en ReUsa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}