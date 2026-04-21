import { Link } from "react-router-dom";
import {
  FiHeart,
  FiShoppingBag,
  FiTool,
  FiCamera,
  FiUser,
  FiClock,
} from "react-icons/fi";

export const AccountPage = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:py-12">
      {/* HERO PREMIUM */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] shadow-xl">
        <div className="relative px-6 py-12 md:px-8 md:py-14">
          <div className="absolute -right-16 top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute left-8 bottom-0 h-32 w-32 rounded-full bg-blue-200/10 blur-3xl" />

          <div className="relative">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-50">
              Mi cuenta
            </span>

            <h1 className="mt-4 max-w-4xl text-2xl font-bold text-white md:text-4xl">
              Tu espacio de acceso rápido en ADDA Seguridad
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-blue-100 md:text-lg md:leading-8">
              Desde aquí podrás acceder fácilmente a tus productos favoritos,
              carrito, soporte técnico e información comercial de nuestros
              servicios. Más adelante esta sección podrá incluir pedidos,
              historial y acceso de cliente.
            </p>
          </div>
        </div>
      </div>

      {/* ACCESOS RÁPIDOS */}
      <div className="mt-10">
        <h2 className="border-l-4 border-[#2D5398] pl-4 text-2xl font-bold text-slate-800">
          Accesos rápidos
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Link
            to="/favoritos"
            className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 via-white to-slate-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-600">
              <FiHeart className="text-2xl" />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-800">
              Mis favoritos
            </h3>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              Consulta los productos que has marcado para revisar después o
              comparar con más calma.
            </p>
          </Link>

          <Link
            to="/carrito"
            className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2D5398]/10 text-[#2D5398]">
              <FiShoppingBag className="text-2xl" />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-800">
              Mi carrito
            </h3>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              Revisa los equipos seleccionados y continúa con tu proceso de
              compra o cotización.
            </p>
          </Link>

          <Link
            to="/Nosotros#soporte"
            className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-slate-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700">
              <FiTool className="text-2xl" />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-800">
              Soporte técnico
            </h3>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              Accede a la información de soporte y acompañamiento sobre
              productos, configuración y atención postventa.
            </p>
          </Link>

          <Link
            to="/Nosotros#instalacion"
            className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-700">
              <FiCamera className="text-2xl" />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-800">
              Instalación CCTV
            </h3>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              Conoce más sobre nuestro servicio de instalación profesional y el
              proceso de revisión técnica inicial.
            </p>
          </Link>
        </div>
      </div>

      {/* PRÓXIMAMENTE */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2D5398]/10 text-[#2D5398]">
              <FiUser className="text-xl" />
            </div>

            <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
              Acceso de cliente
            </h2>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
            Próximamente esta sección podrá incluir inicio de sesión, gestión de
            perfil, seguimiento de pedidos y acceso a información personalizada
            del cliente.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-7 shadow-sm transition duration-300 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-700">
              <FiClock className="text-xl" />
            </div>

            <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
              Historial y seguimiento
            </h2>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
            Más adelante podrás consultar compras, solicitudes, soporte y
            procesos asociados a tus pedidos desde un entorno más completo y
            organizado.
          </p>
        </div>
      </div>

      {/* CTA FINAL */}
      <div className="mt-8 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e3a8a] px-8 py-10 text-center text-white shadow-md">
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
          className="mt-6 inline-flex rounded-xl bg-[#2D5398] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#234684]"
        >
          Solicitar ayuda por WhatsApp
        </a>
      </div>
    </section>
  );
};