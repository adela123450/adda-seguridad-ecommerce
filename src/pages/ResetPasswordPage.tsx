import { useState } from "react";
import { Link } from "react-router-dom";
import { FiCheckCircle, FiLock, FiAlertTriangle, FiEye, FiEyeOff } from "react-icons/fi";
import { supabasePublic } from "../lib/supabase";

export const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabasePublic.auth.updateUser({
        password,
      });

      if (error) {
        setError(
          "No fue posible actualizar la contraseña. Verifica que el enlace siga vigente.",
        );
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setMessage("Contraseña actualizada correctamente. Ya puedes iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-xl rounded-3xl border border-blue-100 bg-white p-8 shadow-[0_20px_60px_rgba(45,83,152,0.12)]">
        <div className="mb-7 flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#2D5398]">
            <FiLock className="h-7 w-7" />
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#2D5398]">
              ADDA Seguridad
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Restablecer contraseña
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ingresa una nueva contraseña para recuperar el acceso a tu cuenta.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-5 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Nueva contraseña
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Escribe tu nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-[#2D5398] focus:ring-4 focus:ring-blue-100"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#2D5398]"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Confirmar contraseña
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirma tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-[#2D5398] focus:ring-4 focus:ring-blue-100"
                required
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={
                  showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#2D5398]"
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-[#243C78] via-[#2D5398] to-[#3F61B3] px-5 py-3.5 text-sm font-bold text-white shadow-[0_16px_35px_rgba(45,83,152,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Actualizando contraseña..." : "Actualizar contraseña"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/account"
            className="text-sm font-semibold text-[#2D5398] transition hover:text-[#243C78]"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </section>
    </main>
  );
};
