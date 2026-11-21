import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Plus,
  Edit3,
  ShieldCheck,
  Sparkles,
  Lock,
  ArrowLeft,
  Tag,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { blogService } from "../services/centersEventsBlogService";

const FALLBACK_POSTS = [
  {
    id: "blog-01",
    author_id: "usr-002",
    author_nickname: "LiderSostenible",
    title: "Guía práctica para donar muebles sin contratiempos",
    excerpt:
      "Consejos clave sobre medidas, estado real del artículo y coordinación segura antes de entregar.",
    content:
      "Antes de publicar un mueble en ReUsa, revisa su estabilidad, toma fotos con buena luz natural e indica con claridad si requiere transporte amplio o ayuda para cargarlo.\n\nAl aprobar una solicitud, usa el chat privado para acordar la hora exacta y evitar esperas innecesarias. Recuerda que tu identidad pública siempre es tu nickname para mantener el intercambio enfocado en la segunda vida del objeto.",
    cover_image_url: "",
    tags: "comunidad, donaciones, hogar",
    created_at: "2026-11-12T10:00:00Z",
  },
  {
    id: "blog-02",
    author_id: "usr-003",
    author_nickname: "TallerRaiz",
    title: "Cómo evaluar si una pieza de madera vale la pena restaurar",
    excerpt:
      "Revisa uniones, humedad y estructura antes de dar una segunda vida a mesas, sillas o estantes.",
    content:
      "Una estructura firme con rayones superficiales es candidata ideal para volver a usarse. Si las uniones están flojas pero la madera está sana, un ajuste sencillo puede devolverle años de vida útil.\n\nSi el artículo presenta daños estructurales profundos o plagas activas, indícalo con honestidad como 'Solo para piezas / Restauración' para que otro vecino lo aproveche en proyectos de taller.",
    cover_image_url: "",
    tags: "restauracion, mobiliario, diy",
    created_at: "2026-11-16T15:30:00Z",
  },
];

const EMPTY_EDITOR = {
  id: null,
  title: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  tags: "",
};

function renderParagraphs(rawContent = "") {
  const clean = rawContent.replace(/<[^>]+>/g, " ").trim();
  if (!clean) return [];
  return rawContent
    .split(/\n+/)
    .map((block) => block.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);
}

export default function BlogPage() {
  const { token, user, isReLeader } = useAuth();

  const [posts, setPosts] = useState([]);
  const [activePostId, setActivePostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editorForm, setEditorForm] = useState(EMPTY_EDITOR);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogService.getAll(token);
      const list = Array.isArray(res) ? res : res?.posts || [];
      setPosts(list);
      setActivePostId((prev) => prev || list[0]?.id || null);
    } catch {
      setPosts(FALLBACK_POSTS);
      setActivePostId((prev) => prev || FALLBACK_POSTS[0]?.id || null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const activePost = useMemo(
    () => posts.find((p) => p.id === activePostId) || posts[0] || null,
    [posts, activePostId]
  );

  const currentUserId = user?.id || "usr-local";
  const currentNickname = user?.nickname || "ReLeader";

  const openNewPostEditor = () => {
    setErrorMessage("");
    setStatusMessage("");
    if (!isReLeader) {
      setErrorMessage(
        "Solo los usuarios con rol ReLeader pueden crear o editar artículos del blog."
      );
      return;
    }
    setEditorForm(EMPTY_EDITOR);
    setIsEditingMode(true);
  };

  const openEditPostEditor = (post) => {
    setErrorMessage("");
    setStatusMessage("");
    if (!isReLeader) {
      setErrorMessage(
        "Solo los usuarios con rol ReLeader pueden editar artículos del blog."
      );
      return;
    }
    setEditorForm({
      id: post.id,
      title: post.title || "",
      excerpt: post.excerpt || "",
      content: (post.content || "").replace(/<[^>]+>/g, ""),
      cover_image_url: post.cover_image_url || "",
      tags: post.tags || "",
    });
    setIsEditingMode(true);
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (!isReLeader) {
      setErrorMessage(
        "Acceso denegado: la creación y edición de artículos del blog es exclusiva de ReLeaders."
      );
      return;
    }

    if (
      !editorForm.title.trim() ||
      !editorForm.excerpt.trim() ||
      !editorForm.content.trim()
    ) {
      setErrorMessage(
        "Completa el título, el resumen breve y el contenido del artículo."
      );
      return;
    }

    const payload = {
      title: editorForm.title.trim(),
      excerpt: editorForm.excerpt.trim(),
      content: editorForm.content.trim(),
      cover_image_url: editorForm.cover_image_url.trim() || null,
      tags: editorForm.tags.trim(),
    };

    try {
      if (editorForm.id) {
        await blogService.update(editorForm.id, payload, token);
        setPosts((prev) =>
          prev.map((item) =>
            item.id === editorForm.id
              ? {
                  ...item,
                  ...payload,
                  updated_at: new Date().toISOString(),
                }
              : item
          )
        );
        setActivePostId(editorForm.id);
        setStatusMessage("Artículo actualizado correctamente.");
      } else {
        const res = await blogService.create(payload, token);
        const created = res?.post || res || {
          ...payload,
          id: `blog-local-${Date.now()}`,
          author_id: currentUserId,
          author_nickname: currentNickname,
          created_at: new Date().toISOString(),
        };
        setPosts((prev) => [created, ...prev]);
        setActivePostId(created.id);
        setStatusMessage("Nuevo artículo publicado en el blog comunitario.");
      }

      setIsEditingMode(false);
      setEditorForm(EMPTY_EDITOR);
    } catch (err) {
      if (err?.status === 403) {
        setErrorMessage(
          err.message ||
            "No tienes permisos de ReLeader para guardar cambios en el blog."
        );
      } else {
        // Respaldo reactivo en vista previa local
        if (editorForm.id) {
          setPosts((prev) =>
            prev.map((item) =>
              item.id === editorForm.id
                ? { ...item, ...payload, updated_at: new Date().toISOString() }
                : item
            )
          );
          setActivePostId(editorForm.id);
          setStatusMessage("Artículo actualizado (vista previa local).");
        } else {
          const previewPost = {
            ...payload,
            id: `blog-preview-${Date.now()}`,
            author_id: currentUserId,
            author_nickname: currentNickname,
            created_at: new Date().toISOString(),
          };
          setPosts((prev) => [previewPost, ...prev]);
          setActivePostId(previewPost.id);
          setStatusMessage("Artículo publicado (vista previa local).");
        }
        setIsEditingMode(false);
        setEditorForm(EMPTY_EDITOR);
      }
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {/* Cabecera */}
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-[#2D6A4F]">
            <Sparkles className="h-3.5 w-3.5" />
            Saberes de Segunda Vida
          </span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900">
            Blog Comunitario ReUsa
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Guías de restauración, cuidado del hogar y buenas prácticas compartidas por la comunidad.
          </p>
        </div>

        <div className="shrink-0">
          {isReLeader ? (
            <button
              type="button"
              onClick={
                isEditingMode
                  ? () => {
                      setIsEditingMode(false);
                      setErrorMessage("");
                    }
                  : openNewPostEditor
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#2D6A4F] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#245640]"
            >
              {isEditingMode ? (
                <>
                  <ArrowLeft className="h-4 w-4" />
                  <span>Volver a lectura</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Escribir artículo</span>
                </>
              )}
            </button>
          ) : (
            <div
              title="Solo los ReLeaders pueden redactar o editar artículos del blog"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2 text-xs font-semibold text-stone-500"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Editor exclusivo de ReLeaders</span>
            </div>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-[#2D6A4F]">
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Modo Editor (Exclusivo ReLeaders) */}
      {isReLeader && isEditingMode ? (
        <form
          onSubmit={handleSavePost}
          className="space-y-4 rounded-3xl border border-emerald-200 bg-white p-6 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-lg font-extrabold text-stone-900">
                {editorForm.id ? "Editar artículo" : "Nuevo artículo del blog"}
              </h2>
              <p className="text-xs text-stone-500">
                Publicando como ReLeader{" "}
                <strong className="text-[#2D6A4F]">@{currentNickname}</strong>
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-stone-700">
              Título del artículo *
            </label>
            <input
              type="text"
              required
              value={editorForm.title}
              onChange={(e) =>
                setEditorForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Ej. Cómo limpiar y proteger madera antes de donar"
              className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm focus:border-[#2D6A4F] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-stone-700">
              Resumen breve (excerpt) *
            </label>
            <input
              type="text"
              required
              value={editorForm.excerpt}
              onChange={(e) =>
                setEditorForm((prev) => ({ ...prev, excerpt: e.target.value }))
              }
              placeholder="Una frase clara que resuma el aporte del artículo..."
              className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm focus:border-[#2D6A4F] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-stone-700">
                Etiquetas (separadas por coma)
              </label>
              <input
                type="text"
                value={editorForm.tags}
                onChange={(e) =>
                  setEditorForm((prev) => ({ ...prev, tags: e.target.value }))
                }
                placeholder="restauracion, hogar, reciclaje"
                className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm focus:border-[#2D6A4F] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-stone-700">
                URL de imagen de portada (opcional)
              </label>
              <input
                type="url"
                value={editorForm.cover_image_url}
                onChange={(e) =>
                  setEditorForm((prev) => ({
                    ...prev,
                    cover_image_url: e.target.value,
                  }))
                }
                placeholder="https://..."
                className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm focus:border-[#2D6A4F] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-stone-700">
              Contenido del artículo *
            </label>
            <textarea
              rows={8}
              required
              value={editorForm.content}
              onChange={(e) =>
                setEditorForm((prev) => ({ ...prev, content: e.target.value }))
              }
              placeholder="Escribe el contenido completo separando párrafos con una línea en blanco..."
              className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm leading-relaxed focus:border-[#2D6A4F] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={() => setIsEditingMode(false)}
              className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#2D6A4F] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#245640]"
            >
              {editorForm.id ? "Guardar cambios" : "Publicar artículo"}
            </button>
          </div>
        </form>
      ) : loading ? (
        <div className="h-64 animate-pulse rounded-2xl border border-stone-200 bg-white" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Lista de artículos */}
          <div className="space-y-3 lg:col-span-4">
            {posts.map((post) => {
              const selected = activePost?.id === post.id;
              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setStatusMessage("");
                    setActivePostId(post.id);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-[#2D6A4F] bg-white ring-2 ring-[#2D6A4F]/15 shadow-xs"
                      : "border-stone-200/90 bg-white/80 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#2D6A4F]">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      @{post.author_nickname}
                    </span>
                    <span className="text-stone-400">
                      {post.created_at
                        ? new Date(post.created_at).toLocaleDateString("es-VE", {
                            day: "numeric",
                            month: "short",
                          })
                        : ""}
                    </span>
                  </div>
                  <h2 className="mt-1.5 text-sm font-extrabold text-stone-900">
                    {post.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-xs text-stone-500">
                    {post.excerpt}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Lector del artículo seleccionado */}
          <div className="lg:col-span-8">
            {activePost ? (
              <article className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#2D6A4F] ring-1 ring-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    ReLeader @{activePost.author_nickname}
                  </span>

                  {isReLeader && (
                    <button
                      type="button"
                      onClick={() => openEditPostEditor(activePost)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 py-1.5 text-xs font-bold text-stone-700 transition hover:bg-stone-100"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-[#2D6A4F]" />
                      <span>Editar artículo</span>
                    </button>
                  )}
                </div>

                <h2 className="mt-4 text-2xl font-extrabold leading-tight text-stone-900">
                  {activePost.title}
                </h2>

                <p className="mt-2 text-sm font-medium italic text-stone-500">
                  {activePost.excerpt}
                </p>

                {activePost.cover_image_url && (
                  <div className="mt-5 overflow-hidden rounded-2xl border border-stone-100 bg-stone-100">
                    <img
                      src={activePost.cover_image_url}
                      alt={activePost.title}
                      className="max-h-80 w-full object-cover"
                    />
                  </div>
                )}

                <div className="mt-6 space-y-4 text-sm leading-relaxed text-stone-700">
                  {renderParagraphs(activePost.content).map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>

                {activePost.tags && (
                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
                    <Tag className="h-3.5 w-3.5 text-stone-400" />
                    {activePost.tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#FAF9F6] px-3 py-1 text-xs font-semibold text-stone-600 ring-1 ring-stone-200"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>
                )}
              </article>
            ) : (
              <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
                Selecciona un artículo para leerlo.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}