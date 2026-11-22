import { useState } from "react";
import { Bookmark, Share2, Flag, Check } from "lucide-react";
import { useSavedAndReports } from "../../context/SavedAndReportsContext";

const PRIMARY_GREEN = "#2d6a4f";
const SECONDARY_TERRACOTTA = "#E76F51";

export default function PublicationActionButtons({
  publication,
  onRequireAuth,
  onActionFeedback,
  compact = false,
}) {
  const { isPublicationSaved, toggleSavePublication, openReportModal } =
    useSavedAndReports();

  const [copied, setCopied] = useState(false);

  if (!publication?.id) return null;

  const saved = isPublicationSaved(publication.id);

  const handleSaveClick = (e) => {
    e.stopPropagation();
    const res = toggleSavePublication(publication, onRequireAuth);
    if (res.status === "ok") {
      onActionFeedback?.(
        res.saved
          ? `"${publication.title}" guardado en tu perfil.`
          : `"${publication.title}" eliminado de tus guardados.`
      );
    }
  };

  const handleShareClick = async (e) => {
    e.stopPropagation();
    const shareTitle = publication.title || "Publicación en ReUsa";
    const shareText = `${shareTitle} — ${
      publication.zone_name || "Comunidad ReUsa"
    }`;
    const shareUrl = `${window.location.origin}?pub=${encodeURIComponent(
      publication.id
    )}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        onActionFeedback?.("Publicación compartida.");
        return;
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
    }

    try {
      await navigator.clipboard?.writeText(shareUrl);
    } catch {
      // Respaldo si el portapapeles no está disponible
    }

    setCopied(true);
    onActionFeedback?.("Enlace de la publicación copiado al portapapeles.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReportClick = (e) => {
    e.stopPropagation();
    openReportModal(publication, onRequireAuth);
  };

  const btnBase = compact
    ? "inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition"
    : "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Botón Guardar (requiere sesión iniciada) */}
      <button
        type="button"
        onClick={handleSaveClick}
        aria-pressed={saved}
        style={
          saved
            ? {
                backgroundColor: PRIMARY_GREEN,
                borderColor: PRIMARY_GREEN,
                color: "#ffffff",
              }
            : undefined
        }
        className={`${btnBase} ${
          saved
            ? "text-white"
            : "border-stone-200 bg-[#FAF9F6] text-stone-700 hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
        }`}
      >
        <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
        <span>{saved ? "Guardado" : "Guardar"}</span>
      </button>

      {/* Botón Compartir */}
      <button
        type="button"
        onClick={handleShareClick}
        className={`${btnBase} border-stone-200 bg-[#FAF9F6] text-stone-700 hover:border-[#2d6a4f] hover:text-[#2d6a4f]`}
      >
        {copied ? (
          <Check style={{ color: PRIMARY_GREEN }} className="h-3.5 w-3.5" />
        ) : (
          <Share2 className="h-3.5 w-3.5" />
        )}
        <span>{copied ? "Copiado" : "Compartir"}</span>
      </button>

      {/* Botón Reportar (requiere sesión iniciada) */}
      <button
        type="button"
        onClick={handleReportClick}
        className={`${btnBase} border-stone-200 bg-[#FAF9F6] text-stone-700 hover:border-[#E76F51] hover:text-[#E76F51]`}
      >
        <Flag style={{ color: SECONDARY_TERRACOTTA }} className="h-3.5 w-3.5" />
        <span>Reportar</span>
      </button>
    </div>
  );
}