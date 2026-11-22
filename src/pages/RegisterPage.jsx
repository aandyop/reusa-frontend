import { useState } from "react";
import {
  UserPlus,
  AtSign,
  Mail,
  Lock,
  MapPin,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";

const PRIMARY_GREEN = "#2d6a4f";
const SECONDARY_TERRACOTTA = "#E76F51";

const ZONES_VALERA = [
  "Centro de Valera · Trujillo",
  "Las Acacias · Valera",
  "La Beatriz · Valera",
  "El Country · Valera",
  "Campo Alegre · Valera",
];

export default function RegisterPage({
  onRegistered,
  onGoToLogin,
  onBackToFeed,
}) {
  const { updateUserState } = useAuth();

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [zoneName, setZoneName] = useState(ZONES_VALERA[0]);
  const [acceptTerms, setAcceptTerms] = useState(true);

  const [errorMsg, setErrorMsg] = useState("");
  const [infoNotice, setInfoNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cleanNickname = nickname.trim().replace(/^@+/, "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoNotice("");

    if (!cleanNickname || cleanNickname.length < 3) {
      setErrorMsg("El @nickname debe tener al menos 3 caracteres.");
      return;
    }

    if (!email.trim()) {
      setErrorMsg("Ingresa un correo electrónico válido.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    if (!acceptTerms) {
      setErrorMsg(
        "Debes aceptar las normas comunitarias y de privacidad de ReUsa."
      );
      return;
    }

    setSubmitting(true);

    const payload = {
      nickname: cleanNickname,
      email: email.trim(),
      password,
      approx_zone_name: zoneName,
    };

    try {
      const data = await authService.register(payload);
      const registeredUser = data?.user || {
        id: `usr-${Date.now()}`,
        nickname: cleanNickname,
        email: payload.email,
        role: "user",
        is_verified: false,
        verification_status: "unverified",
        re_points: 0,
        completed_donations_count: 0,
        completed_received_count: 0,
        negative_reports_count: 0,
        approx_zone_name: zoneName,
        approx_lat: 9.3188,
        approx_lng: -70.6042,
      };

      if (data?.token) {
        localStorage.setItem("reusa_token", data.token);
      }
      localStorage.setItem("reusa_user", JSON.stringify(registeredUser));
      updateUserState?.(registeredUser);
      onRegistered?.(registeredUser);
    } catch {
      const localUser = {
        id: `usr-${Date.now()}`,
        nickname: cleanNickname,
        email: payload.email,
        role: "user",
        is_verified: false,
        verification_status: "unverified",
        re_points: 0,
        completed_donations_count: 0,
        completed_received_count: 0,
        negative_reports_count: 0,
        approx_zone_name: zoneName,
        approx_lat: 9.3188,
        approx_lng: -70.6042,
      };

      localStorage.setItem("reusa_token", "local-session-token");
      localStorage.setItem("reusa_user", JSON.stringify(localUser));
      updateUserState?.(localUser);
      setInfoNotice(
        "No se pudo conectar con /auth/register; sesión iniciada en modo local para pruebas."
      );
      onRegistered?.(localUser);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <section
        aria-label="Registro de usuario"
        className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xs"
      >
        <div
          style={{ backgroundColor: PRIMARY_GREEN }}
          className="px-6 py-5 text-white"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <UserPlus className="h-5 w-5" />
              <h1 className="text-xl font-extrabold">Crear cuenta en ReUsa</h1>
            </div>
            <span
              style={{ backgroundColor: SECONDARY_TERRACOTTA }}
              className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-white"
            >
              Comunidad vecinal
            </span>
          </div>
          <p className="mt-1.5 text-xs text-emerald-50">
            Regístrate con tu @nickname y zona aproximada para donar, hacer
            trueques y coordinar entregas en tu comunidad.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          {infoNotice && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
              {infoNotice}
            </div>
          )}

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
              <AtSign
                style={{ color: PRIMARY_GREEN }}
                className="h-3.5 w-3.5"
              />
              <span>Nombre de usuario (@nickname) *</span>
            </label>
            <input
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ej. VecinoSostenible"
              className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
              <Mail style={{ color: PRIMARY_GREEN }} className="h-3.5 w-3.5" />
              <span>Correo electrónico *</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vecino@correo.com"
              className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
              <MapPin
                style={{ color: PRIMARY_GREEN }}
                className="h-3.5 w-3.5"
              />
              <span>Zona aproximada *</span>
            </label>
            <select
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
            >
              {ZONES_VALERA.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
                <Lock
                  style={{ color: PRIMARY_GREEN }}
                  className="h-3.5 w-3.5"
                />
                <span>Contraseña *</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
                <Lock
                  style={{ color: PRIMARY_GREEN }}
                  className="h-3.5 w-3.5"
                />
                <span>Confirmar contraseña *</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#2d6a4f] focus:outline-none"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-[#FAF9F6] p-3 text-xs text-stone-700 ring-1 ring-stone-200/80">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 accent-[#2d6a4f]"
            />
            <span className="inline-flex items-start gap-1">
              <CheckCircle2
                style={{ color: PRIMARY_GREEN }}
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
              />
              <span>
                Acepto coordinar donaciones y trueques de forma respetuosa y
                mantener ubicaciones aproximadas por seguridad.
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: PRIMARY_GREEN }}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <span>{submitting ? "Registrando..." : "Registrarme"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-4 text-xs text-stone-600">
            <div>
              <span>¿Ya tienes cuenta? </span>
              {onGoToLogin && (
                <button
                  type="button"
                  onClick={onGoToLogin}
                  className="font-extrabold text-[#2d6a4f] hover:underline"
                >
                  Iniciar sesión
                </button>
              )}
            </div>

            {onBackToFeed && (
              <button
                type="button"
                onClick={onBackToFeed}
                className="font-bold text-stone-500 hover:text-stone-800"
              >
                Volver al feed
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}