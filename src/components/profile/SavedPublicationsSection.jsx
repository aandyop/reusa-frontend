import { Bookmark, MapPin, Trash2, ExternalLink } from "lucide-react";
import { useSavedAndReports } from "../../context/SavedAndReportsContext";

const PRIMARY_GREEN = "#2d6a4f";

export default function SavedPublicationsSection({
  publications = [],
  onSelectPublication,
  onFeedback,
}) {
  const { getVisibleSavedPublications, removeSavedPublication } =
    useSavedAndReports();

  // Oculta estrictamente las publicaciones ya entregadas (status === "ENTREGADO")
  const visibleSaved = getVisibleSavedPublications(publications);

  const handleRemove = (pub) => {
    removeSavedPublication(pub.id);
    onFeedback?.(`"${pub.title}" quitado de tus publicaciones guardadas.`);
  };

  return (
    <section
      aria-label="Publicaciones guardadas"
      className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs"
    >
      <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3.5">
        <div className="flex items-center gap-2">
          <Bookmark
            style={{ color: PRIMARY_GREEN }}
            className="h-4 w-4 fill-current"
          />
          <h2 className="text-base font-extrabold text-stone-900">
            Publicaciones guardadas ({visibleSaved.length})
          </h2>
        </div>
        <span className="text-[11px] text-stone-500">
          Las entregadas se ocultan automáticamente
        </span>
      </div>

      {visibleSaved.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-stone-200 bg-[#FAF9F6] p-6 text-center text-xs text-stone-500">
          No tienes publicaciones guardadas activas en este momento.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleSaved.map((pub) => (
            <article
              key={pub.id}
              className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-[#FAF9F6] p-4 transition hover:border-[#2d6a4f]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span
                    style={{ color: PRIMARY_GREEN }}
                    className="rounded-md bg-emerald-100/80 px-2 py-0.5 font-extrabold"
                  >
                    {pub.status || "DISPONIBLE"}
                  </span>
                  <span className="font-semibold text-stone-500">
                    {pub.modality || "Donación"}
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-extrabold text-stone-900">
                  {pub.title}
                </h3>

                <p className="mt-1 line-clamp-2 text-xs text-stone-600">
                  {pub.description}
                </p>

                {pub.zone_name && (
                  <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-stone-500">
                    <MapPin
                      style={{ color: PRIMARY_GREEN }}
                      className="h-3 w-3"
                    />
                    <span>{pub.zone_name}</span>
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-stone-200/70 pt-3">
                <button
                  type="button"
                  onClick={() => handleRemove(pub)}
                  className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-stone-700 hover:border-red-300 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Quitar</span>
                </button>

                {onSelectPublication && (
                  <button
                    type="button"
                    style={{ backgroundColor: PRIMARY_GREEN }}
                    onClick={() => onSelectPublication(pub)}
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-extrabold text-white hover:opacity-90"
                  >
                    <span>Ver artículo</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}