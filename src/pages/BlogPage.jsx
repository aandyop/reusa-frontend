import { useCallback, useEffect, useState } from "react";
import { BookOpen, Plus, Tag, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { blogService } from "../services/centersEventsBlogService";
import CreateBlogForm from "../components/blog/CreateBlogForm";
import BlogDetailView from "../components/blog/BlogDetailView";

const PRIMARY_GREEN = "#2d6a4f";
const SECONDARY_TERRACOTTA = "#E76F51";
const BLOG_STORAGE_KEY = "reusa_blog_cache";

const DEFAULT_BLOG_POSTS = [
  {
    id: "blg-301",
    title: "Cómo preparar un artículo para donación o trueque seguro",
    excerpt:
      "Revisa limpieza, piezas completas, medidas aproximadas y coordinación responsable por chat para que cada entrega llegue lista a su próximo hogar.",
    content:
      "Antes de publicar un artículo en ReUsa, dedica unos minutos a limpiarlo, verificar que incluya sus piezas o accesorios esenciales y tomar fotos claras con buena luz.\n\nIndicar las medidas aproximadas, el estado real y la disponibilidad horaria evita malentendidos y agiliza la coordinación con la persona interesada.\n\nPor último, acuerda siempre los detalles de entrega dentro del chat de la plataforma y prioriza puntos de encuentro seguros o áreas de referencia.",
    cover_image: null,
    tags: ["Donaciones", "Trueque", "Hogar"],
    author_nickname: "NomadaVerde",
    created_at: "2026-11-18T16:00:00Z",
  },
  {
    id: "blg-302",
    title: "Reutilización local y apoyo comunitario en momentos críticos",
    excerpt:
      "Clasificar lo que ya no usas y canalizarlo a través de centros verificados y redes vecinales acelera la ayuda donde más se necesita.",
    content:
      "Cuando ocurre una emergencia o una familia atraviesa un cambio repentino de vivienda, la solidaridad local marca una diferencia inmediata.\n\nRevisar el hogar para separar mobiliario funcional, ropa de abrigo en buen estado, utensilios y materiales útiles permite canalizar recursos reales sin generar saturación innecesaria.\n\nAl trabajar de forma organizada entre vecinos y centros de acopio, cada entrega se vuelve más rápida, trazable y humana.",
    cover_image: null,
    tags: ["Comunidad", "Reutilización", "Sostenibilidad"],
    author_nickname: "HogarSegundoCiclo",
    created_at: "2026-11-20T09:30:00Z",
  },
];

function readBlogCache() {
  try {
    const raw = localStorage.getItem(BLOG_STORAGE_KEY);
    if (!raw) return DEFAULT_BLOG_POSTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    if (Array.isArray(parsed?.data) && parsed.data.length > 0)
      return parsed.data;
    if (Array.isArray(parsed?.posts) && parsed.posts.length > 0)
      return parsed.posts;
    return DEFAULT_BLOG_POSTS;
  } catch {
    return DEFAULT_BLOG_POSTS;
  }
}

function writeBlogCache(list) {
  try {
    if (Array.isArray(list)) {
      localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(list));
    }
  } catch {
    // Ignorar errores de almacenamiento
  }
}

function extractBlogList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.posts)) return res.posts;
  if (Array.isArray(res?.blog)) return res.blog;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

export default function BlogPage({ externalBlogPosts = null, onBlogCreated }) {
  const { token, user } = useAuth();

  const [posts, setPosts] = useState(() =>
    Array.isArray(externalBlogPosts) && externalBlogPosts.length > 0
      ? externalBlogPosts
      : readBlogCache()
  );
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const localList = readBlogCache();

    try {
      const res = await blogService?.getAll?.(token);
      const apiList = extractBlogList(res);
      const merged = apiList.length > 0 ? apiList : localList;
      setPosts(merged);
      writeBlogCache(merged);
    } catch {
      setPosts(localList);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (Array.isArray(externalBlogPosts) && externalBlogPosts.length > 0) {
      setPosts(externalBlogPosts);
      writeBlogCache(externalBlogPosts);
    }
  }, [externalBlogPosts]);

  const selectedPost =
    posts.find((item) => item.id === selectedPostId) || null;

  const handleBlogCreated = (newPost) => {
    setPosts((prev) => {
      const next = [newPost, ...prev];
      writeBlogCache(next);
      return next;
    });
    setShowCreateForm(false);
    setSelectedPostId(newPost.id);
    onBlogCreated?.(newPost);
  };

  if (selectedPost) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <BlogDetailView
          post={selectedPost}
          allPosts={posts}
          onSelectPost={(post) => setSelectedPostId(post.id)}
          onBack={() => setSelectedPostId(null)}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <section aria-label="Página del Blog comunitario" className="space-y-6">
        {/* Encabezado de la página del Blog */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white px-5 py-4 shadow-2xs">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-extrabold text-stone-900">
              <BookOpen style={{ color: PRIMARY_GREEN }} className="h-5 w-5" />
              <span>Blog y guías de reutilización</span>
            </h1>
            <p className="mt-0.5 text-xs text-stone-500">
              Artículos, experiencias vecinales y consejos para donar o intercambiar de forma segura.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadPosts}
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
              <span>
                {showCreateForm ? "Ocultar formulario" : "Nuevo artículo"}
              </span>
            </button>
          </div>
        </div>

        {/* Formulario de Crear Artículo del Blog */}
        {showCreateForm && (
          <CreateBlogForm
            currentUser={user}
            onCancel={() => setShowCreateForm(false)}
            onBlogCreated={handleBlogCreated}
          />
        )}

        {/* Listado de tarjetas de Blog con imagen principal */}
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
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-stone-400" />
            <h2 className="mt-3 text-base font-bold text-stone-900">
              Aún no hay artículos publicados
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Crea el primer artículo del blog usando el botón superior.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const coverImg = post.cover_image || post.image_url || null;

              return (
                <article
                  key={post.id}
                  onClick={() => setSelectedPostId(post.id)}
                  className="cursor-pointer overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xs transition hover:border-[#2d6a4f] hover:shadow-sm"
                >
                  <div className="h-44 w-full bg-stone-100">
                    {coverImg ? (
                      <img
                        src={coverImg}
                        alt={post.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-emerald-50/60 text-[#2d6a4f]">
                        <BookOpen className="h-8 w-8 opacity-75" />
                        <span className="mt-1.5 text-[11px] font-bold">
                          Artículo ReUsa
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <span
                      style={{ color: PRIMARY_GREEN }}
                      className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase"
                    >
                      Blog
                    </span>

                    <h2 className="mt-2 line-clamp-1 text-base font-extrabold text-stone-900">
                      {post.title}
                    </h2>

                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">
                      {post.excerpt || post.content}
                    </p>

                    {Array.isArray(post.tags) && post.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 3).map((tagItem) => (
                          <span
                            key={tagItem}
                            style={{
                              backgroundColor: "rgba(231, 111, 81, 0.14)",
                              color: SECONDARY_TERRACOTTA,
                              borderColor: "rgba(231, 111, 81, 0.35)",
                            }}
                            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold"
                          >
                            <Tag className="h-2.5 w-2.5" />
                            {tagItem}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3.5 flex items-center justify-between border-t border-stone-100 pt-3 text-[11px]">
                      <span className="text-stone-500">
                        @{post.author_nickname || "editor_reusa"}
                      </span>
                      <span className="font-bold text-[#2d6a4f]">
                        Leer artículo →
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