import { useEffect, useState } from "react";
import { Flag, X } from "lucide-react";
import { useSavedAndReports } from "../../context/SavedAndReportsContext";

const PRIMARY_GREEN = "#2d6a4f";
const SECONDARY_TERRACOTTA = "#E76F51";

const REPORT_REASONS = [
  "Artículo ya entregado o no disponible",
  "Descripción o estado engañoso",
  "Contenido inapropiado o spam",
  "Riesgo de seguridad o coordinación sospechosa",
  "Otro motivo",
];

export default function ReportPublicationModal({ onReported }) {
  const { reportTargetPub, closeReportModal, submitPublicationReport } =
    useSavedAndReports();

  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (reportTargetPub) {
      setReason(REPORT_REASONS[0]);
      setDetails("");
      setErrorMsg("");
    }
  }, [reportTargetPub]);

  if (!reportTargetPub) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg("Selecciona un motivo para el reporte.");
      return;
    }

    const created = submitPublicationReport({
      publicationId: reportTargetPub.id,
      publicationTitle: reportTargetPub.title,
      reason,
      details,
    });

    if (created) {
      onReported?.(created);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-pub-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 bg-[#FAF9F6] px-5 py-4">
          <div className="flex items-center gap-2">
            <Flag
              style={{ color: SECONDARY_TERRACOTTA }}
              className="h-4 w-4 shrink-0"
            />
            <h2
              id="report-pub-modal-title"
              className="text-sm font-extrabold text-stone-900"
            >
              Reportar publicación
            </h2>
          </div>

          <button
            type="button"
            onClick={closeReportModal}
            aria-label="Cerrar modal de reporte"
            className="rounded-xl p-1.5 text-stone-500 hover:bg-stone-200/60 hover:text-stone-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="rounded-xl bg-[#FAF9F6] px-3.5 py-2.5 text-xs text-stone-700 ring-1 ring-stone-200/80">
            <span className="font-semibold text-stone-500">Artículo: </span>
            <span className="font-extrabold text-stone-900">
              {reportTargetPub.title}
            </span>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-700">
              Motivo del reporte *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
            >
              {REPORT_REASONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-700">
              Detalles adicionales (opcional)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe brevemente qué ocurre con la publicación..."
              className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-xs text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-stone-100 pt-3">
            <button
              type="button"
              onClick={closeReportModal}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{ backgroundColor: PRIMARY_GREEN }}
              className="rounded-xl px-4 py-2 text-xs font-extrabold text-white transition hover:opacity-90"
            >
              Enviar reporte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}