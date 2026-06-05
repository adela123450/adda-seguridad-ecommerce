import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseAdmin } from "../lib/supabase";

export const AdminLoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loggedEmail, setLoggedEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const validateAdminSession = async () => {
      const { data } = await supabaseAdmin.auth.getUser();
      const user = data.user;

      if (!user) {
        setLoggedEmail("");
        return;
      }

      const { data: profile, error } = await supabaseAdmin
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .maybeSingle();

      if (
        error ||
        !profile ||
        !profile.is_active ||
        !["super_admin", "admin", "editor"].includes(profile.role)
      ) {
        setLoggedEmail("");
        return;
      }

      setLoggedEmail(user.email ?? "");
    };

    validateAdminSession();
  }, []);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Credenciales incorrectas.");
      setLoading(false);
      return;
    }

    navigate("/admin/products", { replace: true });
  };

  const handleRecovery = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    if (error) {
      setError("No fue posible enviar el correo de recuperación.");
      setLoading(false);
      return;
    }

    setMessage("Revisa tu correo para restablecer la contraseña.");
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabaseAdmin.auth.signOut();
    setLoggedEmail("");
    setEmail("");
    setPassword("");
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2D5398]">
          ADDA Seguridad
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-800">
          Acceso administrador
        </h1>

        <p className="mt-2 text-slate-500">
          Panel privado para gestión del ecommerce.
        </p>

        {loggedEmail && (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-medium text-slate-700">Sesión activa:</p>

            <p className="mt-1 text-sm font-semibold text-[#2D5398]">
              {loggedEmail}
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => navigate("/admin/products")}
                className="rounded-xl bg-[#2D5398] px-4 py-2 text-sm font-semibold text-white"
              >
                Ir al panel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        )}

        {!loggedEmail && (
          <form
            onSubmit={isRecoveryMode ? handleRecovery : handleLogin}
            className="mt-6 space-y-4"
          >
            <input
              type="email"
              required
              placeholder="Correo administrador"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#2D5398]"
            />

            {!isRecoveryMode && (
              <input
                type="password"
                required
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#2D5398]"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#2D5398] py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading
                ? "Procesando..."
                : isRecoveryMode
                  ? "Enviar recuperación"
                  : "Ingresar"}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRecoveryMode(!isRecoveryMode);
                setError("");
                setMessage("");
              }}
              className="w-full text-sm font-semibold text-[#2D5398]"
            >
              {isRecoveryMode
                ? "Volver al inicio de sesión"
                : "¿Olvidaste tu contraseña?"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
