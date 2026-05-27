import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertTriangle,
  FiCamera,
  FiCheckCircle,
  FiClock,
  FiHeart,
  FiLock,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShield,
  FiShoppingBag,
  FiTool,
  FiUser,
} from "react-icons/fi";
import { supabase } from "../lib/supabase";

type Customer = {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  address: string | null;
  is_active: boolean;
};

type AuthInputProps = {
  icon: ReactNode;
  type: string;
  required?: boolean;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

const AuthInput = ({
  icon,
  type,
  required = false,
  placeholder,
  value,
  onChange,
}: AuthInputProps) => {
  return (
    <div className="group relative">
      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#2D5398]">
        {icon}
      </div>

      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white/90 px-11 py-3.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition duration-300 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#2D5398] focus:bg-white focus:shadow-[0_0_0_4px_rgba(45,83,152,0.12)]"
      />
    </div>
  );
};

type AuthMessageProps = {
  type: "success" | "error";
  children: ReactNode;
};

const AuthMessage = ({ type, children }: AuthMessageProps) => {
  const isError = type === "error";

  return (
    <div
      className={`mt-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      <span className="mt-0.5">
        {isError ? <FiAlertTriangle /> : <FiCheckCircle />}
      </span>
      <span>{children}</span>
    </div>
  );
};

type FeatureItemProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

const FeatureItem = ({ icon, title, description }: FeatureItemProps) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-blue-100">{description}</p>
        </div>
      </div>
    </div>
  );
};

type QuickAccessCardProps = {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
  tone: string;
};

const QuickAccessCard = ({
  to,
  icon,
  title,
  description,
  tone,
}: QuickAccessCardProps) => {
  return (
    <Link
      to={to}
      className={`group rounded-3xl border bg-gradient-to-br p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${tone}`}
    >
      <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white text-xl shadow-sm transition duration-300 group-hover:scale-105">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>

      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
    </Link>
  );
};

export const AccountPage = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");

  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const resetMessages = () => {
    setError("");
    setMessage("");
  };

  const loadCustomer = async () => {
    setLoadingSession(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      setCustomer(null);
      setLoadingSession(false);
      return;
    }

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      setCustomer(null);
      setLoadingSession(false);
      return;
    }

    setCustomer(data);
    setLoadingSession(false);
  };

  useEffect(() => {
    loadCustomer();
  }, []);

  const getRegisterErrorMessage = (supabaseMessage: string) => {
    if (supabaseMessage === "User already registered") {
      return "Este correo ya está registrado. Intenta iniciar sesión o usa la opción de recuperación de contraseña.";
    }

    if (supabaseMessage === "email rate limit exceeded") {
      return "Se alcanzó el límite temporal de correos de verificación. Intenta nuevamente en unos minutos.";
    }

    return "No fue posible crear la cuenta. Verifica los datos e intenta nuevamente.";
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingForm(true);
    resetMessages();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(
        "No fue posible iniciar sesión. Verifica tu correo y contraseña.",
      );
      setLoadingForm(false);
      return;
    }

    setPassword("");
    setMessage("Sesión iniciada correctamente.");
    setLoadingForm(false);
    await loadCustomer();
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingForm(true);
    resetMessages();

    if (password.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres.");
      setLoadingForm(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(getRegisterErrorMessage(error.message));
      setLoadingForm(false);
      return;
    }

    if (!data.user || data.user.identities?.length === 0) {
      setError(
        "Este correo ya está registrado. Intenta iniciar sesión o usa la opción de recuperación de contraseña.",
      );
      setLoadingForm(false);
      return;
    }

    const customerUpdate = await supabase.from("customers").upsert(
      {
        auth_user_id: data.user.id,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        is_active: true,
      },
      {
        onConflict: "auth_user_id",
      },
    );

    if (customerUpdate.error) {
      setError(
        "La cuenta fue creada, pero no se pudieron completar algunos datos del perfil.",
      );
      setLoadingForm(false);
      return;
    }

    setPassword("");
    setMessage(
      "Cuenta creada correctamente. Revisa tu correo electrónico para verificar tu cuenta. Si no aparece en la bandeja principal, revisa spam o promociones.",
    );
    setLoadingForm(false);
    await loadCustomer();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();

    setCustomer(null);
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setCity("");
    setMessage("Sesión cerrada correctamente.");
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:py-12">
      <div className="overflow-hidden rounded-3xl shadow-xl">
        <div
          className="relative min-h-[320px] bg-cover bg-center md:min-h-[360px]"
          style={{
            backgroundImage: "url('/images/heroes/account-hero.webp')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#101935]/88 via-[#243C78]/55 to-transparent" />

          <div className="relative flex min-h-[320px] items-center px-6 py-8 md:min-h-[360px] md:px-8 md:py-10">
            <div className="max-w-4xl">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-50 backdrop-blur">
                Mi cuenta
              </span>

              <h1 className="mt-4 max-w-4xl text-2xl font-bold text-white md:text-4xl">
                Plataforma de acceso ADDA Seguridad
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-blue-100 md:text-lg md:leading-8">
                Gestiona tus compras, favoritos, soporte técnico y futuras
                cotizaciones desde un entorno seguro, moderno y profesional.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  "Seguridad empresarial",
                  "Historial inteligente",
                  "Soporte especializado",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-blue-50 backdrop-blur"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
        <div className="grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="relative overflow-hidden bg-gradient-to-br from-[#101935] via-[#1E3A72] to-[#2D5398] p-7 text-white md:p-9">
            <div className="absolute -right-16 top-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 left-10 h-52 w-52 rounded-full bg-cyan-300/10 blur-3xl" />

            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-2xl shadow-lg backdrop-blur">
                <FiShield />
              </div>

              <h2 className="mt-6 text-2xl font-bold md:text-3xl">
                Seguridad y tecnología profesional
              </h2>

              <p className="mt-4 text-sm leading-7 text-blue-100 md:text-base">
                Un portal diseñado para clientes que necesitan soluciones de
                CCTV, intrusión, soporte técnico y compras especializadas.
              </p>

              <div className="mt-7 grid gap-4">
                <FeatureItem
                  icon={<FiShoppingBag />}
                  title="Compras rápidas"
                  description="Acceso ágil al carrito y productos seleccionados."
                />

                <FeatureItem
                  icon={<FiHeart />}
                  title="Favoritos técnicos"
                  description="Guarda equipos para revisarlos o cotizarlos después."
                />

                <FeatureItem
                  icon={<FiCamera />}
                  title="Instalación CCTV"
                  description="Conecta la compra con servicios profesionales."
                />
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center backdrop-blur-sm">
                  <p className="text-lg font-bold">24/7</p>
                  <p className="mt-1 text-[11px] text-blue-100">Acceso web</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center backdrop-blur-sm">
                  <p className="text-lg font-bold">CCTV</p>
                  <p className="mt-1 text-[11px] text-blue-100">Soluciones</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center backdrop-blur-sm">
                  <p className="text-lg font-bold">ERP</p>
                  <p className="mt-1 text-[11px] text-blue-100">Escalable</p>
                </div>
              </div>
            </div>
          </aside>

          <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50/50 p-6 md:p-9">
            <div className="mx-auto max-w-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2D5398]/10 text-[#2D5398]">
                  <FiUser className="text-xl" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Acceso de cliente
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Opcional. Puedes comprar sin iniciar sesión.
                  </p>
                </div>
              </div>

              {loadingSession ? (
                <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm">
                  Validando sesión...
                </div>
              ) : customer ? (
                <div className="mt-7 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                  <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    Sesión activa
                  </div>

                  <h3 className="mt-4 text-2xl font-bold text-slate-900">
                    {customer.full_name || "Cliente ADDA"}
                  </h3>

                  <p className="mt-1 text-sm font-medium text-[#2D5398]">
                    {customer.email}
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Link
                      to="/favoritos"
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
                    >
                      Ver favoritos
                    </Link>

                    <Link
                      to="/carrito"
                      className="rounded-2xl bg-[#2D5398] px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#234684] hover:shadow-md"
                    >
                      Ir al carrito
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    <FiLogOut />
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-7 grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-1 shadow-inner">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        resetMessages();
                      }}
                      className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                        mode === "login"
                          ? "bg-white text-[#2D5398] shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Iniciar sesión
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        resetMessages();
                      }}
                      className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                        mode === "register"
                          ? "bg-white text-[#2D5398] shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Crear cuenta
                    </button>
                  </div>

                  {error && <AuthMessage type="error">{error}</AuthMessage>}
                  {message && (
                    <AuthMessage type="success">{message}</AuthMessage>
                  )}

                  <form
                    onSubmit={mode === "login" ? handleLogin : handleRegister}
                    className="mt-6 space-y-4"
                  >
                    {mode === "register" && (
                      <>
                        <AuthInput
                          icon={<FiUser />}
                          type="text"
                          required
                          placeholder="Nombre completo"
                          value={fullName}
                          onChange={setFullName}
                        />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <AuthInput
                            icon={<FiPhone />}
                            type="tel"
                            placeholder="Celular / WhatsApp"
                            value={phone}
                            onChange={setPhone}
                          />

                          <AuthInput
                            icon={<FiMapPin />}
                            type="text"
                            placeholder="Ciudad"
                            value={city}
                            onChange={setCity}
                          />
                        </div>
                      </>
                    )}

                    <AuthInput
                      icon={<FiMail />}
                      type="email"
                      required
                      placeholder="Correo electrónico"
                      value={email}
                      onChange={setEmail}
                    />

                    <AuthInput
                      icon={<FiLock />}
                      type="password"
                      required
                      placeholder="Contraseña"
                      value={password}
                      onChange={setPassword}
                    />

                    <button
                      type="submit"
                      disabled={loadingForm}
                      className="group relative mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#243C78] via-[#2D5398] to-[#3F61B3] px-5 py-3.5 text-sm font-bold text-white shadow-[0_16px_35px_rgba(45,83,152,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(45,83,152,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span className="relative z-10">
                        {loadingForm
                          ? "Procesando..."
                          : mode === "login"
                            ? "Ingresar a mi cuenta"
                            : "Crear cuenta cliente"}
                      </span>
                    </button>

                    <p className="text-center text-xs leading-5 text-slate-500">
                      Tu cuenta es opcional. ADDA Seguridad mantiene la compra
                      libre para mejorar la experiencia del cliente.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="border-l-4 border-[#2D5398] pl-4 text-2xl font-bold text-slate-900">
          Accesos rápidos
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <QuickAccessCard
            to="/favoritos"
            icon={<FiHeart className="text-pink-600" />}
            title="Mis favoritos"
            description="Consulta los productos guardados para revisar, comprar o cotizar después."
            tone="border-pink-100 from-pink-50 via-white to-slate-50"
          />

          <QuickAccessCard
            to="/carrito"
            icon={<FiShoppingBag className="text-[#2D5398]" />}
            title="Mi carrito"
            description="Revisa los equipos seleccionados y continúa tu compra de forma rápida."
            tone="border-blue-100 from-blue-50 via-white to-slate-50"
          />

          <QuickAccessCard
            to="/Nosotros#soporte"
            icon={<FiTool className="text-cyan-700" />}
            title="Soporte técnico"
            description="Accede a información de soporte, mantenimiento y acompañamiento técnico."
            tone="border-cyan-100 from-cyan-50 via-white to-slate-50"
          />

          <QuickAccessCard
            to="/Nosotros#instalacion"
            icon={<FiCamera className="text-indigo-700" />}
            title="Instalación CCTV"
            description="Conoce nuestro servicio de instalación profesional de cámaras de seguridad."
            tone="border-indigo-100 from-indigo-50 via-white to-slate-50"
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2D5398]/10 text-[#2D5398]">
              <FiUser className="text-xl" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 md:text-2xl">
              Perfil de cliente
            </h2>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
            Esta sección será la base para gestionar datos del cliente, pedidos,
            garantías y atención postventa sin afectar el proceso de compra
            libre.
          </p>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-700">
              <FiClock className="text-xl" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 md:text-2xl">
              Historial y seguimiento
            </h2>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
            Más adelante podrás consultar compras, solicitudes, soporte y
            procesos asociados a tus pedidos desde un entorno más completo.
          </p>
        </div>
      </div>

      <div className="relative mt-8 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#101935] to-[#2D5398] px-8 py-10 text-center text-white shadow-xl">
        <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-blue-300/10 blur-3xl" />

        <div className="relative">
          <h2 className="text-2xl font-bold md:text-3xl">
            ¿Necesitas ayuda con un producto o una cotización?
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Nuestro equipo puede orientarte en selección de equipos, soporte
            técnico e instalación profesional.
          </p>

          <a
            href="https://wa.me/573015068866?text=Hola,%20quiero%20más%20información%20sobre%20mi%20cuenta%20y%20los%20servicios%20de%20ADDA%20Seguridad%20S.A.S."
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex rounded-2xl bg-white px-6 py-3 text-sm font-bold text-[#2D5398] shadow-md transition hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-lg"
          >
            Solicitar ayuda por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};
