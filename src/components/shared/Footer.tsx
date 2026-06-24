import { Link } from "react-router-dom";
import { socialLinks } from "../../constants/links";

export const Footer = () => {
  return (
    <footer className="mt-10 bg-black text-sm text-slate-200">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 py-6 md:grid-cols-[0.7fr_1.3fr_1fr_1fr] md:px-12">
        {/* LOGO */}
        <div className="flex items-center justify-center">
          <Link to="/" className="inline-flex">
            <img
              src="/brands/logo-adda.jpg"
              alt="ADDA Seguridad S.A.S."
              className="h-18 object-contain"
            />
          </Link>
        </div>

        {/* DESCRIPCIÓN */}
        <div className="flex items-center justify-center text-center md:justify-start md:text-left">
          <p className="max-w-sm text-xs leading-7 text-slate-400">
            Soluciones en seguridad electrónica, videovigilancia CCTV,
            instalación profesional y soporte técnico especializado.
          </p>
        </div>

        {/* POLÍTICAS */}
        <div className="flex flex-col gap-3 text-center md:text-left">
          <p className="font-semibold uppercase tracking-tighter text-white">
            Políticas
          </p>

          <nav className="flex flex-col gap-2 text-xs font-medium">
            <Link
              to="/Equipos de seguridad"
              className="text-slate-300 transition hover:text-white"
            >
              Productos
            </Link>

            <Link
              to="/politica-privacidad"
              className="text-slate-300 transition hover:text-white"
            >
              Política de Privacidad
            </Link>

            <Link
              to="/terminos"
              className="text-slate-300 transition hover:text-white"
            >
              Términos de Servicio
            </Link>

            <Link
              to="/devoluciones"
              className="text-slate-300 transition hover:text-white"
            >
              Devoluciones
            </Link>
          </nav>
        </div>

        {/* REDES */}
        <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
          <p className="font-semibold uppercase tracking-tighter text-white">
            Síguenos
          </p>

          <p className="text-xs leading-6 text-slate-400">
            Conoce nuestras novedades y contenidos sobre seguridad electrónica.
          </p>

          <div className="flex gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-base text-white transition hover:bg-blue-700"
              >
                <link.icon />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="border-t border-white/5 py-3 text-center text-xs text-slate-600">
        ADDA Seguridad S.A.S. · Todos los derechos reservados.
      </div>
    </footer>
  );
};