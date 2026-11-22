import { useState } from "react";
import {
  Calendar,
  BookOpen,
  Plus,
  MapPin,
  Users,
  Tag,
  Clock,
} from "lucide-react";
import CreateEventForm from "../components/events/CreateEventForm";
import EventDetailView from "../components/events/EventDetailView";
import CreateBlogForm from "../components/blog/CreateBlogForm";
import BlogDetailView from "../components/blog/BlogDetailView";

const PRIMARY_GREEN = "#2d6a4f";
const SECONDARY_TERRACOTTA = "#E76F51";

export default function CommunityViewsPage({
  mode = "events", // "events" | "blog"
  events = [],
  blogPosts = [],
  currentUser = null,
  onEventCreated,
  onBlogCreated,
  onJoinEvent,
}) {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedBlogId, setSelectedBlogId] = useState(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateBlog, setShowCreateBlog] = useState(false);

  const selectedEvent =
    events.find((item) => item.id === selectedEventId) || null;
  const selectedBlog =
    blogPosts.find((item) => item.id === selectedBlogId) || null;

  // Vista individual de Evento
  if (mode === "events" && selectedEvent) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <EventDetailView
          eventItem={selectedEvent}
          allEvents={events}
          onSelectEvent={(evt) => setSelectedEventId(evt.id)}
          onJoinEvent={onJoinEvent}
          onBack={() => setSelectedEventId(null)}
        />
      </main>
    );
  }

  // Vista individual de Artículo del Blog
  if (mode === "blog" && selectedBlog) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <BlogDetailView
          post={selectedBlog}
          allPosts={blogPosts}
          onSelectPost={(post) => setSelectedBlogId(post.id)}
          onBack={() => setSelectedBlogId(null)}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {mode === "events" ? (
        <section aria-label="Eventos comunitarios" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white px-5 py-4 shadow-2xs">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-extrabold text-stone-900">
                <Calendar style={{ color: PRIMARY_GREEN }} className="h-5 w-5" />
                <span>Eventos comunitarios</span>
              </h1>
              <p className="mt-0.5 text-xs text-stone-500">
                Explora jornadas, talleres y encuentros vecinales o crea un nuevo evento.
              </p>
            </div>

            <button
              type="button"
              style={{ backgroundColor: PRIMARY_GREEN }}
              onClick={() => setShowCreateEvent((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-extrabold text-white transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              <span>{showCreateEvent ? "Ocultar formulario" : "Crear evento"}</span>
            </button>
          </div>

          {showCreateEvent && (
            <CreateEventForm
              currentUser={currentUser}
              onCancel={() => setShowCreateEvent(false)}
              onEventCreated={(newEvt) => {
                onEventCreated?.(newEvt);
                setShowCreateEvent(false);
                setSelectedEventId(newEvt.id);
              }}
            />
          )}

          {/* Tarjetas de Eventos con imagen principal */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.map((evt) => (
              <article
                key={evt.id}
                onClick={() => setSelectedEventId(evt.id)}
                className="cursor-pointer overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xs transition hover:border-[#2d6a4f] hover:shadow-sm"
              >
                <div className="h-44 w-full bg-stone-100">
                  {evt.cover_image ? (
                    <img
                      src={evt.cover_image}
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
            ))}
          </div>
        </section>
      ) : (
        <section aria-label="Blog comunitario" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white px-5 py-4 shadow-2xs">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-extrabold text-stone-900">
                <BookOpen style={{ color: PRIMARY_GREEN }} className="h-5 w-5" />
                <span>Blog y guías de reutilización</span>
              </h1>
              <p className="mt-0.5 text-xs text-stone-500">
                Lee artículos completos de la comunidad o publica un nuevo artículo.
              </p>
            </div>

            <button
              type="button"
              style={{ backgroundColor: PRIMARY_GREEN }}
              onClick={() => setShowCreateBlog((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-extrabold text-white transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              <span>
                {showCreateBlog ? "Ocultar formulario" : "Nuevo artículo"}
              </span>
            </button>
          </div>

          {showCreateBlog && (
            <CreateBlogForm
              currentUser={currentUser}
              onCancel={() => setShowCreateBlog(false)}
              onBlogCreated={(newPost) => {
                onBlogCreated?.(newPost);
                setShowCreateBlog(false);
                setSelectedBlogId(newPost.id);
              }}
            />
          )}

          {/* Tarjetas de Blog con imagen principal */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => setSelectedBlogId(post.id)}
                className="cursor-pointer overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xs transition hover:border-[#2d6a4f] hover:shadow-sm"
              >
                <div className="h-44 w-full bg-stone-100">
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
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
            ))}
          </div>
        </section>
      )}
    </main>
  );
}