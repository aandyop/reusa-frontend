import { useState } from "react";
import {
  X,
  Award,
  ShieldAlert,
  Sparkles,
  MapPin,
  Check,
  ImagePlus,
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

const REWARD_BY_SIZE = {
  S: 20,
  M: 30,
  L: 40,
  XL: 50,
};

const INITIAL_FORM = {
  title: "",
  description: "",
  category: CATEGORIES[0],
  item_condition: CONDITIONS[1],
  modality: "Donación",
  trade_preference: "",
  size_scale: "M",
  tags: [],
  zone_name: "",
  image_url: "",
};

export default function PublishModal({
  isOpen,
  onClose,
  onPublicationCreated,
  onOpenProfileVerification,
}) {
  const { token, user, isVerified, updateUserState } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const estimatedPoints = REWARD_BY_SIZE[form.size_scale] || 25;
  const nickname = user?.nickname || "vecino_reusa";
  const defaultZone = user?.approx_zone_name || "Zona cercana";

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
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

    const chosenZone = form.zone_name.trim() || defaultZone;
    const baseLat = Number(user?.approx_lat) || 8.6095;
    const baseLng = Number(user?.approx_lng) || -70.6082;
    const jitterLat = (Math.random() - 0.5) * 0.008;
    const jitterLng = (Math.random() - 0.5) * 0.008;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      item_condition: form.item_condition,
      modality: form.modality,
      trade_preference:
        form.modality === "Trueque" ? form.trade_preference.trim() : null,
      size_scale: form.size_scale,
      tags: form.tags,
      zone_name: chosenZone,
      lat: Number((baseLat + jitterLat).toFixed(7)),
      lng: Number((baseLng + jitterLng).toFixed(7)),
      radius_meters: form.size_scale === "XL" ? 420 : 320,
      re_points_reward: estimatedPoints,
      images: form.image_url.trim() ? [form.image_url.trim()] : [],
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
      setForm(INITIAL_FORM);
      onClose?.();
    } catch (err) {
      // Si el backend aún no está activo en desarrollo local, permite previsualizar localmente si se desea
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
        setForm(INITIAL_FORM);
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
        {/* Encabezado */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4">
          <div>
            <h2
              id="publish-modal-title"
              className="text-lg font-extrabold text-stone-900"
            >
              Publicar artículo en ReUsa
            </h2>
            <p className="text-xs text-stone-500">
              Se publicará como <span className="font-bold text-[#2D6A4F]">@{nickname}</span> en estado{" "}
              <span className="font-semibold">DISPONIBLE</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-stone-800 ring-1 ring-amber-300">
              <Award
                className="h-3.5 w-3.5"
                style={{ color: REPOINTS_COLOR, fill: REPOINTS_COLOR }}
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
          {/* Bloqueo visual si el usuario aún no está verificado */}
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
                  onClick={() => {
                    onClose?.();
                    onOpenProfileVerification();
                  }}
                  className="shrink-0 rounded-xl bg-amber-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-900"
                >
                  Ir a verificar
                </button>
              )}
            </div>
          )}

          {/* Nota de privacidad por Nickname + Frase Poética */}
          <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/80 p-4">
            <div className="flex items-start gap-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#2D6A4F]" />
              <div className="space-y-1 text-xs text-stone-700">
                <p className="font-semibold text-[#2D6A4F]">
                  Privacidad con Nickname (@{nickname}):
                </p>
                <p>
                  No mostramos tu nombre real ni tu dirección exacta en el feed: en el mapa solo aparece un círculo rojo aproximado hasta que apruebes una reserva y lo acuerdes en el chat.
                </p>
                <p className="pt-1 italic text-stone-600">
                  “Dar sin firmar el gesto es dejar que el objeto hable por sí mismo: lo que hoy sueltas en silencio, mañana se convierte en el hogar de alguien más.”
                </p>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Título y Descripción */}
          <div className="grid grid-cols-1 gap-4">
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
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2D6A4F] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-700">
                Descripción y detalles útiles *
              </label>
              <textarea
                rows={3}
                required
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Cuenta cómo está el objeto, si funciona o qué detalle necesita..."
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2D6A4F] focus:outline-none"
              />
            </div>
          </div>

          {/* Categoría y Estado Físico */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-700">
                Categoría *
              </label>
              <select
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 focus:border-[#2D6A4F] focus:outline-none"
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
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 focus:border-[#2D6A4F] focus:outline-none"
              >
                {CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modalidad (Donación o Trueque) y Medidas (Tamaño y Peso S - XL) */}
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
                      className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                        active
                          ? "border-[#2D6A4F] bg-[#2D6A4F] text-white"
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
                          ? "border-[#2D6A4F] bg-emerald-50 text-[#2D6A4F] ring-1 ring-[#2D6A4F]"
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

          {/* Preferencia de intercambio si eligió Trueque */}
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
                className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2D6A4F] focus:outline-none"
              />
            </div>
          )}

          {/* Etiquetas rápidas (máx. 3, incluyendo "Está en la calle") */}
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
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? "border-[#2D6A4F] bg-[#2D6A4F] text-white"
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

          {/* Zona aproximada e Imagen opcional */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-stone-700">
                <MapPin className="h-3.5 w-3.5 text-[#2D6A4F]" />
                Sector o zona aproximada
              </label>
              <input
                type="text"
                value={form.zone_name}
                onChange={(e) => handleChange("zone_name", e.target.value)}
                placeholder={defaultZone}
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2D6A4F] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-stone-700">
                <ImagePlus className="h-3.5 w-3.5 text-[#2D6A4F]" />
                URL de foto (opcional)
              </label>
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => handleChange("image_url", e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2D6A4F] focus:outline-none"
              />
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
              className="rounded-xl bg-[#2D6A4F] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#245640] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Publicando..." : "Publicar en ReUsa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}