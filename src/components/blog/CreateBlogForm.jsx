import { useState } from "react";
import { ImagePlus, Tag, Plus, X, BookOpen, AlignLeft } from "lucide-react";

const PRIMARY_GREEN = "#2d6a4f";
const SECONDARY_TERRACOTTA = "#E76F51";

const SUGGESTED_BLOG_TAGS = [
  "Reutilización",
  "Comunidad",
  "Donaciones",
  "Trueque",
  "Hogar",
  "Sostenibilidad",
];

function countWords(text = "") {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

export default function CreateBlogForm({
  currentUser = null,
  onCancel,
  onBlogCreated,
}) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState(["Reutilización"]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [content, setContent] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const excerptWordCount = countWords(excerpt);
  const exceedsExcerptLimit = excerptWordCount > 30;

  const handleToggleTag = (tagLabel) => {
    setTags((prev) =>
      prev.includes(tagLabel)
        ? prev.filter((item) => item !== tagLabel)
        : [...prev, tagLabel]
    );
  };

  const handleAddCustomTag = () => {
    const cleanTag = customTagInput.trim();
    if (!cleanTag) return;
    if (!tags.includes(cleanTag)) {
      setTags((prev) => [...prev, cleanTag]);
    }
    setCustomTagInput("");
  };

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCoverImage(reader.result);
        setErrorMsg("");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleApplyImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setCoverImage(trimmed);
    setImageUrlInput("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim() || !excerpt.trim() || !content.trim()) {
      setErrorMsg(
        "Completa el título, el resumen breve y el contenido del artículo."
      );
      return;
    }

    if (countWords(excerpt) > 30) {
      setErrorMsg(
        "El resumen breve no puede superar las 30 palabras."
      );
      return;
    }

    setSubmitting(true);

    const newPost = {
      id: `blg-${Date.now()}`,
      title: title.trim(),
      excerpt: excerpt.trim(),
      tags,
      cover_image: coverImage || null,
      content: content.trim(),
      author_nickname: currentUser?.nickname || "editor_reusa",
      created_at: new Date().toISOString(),
    };

    onBlogCreated?.(newPost);
    setTitle("");
    setExcerpt("");
    setTags(["Reutilización"]);
    setCoverImage("");
    setContent("");
    setSubmitting(false);
  };

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div>
          <h2 className="text-lg font-extrabold text-stone-900">
            Crear nuevo artículo del blog
          </h2>
          <p className="text-xs text-stone-500">
            Comparte guías, experiencias vecinales o consejos sobre reutilización responsable.
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar formulario de blog"
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

        {/* 1. Título del artículo */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-700">
            Título del artículo *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Cómo preparar un artículo para donación o trueque seguro"
            className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
          />
        </div>

        {/* 2. Resumen breve (máximo 30 palabras) */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
              <AlignLeft
                style={{ color: PRIMARY_GREEN }}
                className="h-3.5 w-3.5"
              />
              <span>Resumen breve (máximo 30 palabras) *</span>
            </label>

            <span
              style={
                exceedsExcerptLimit
                  ? { color: SECONDARY_TERRACOTTA }
                  : { color: PRIMARY_GREEN }
              }
              className="text-xs font-extrabold"
            >
              {excerptWordCount} / 30 palabras
            </span>
          </div>

          <textarea
            rows={2}
            required
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Escribe un resumen claro y directo en un máximo de 30 palabras..."
            className={`w-full rounded-xl border bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none ${
              exceedsExcerptLimit
                ? "border-[#E76F51] focus:border-[#E76F51]"
                : "border-stone-200 focus:border-[#2d6a4f]"
            }`}
          />
        </div>

        {/* 3. Etiquetas (en color secundario terracota #E76F51) */}
        <div className="rounded-2xl border border-stone-200 bg-[#FAF9F6] p-4">
          <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
            <Tag
              style={{ color: SECONDARY_TERRACOTTA }}
              className="h-3.5 w-3.5"
            />
            <span>Etiquetas</span>
          </label>

          <div className="flex flex-wrap gap-2">
            {SUGGESTED_BLOG_TAGS.map((tagItem) => {
              const active = tags.includes(tagItem);
              return (
                <button
                  key={tagItem}
                  type="button"
                  onClick={() => handleToggleTag(tagItem)}
                  style={
                    active
                      ? {
                          backgroundColor: SECONDARY_TERRACOTTA,
                          borderColor: SECONDARY_TERRACOTTA,
                        }
                      : undefined
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                    active
                      ? "text-white"
                      : "border-stone-200 bg-white text-stone-700 hover:border-[#E76F51]"
                  }`}
                >
                  {tagItem}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomTag();
                }
              }}
              placeholder="Agregar otra etiqueta..."
              className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
            />
            <button
              type="button"
              style={{ backgroundColor: PRIMARY_GREEN }}
              onClick={handleAddCustomTag}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Añadir</span>
            </button>
          </div>

          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  style={{
                    backgroundColor: "rgba(231, 111, 81, 0.14)",
                    color: SECONDARY_TERRACOTTA,
                    borderColor: "rgba(231, 111, 81, 0.35)",
                  }}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleTag(t)}
                    aria-label={`Quitar etiqueta ${t}`}
                    className="hover:opacity-75"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 4. Botón para adjuntar la imagen principal del artículo */}
        <div className="rounded-2xl border border-stone-200 bg-[#FAF9F6] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
              <ImagePlus
                style={{ color: PRIMARY_GREEN }}
                className="h-4 w-4"
              />
              <span>Imagen principal del artículo</span>
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
              placeholder="O pega el enlace de la imagen principal (https://...)"
              className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
            />
            <button
              type="button"
              style={{ backgroundColor: PRIMARY_GREEN }}
              onClick={handleApplyImageUrl}
              className="rounded-xl px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-90"
            >
              Usar URL
            </button>
          </div>

          {coverImage && (
            <div className="relative mt-3 overflow-hidden rounded-xl border border-stone-200 bg-white">
              <img
                src={coverImage}
                alt="Vista previa de imagen principal del artículo"
                className="h-48 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setCoverImage("")}
                className="absolute right-2.5 top-2.5 rounded-lg bg-stone-950/75 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-stone-950"
              >
                Quitar imagen
              </button>
            </div>
          )}
        </div>

        {/* 5. Contenido del artículo */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
            <BookOpen
              style={{ color: PRIMARY_GREEN }}
              className="h-3.5 w-3.5"
            />
            <span>Contenido del artículo *</span>
          </label>
          <textarea
            rows={7}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe el cuerpo completo del artículo para que los lectores puedan leerlo en la vista individual..."
            className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm leading-relaxed text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
          />
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
            disabled={submitting || exceedsExcerptLimit}
            style={{ backgroundColor: PRIMARY_GREEN }}
            className="rounded-xl px-5 py-2.5 text-xs font-extrabold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Publicando artículo..." : "Publicar artículo"}
          </button>
        </div>
      </form>
    </div>
  );
}