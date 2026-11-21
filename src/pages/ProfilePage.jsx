import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PackageCheck,
  FileCheck2,
  LogIn,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { publicationsService } from "../services/publicationsService";
import PublicationCard from "../components/feed/PublicationCard";
import { REPOINTS_COLOR } from "../utils/constants";

const FALLBACK_DELIVERED_HISTORY = [
  {
    id: "pub-105",
    author_id: "usr-002",
    author_nickname: "LiderSostenible",
    author_role: "releader",
    author_is_verified: true,
    title: "Escritorio escolar de madera sólida",
    description:
      "Ya fue entregado a un estudiante de la zona. Permanece en el historial del perfil en modo lectura.",
    images: [],
    category: "Mobiliario",
    item_condition: "Buen estado",
    modality: "Donación",
    trade_preference: null,
    size_scale: "L",
    tags: ["Transporte necesario"],
    status: "ENTREGADO",
    zone_name: "Centro Histórico",
    re_points_reward: 45,
    created_at: "2026-11-05T11:20:00Z",
  },
];

export default function ProfilePage({ onOpenAuthModal }) {
  const {
    user,
    token,
    isAuthenticated,
    isVerified,
    isReLeader,
    submitIdentityVerification,
    loading: authLoading,
  } = useAuth();

  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Estado del formulario de verificación de identidad privada
  const [fullName, setFullName] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [docFile, setDocFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [verifyFeedback, setVerifyFeedback] = useState("");
  const [verifyError, setVerifyError] = useState("");

  const nickname = user?.nickname || "NomadaVerde";
  const rePoints = user?.re_points ?? user?.rePoints ?? 185;
  const donationsCount = user?.completed_donations_count ?? 3;
  const receivedCount = user?.completed_received_count ?? 2;
  const negativeReports = user?.negative_reports_count ?? 0;
  const verificationStatus =
    user?.verification_status || (isVerified ? "verified" : "unverified");

  const donationsTarget = 5;
  const donationsProgressPct = Math.min(
    100,
    Math.round((donationsCount / donationsTarget) * 100)
  );

  const loadDeliveredHistory = useCallback(async () => {
    if (!user?.id) {
      setHistoryItems(FALLBACK_DELIVERED_HISTORY);
      return;
    }

    setLoadingHistory(true);
    try {
      const res = await publicationsService.getUserPublications(user.id, token);
      const allUserPubs = Array.isArray(res) ? res : res?.publications || [];
      const deliveredOnly = allUserPubs.filter(
        (item) => item.status === "ENTREGADO"
      );
      setHistoryItems(
        deliveredOnly.length > 0 ? deliveredOnly : FALLBACK_DELIVERED_HISTORY
      );
    } catch {
      setHistoryItems(FALLBACK_DELIVERED_HISTORY);
    } finally {
      setLoadingHistory(false);
    }
  }, [user?.id, token]);

  useEffect(() => {
    loadDeliveredHistory();
  }, [loadDeliveredHistory]);

  const reLeaderChecklist = useMemo(
    () => [
      {
        label: "Identidad verificada",
        met: Boolean(isVerified),
        detail: isVerified ? "Verificación aprobada" : "Pendiente de verificación",
      },
      {
        label: "Al menos 5 donaciones exitosas",
        met: donationsCount >= donationsTarget,
        detail: `${Math.min(donationsCount, donationsTarget)} de ${donationsTarget} donaciones`,
      },
      {
        label: "0 reportes negativos",
        met: negativeReports === 0,
        detail:
          negativeReports === 0
            ? "Sin reportes negativos"
            : `${negativeReports} reporte(s) registrado(s)`,
      },
    ],
    [isVerified, donationsCount, negativeReports]
  );

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setVerifyError("");
    setVerifyFeedback("");

    if (!fullName.trim() || !docNumber.trim()) {
      setVerifyError("Completa tu nombre legal y número de documento.");
      return;
    }

    const formData = new FormData();
    formData.append("real_full_name", fullName.trim());
    formData.append("document_number", docNumber.trim());
    if (docFile) formData.append("document_photo", docFile);
    if (selfieFile) formData.append("selfie_photo", selfieFile);

    try {
      await submitIdentityVerification(formData);
      setVerifyFeedback(
        "Solicitud de verificación enviada. Tus datos permanecen privados y tu perfil público sigue usando @" +
          nickname +
          "."
      );
      setFullName("");
      setDocNumber("");
      setDocFile(null);
      setSelfieFile(null);
    } catch (err) {
      setVerifyError(
        err?.message || "No se pudo enviar la verificación en este momento."
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-xs">
          <p className="text-lg font-extrabold text-stone-900">
            Inicia sesión para ver tu perfil y RePoints
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Consulta tus RePoints en #FFC639, tu progreso hacia ReLeader y tu historial de entregas.
          </p>
          <button
            type="button"
            onClick={() => onOpenAuthModal?.()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2D6A4F] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#245640]"
          >
            <LogIn className="h-4 w-4" />
            <span>Ingresar a ReUsa</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {/* Cabecera de Perfil con Nickname y RePoints (#FFC639) */}
      <section className="mb-6 rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2D6A4F] text-2xl font-extrabold text-white shadow-xs">
              {nickname.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
                  @{nickname}
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#2D6A4F] ring-1 ring-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Identidad verificada
                  </span>
                )}
                {isReLeader && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#2D6A4F] px-3 py-0.5 text-xs font-bold text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                    ReLeader
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Identidad pública protegida por Nickname · Tu nombre real nunca se muestra en la comunidad
              </p>
            </div>
          </div>

          {/* Tarjeta destacada de RePoints (#FFC639) */}
          <div
            className="flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xs"
            style={{
              backgroundColor: "#FFFBEB",
              borderColor: REPOINTS_COLOR,
            }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-stone-900 shadow-2xs"
              style={{ backgroundColor: REPOINTS_COLOR }}
            >
              <Award className="h-6 w-6 font-bold" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                Saldo RePoints
              </span>
              <p className="text-2xl font-black leading-none text-stone-900">
                {rePoints}
              </p>
            </div>
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className="mt-6 grid grid-cols-1 gap-3 border-t border-stone-100 pt-5 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#FAF9F6] p-4 ring-1 ring-stone-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">
                Donaciones completadas
              </span>
              <PackageCheck className="h-4 w-4 text-[#2D6A4F]" />
            </div>
            <p className="mt-1 text-xl font-extrabold text-stone-900">
              {donationsCount}
            </p>
          </div>

          <div className="rounded-2xl bg-[#FAF9F6] p-4 ring-1 ring-stone-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">
                Artículos recibidos
              </span>
              <CheckCircle2 className="h-4 w-4 text-[#2D6A4F]" />
            </div>
            <p className="mt-1 text-xl font-extrabold text-stone-900">
              {receivedCount}
            </p>
          </div>

          <div className="rounded-2xl bg-[#FAF9F6] p-4 ring-1 ring-stone-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">
                Reportes negativos
              </span>
              <AlertTriangle
                className={`h-4 w-4 ${
                  negativeReports === 0 ? "text-emerald-600" : "text-red-600"
                }`}
              />
            </div>
            <p className="mt-1 text-xl font-extrabold text-stone-900">
              {negativeReports}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Columna Izquierda: Progreso hacia ReLeader + Verificación de Identidad */}
        <div className="space-y-6 lg:col-span-5">
          {/* Progreso automático hacia ReLeader */}
          <section className="rounded-3xl border border-stone-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-stone-900">
                Camino a ReLeader
              </h2>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-[#2D6A4F]">
                {isReLeader ? "Activo" : `${donationsProgressPct}%`}
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              El ascenso a ReLeader es automático al cumplir las 3 condiciones para crear y editar eventos y artículos del blog:
            </p>

            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-[#2D6A4F] transition-all duration-300"
                style={{ width: `${isReLeader ? 100 : donationsProgressPct}%` }}
              />
            </div>

            <ul className="mt-4 space-y-2.5">
              {reLeaderChecklist.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-stone-100 bg-[#FAF9F6] px-3.5 py-2.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={`h-4 w-4 shrink-0 ${
                        item.met ? "text-[#2D6A4F]" : "text-stone-300"
                      }`}
                    />
                    <span className="font-bold text-stone-800">{item.label}</span>
                  </div>
                  <span
                    className={`font-semibold ${
                      item.met ? "text-[#2D6A4F]" : "text-stone-500"
                    }`}
                  >
                    {item.detail}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Verificación de Identidad Privada */}
          <section className="rounded-3xl border border-stone-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-[#2D6A4F]" />
              <h2 className="text-base font-extrabold text-stone-900">
                Verificación de Identidad
              </h2>
            </div>

            {isVerified ? (
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-[#2D6A4F]">
                <p className="font-bold">✓ Tu identidad está verificada</p>
                <p className="mt-1 text-stone-700">
                  Puedes publicar artículos, solicitar reservas, inspeccionar perfiles de interesados, usar el chat y sumarte a eventos.
                </p>
              </div>
            ) : (
              <form onSubmit={handleVerificationSubmit} className="mt-3 space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-amber-800">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Estado actual: <strong>{verificationStatus}</strong>
                  </span>
                </div>

                {verifyFeedback && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-[#2D6A4F]">
                    {verifyFeedback}
                  </div>
                )}

                {verifyError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    {verifyError}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-bold text-stone-700">
                    Nombre legal completo (privado) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Solo para validación interna"
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 py-2 text-xs focus:border-[#2D6A4F] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-stone-700">
                    Número de documento de identidad (privado) *
                  </label>
                  <input
                    type="text"
                    required
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="Ej. V-12345678"
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 py-2 text-xs focus:border-[#2D6A4F] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      Foto de documento
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                      className="w-full text-[11px] text-stone-600"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      Foto selfie de respaldo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                      className="w-full text-[11px] text-stone-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-xl bg-[#2D6A4F] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#245640] disabled:opacity-50"
                >
                  {authLoading ? "Enviando..." : "Enviar verificación privada"}
                </button>
              </form>
            )}
          </section>
        </div>

        {/* Columna Derecha: Historial de publicaciones ENTREGADO en modo lectura */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-3xl border border-stone-200/90 bg-white p-5 shadow-xs">
            <h2 className="text-base font-extrabold text-stone-900">
              Historial de entregas (ENTREGADO)
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Las publicaciones marcadas como ENTREGADO salen del feed principal y se conservan aquí en modo solo lectura.
            </p>

            {loadingHistory ? (
              <div className="mt-4 h-48 animate-pulse rounded-2xl bg-stone-100" />
            ) : historyItems.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-stone-200 bg-[#FAF9F6] p-6 text-center text-xs text-stone-500">
                Aún no tienes publicaciones en estado ENTREGADO en tu historial.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {historyItems.map((item) => (
                  <PublicationCard
                    key={item.id}
                    publication={{ ...item, status: "ENTREGADO" }}
                    readOnlyHistory={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}