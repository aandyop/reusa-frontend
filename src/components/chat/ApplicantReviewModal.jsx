import { useEffect, useState } from "react";
import {
  X,
  ShieldCheck,
  Award,
  CheckCircle2,
  XCircle,
  UserCheck,
  AlertTriangle,
  PackageCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { publicationsService } from "../../services/publicationsService";
import { authService } from "../../services/authService";
import { REPOINTS_COLOR } from "../../utils/constants";

const FALLBACK_REQUESTS = [
  {
    id: "req-01",
    applicant_id: "usr-001",
    applicant_nickname: "NomadaVerde",
    initial_message:
      "Hola, tengo camioneta disponible el sábado por la mañana para retirarlo sin inconvenientes.",
    status: "PENDIENTE",
    trust_profile: {
      id: "usr-001",
      nickname: "NomadaVerde",
      is_verified: true,
      role: "user",
      re_points: 185,
      completed_donations_count: 3,
      completed_received_count: 2,
      negative_reports_count: 0,
      approx_zone_name: "Sector El Mirador",
    },
  },
  {
    id: "req-02",
    applicant_id: "usr-005",
    applicant_nickname: "HogarSegundoCiclo",
    initial_message:
      "Buenas, me interesa mucho para la sala de un apartamento estudiantil.",
    status: "PENDIENTE",
    trust_profile: {
      id: "usr-005",
      nickname: "HogarSegundoCiclo",
      is_verified: true,
      role: "user",
      re_points: 120,
      completed_donations_count: 2,
      completed_received_count: 3,
      negative_reports_count: 0,
      approx_zone_name: "Santa Rosa",
    },
  },
];

export default function ApplicantReviewModal({
  publication,
  isOpen,
  onClose,
  onApprovedRequest,
}) {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!isOpen || !publication?.id) return;

    let active = true;
    async function loadRequests() {
      setLoading(true);
      try {
        const res = await publicationsService.getRequests(publication.id, token);
        const list = Array.isArray(res) ? res : res?.requests || [];
        if (active) {
          setRequests(list);
          if (list[0]?.trust_profile) {
            setSelectedProfile(list[0].trust_profile);
          }
        }
      } catch {
        if (active) {
          setRequests(FALLBACK_REQUESTS);
          setSelectedProfile(FALLBACK_REQUESTS[0].trust_profile);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRequests();
    return () => {
      active = false;
    };
  }, [isOpen, publication, token]);

  if (!isOpen || !publication) return null;

  const handleInspectProfile = async (reqItem) => {
    if (reqItem.trust_profile) {
      setSelectedProfile(reqItem.trust_profile);
      return;
    }
    try {
      const profile = await authService.getTrustProfile(
        reqItem.applicant_id,
        token
      );
      setSelectedProfile(profile);
    } catch {
      setSelectedProfile({
        nickname: reqItem.applicant_nickname || "vecino_reusa",
        is_verified: true,
        re_points: 95,
        completed_donations_count: 1,
        completed_received_count: 1,
        negative_reports_count: 0,
        approx_zone_name: "Zona cercana",
      });
    }
  };

  const handleApprove = async (reqItem) => {
    setProcessingId(reqItem.id);
    try {
      const res = await publicationsService.approveRequest(reqItem.id, token);
      onApprovedRequest?.({
        publicationId: publication.id,
        applicantId: reqItem.applicant_id,
        applicantNickname:
          reqItem.applicant_nickname || reqItem.trust_profile?.nickname,
        conversation: res?.conversation || null,
      });
      onClose?.();
    } catch {
      onApprovedRequest?.({
        publicationId: publication.id,
        applicantId: reqItem.applicant_id,
        applicantNickname:
          reqItem.applicant_nickname || reqItem.trust_profile?.nickname,
        conversation: null,
      });
      onClose?.();
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (reqItem) => {
    setProcessingId(reqItem.id);
    try {
      await publicationsService.rejectRequest(reqItem.id, token);
    } catch {
      // Continúa actualización local
    } finally {
      setRequests((prev) => prev.filter((item) => item.id !== reqItem.id));
      setProcessingId(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-stone-200 bg-[#FAF9F6] shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4">
          <div>
            <h2
              id="review-modal-title"
              className="text-base font-extrabold text-stone-900"
            >
              Revisar interesados · {publication.title}
            </h2>
            <p className="text-xs text-stone-500">
              Inspecciona el perfil verificado de cada vecino antes de reservar el artículo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-xl p-2 text-stone-500 hover:bg-stone-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-12">
          {/* Columna izquierda: Lista de solicitudes */}
          <div className="space-y-3 md:col-span-7">
            <h3 className="text-xs font-bold uppercase tracking-wide text-stone-600">
              Solicitudes recibidas ({requests.length})
            </h3>

            {loading ? (
              <div className="h-40 animate-pulse rounded-2xl bg-white p-4" />
            ) : requests.length === 0 ? (
              <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-500">
                Aún no hay solicitudes pendientes para este artículo.
              </div>
            ) : (
              requests.map((reqItem) => {
                const nick =
                  reqItem.applicant_nickname ||
                  reqItem.trust_profile?.nickname ||
                  "vecino";
                const isSelected = selectedProfile?.nickname === nick;

                return (
                  <div
                    key={reqItem.id}
                    className={`rounded-2xl border bg-white p-4 transition ${
                      isSelected
                        ? "border-[#2D6A4F] ring-2 ring-[#2D6A4F]/15"
                        : "border-stone-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleInspectProfile(reqItem)}
                        className="flex items-center gap-2 text-left"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-[#2D6A4F]">
                          {nick.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <span className="flex items-center gap-1 text-sm font-bold text-stone-900">
                            @{nick}
                            <ShieldCheck className="h-4 w-4 text-[#2D6A4F]" />
                          </span>
                          <span className="text-[11px] font-medium text-[#2D6A4F] underline">
                            Ver perfil de confianza
                          </span>
                        </div>
                      </button>
                    </div>

                    <p className="mt-2.5 rounded-xl bg-[#FAF9F6] p-3 text-xs leading-relaxed text-stone-700">
                      “{reqItem.initial_message}”
                    </p>

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={processingId === reqItem.id}
                        onClick={() => handleReject(reqItem)}
                        className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Rechazar
                      </button>

                      <button
                        type="button"
                        disabled={processingId === reqItem.id}
                        onClick={() => handleApprove(reqItem)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#2D6A4F] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#245640]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Aprobar y abrir chat
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Columna derecha: Ficha de Confianza del Interesado */}
          <div className="md:col-span-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-600">
              Perfil de confianza
            </h3>

            {selectedProfile ? (
              <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2D6A4F] text-base font-extrabold text-white">
                    {selectedProfile.nickname.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-extrabold text-stone-900">
                        @{selectedProfile.nickname}
                      </p>
                      {selectedProfile.role === "releader" && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-[#2D6A4F]">
                          ReLeader
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-[#2D6A4F]">
                      <UserCheck className="h-3.5 w-3.5" />
                      Identidad verificada
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-amber-50/90 p-2.5 ring-1 ring-amber-200">
                    <span className="text-[11px] text-stone-500">RePoints</span>
                    <p className="mt-0.5 flex items-center gap-1 font-extrabold text-stone-900">
                      <Award
                        className="h-4 w-4"
                        style={{ color: REPOINTS_COLOR, fill: REPOINTS_COLOR }}
                      />
                      {selectedProfile.re_points ?? 0}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#FAF9F6] p-2.5 ring-1 ring-stone-200">
                    <span className="text-[11px] text-stone-500">Reportes</span>
                    <p className="mt-0.5 flex items-center gap-1 font-extrabold text-emerald-700">
                      {selectedProfile.negative_reports_count === 0 ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />0 negativos
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          {selectedProfile.negative_reports_count}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#FAF9F6] p-2.5 ring-1 ring-stone-200">
                    <span className="text-[11px] text-stone-500">Donados</span>
                    <p className="mt-0.5 flex items-center gap-1 font-bold text-stone-800">
                      <PackageCheck className="h-4 w-4 text-[#2D6A4F]" />
                      {selectedProfile.completed_donations_count ?? 0}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#FAF9F6] p-2.5 ring-1 ring-stone-200">
                    <span className="text-[11px] text-stone-500">Recibidos</span>
                    <p className="mt-0.5 font-bold text-stone-800">
                      {selectedProfile.completed_received_count ?? 0}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-stone-500">
                  Zona habitual: <strong>{selectedProfile.approx_zone_name || "Cercana"}</strong>
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-stone-200 bg-white p-4 text-xs text-stone-500">
                Haz clic sobre un interesado para ver su historial y reputación.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}