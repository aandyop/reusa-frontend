import { useEffect, useMemo } from "react";
import { ArrowLeft, BookOpen, Tag, User } from "lucide-react";

const PRIMARY_GREEN = "#2d6a4f";
const SECONDARY_TERRACOTTA = "#E76F51";

export default function BlogDetailView({
  post,
  allPosts = [],
  onSelectPost,
  onBack,
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [post?.id]);

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return allPosts.filter((item) => item.id !== post.id).slice(0, 4);
  }, [allPosts, post]);

  if (!post) return null;

  const {
    title,
    excerpt,
    content,
    cover_image,
    tags = [],
    author_nickname = "editor_reusa",
    created_at,
  } = post;

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString("es-VE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <article aria-label={`Artículo: ${title}`} className="space-y-6">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white px-5 py-3.5 shadow-2xs">
        <button
          type="button"
          style={{ backgroundColor: PRIMARY_GREEN }}
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al blog</span>
        </button>

        <span
          style={{ color: PRIMARY_GREEN }}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold ring-1 ring-[#2d6a4f]/25"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Lectura completa</span>
        </span>
      </div>

      {/* Artículo completo con imagen principal en grande */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xs">
        {cover_image ? (
          <img
            src={cover_image}
            alt={title}
            className="h-72 w-full object-cover sm:h-96"
          />
        ) : (
          <div className="flex h-60 w-full flex-col items-center justify-center bg-emerald-50/60 text-[#2d6a4f]">
            <BookOpen className="h-10 w-10 opacity-75" />
            <span className="mt-2 text-xs font-bold">
              Blog comunitario ReUsa
            </span>
          </div>
        )}

        <div className="mx-auto max-w-4xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1 font-bold text-stone-800">
              <User style={{ color: PRIMARY_GREEN }} className="h-3.5 w-3.5" />
              @{author_nickname}
            </span>
            {formattedDate && <span>· {formattedDate}</span>}
          </div>

          <h1 className="mt-3 text-2xl font-extrabold text-stone-900 sm:text-3xl">
            {title}
          </h1>

          {excerpt && (
            <p className="mt-4 rounded-2xl border-l-4 border-[#2d6a4f] bg-[#FAF9F6] px-4 py-3 text-sm font-semibold italic leading-relaxed text-stone-700">
              {excerpt}
            </p>
          )}

          {/* Lectura completa del artículo */}
          <div className="mt-6 space-y-4 whitespace-pre-line text-base leading-relaxed text-stone-800">
            {content || excerpt}
          </div>

          {/* Etiquetas en color secundario terracota (#E76F51) */}
          {Array.isArray(tags) && tags.length > 0 && (
            <div className="mt-8 border-t border-stone-100 pt-5">
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
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold"
                  >
                    <Tag className="h-3 w-3" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Otros artículos del blog */}
      {relatedPosts.length > 0 && (
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6">
          <h2 className="mb-4 text-base font-extrabold text-stone-900">
            Más artículos del blog
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {relatedPosts.map((rel) => (
              <div
                key={rel.id}
                onClick={() => onSelectPost?.(rel)}
                className="cursor-pointer rounded-2xl border border-stone-200/90 bg-[#FAF9F6] p-4 transition hover:border-[#2d6a4f]"
              >
                <h3 className="text-sm font-extrabold text-stone-900">
                  {rel.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-stone-600">
                  {rel.excerpt || rel.content}
                </p>
                <p className="mt-2.5 text-[11px] font-semibold text-[#2d6a4f]">
                  Leer artículo →
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}