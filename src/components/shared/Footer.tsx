import { BiChevronRight } from "react-icons/bi";
import { Link } from "react-router-dom";
import { socialLinks } from "../../constants/links";

export const Footer = () => {
  return (
    <footer className="mt-10 flex flex-wrap justify-between gap-10 bg-gray-950 px-12 py-16 text-sm text-slate-200 md:flex-nowrap">
      <Link to="/" className="flex flex-1 items-center">
        <img
          src="/brands/logo-adda.jpg"
          alt="ADDA Seguridad"
          className="h-10 object-contain sm:h-18 md:h-22 lg:h-26"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-4">
        <p className="font-semibold uppercase tracking-tighter">Suscríbete</p>
        <p className="text-xs font-medium">
          Recibe las últimas noticias y ofertas
        </p>
        <div className="flex items-center gap-2 rounded-full border border-gray-800 px-3 py-3">
          <input
            type="email"
            placeholder="Tu correo electrónico"
            className="w-full bg-gray-950 pl-2 text-slate-200 focus:outline-none"
          />
          <button className="text-slate-200 transition-colors hover:text-white">
            <BiChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <p className="font-semibold uppercase tracking-tighter">Políticas</p>
        <nav className="flex flex-col gap-2 text-xs font-medium">
          <Link to="/equipos">Productos</Link>
          <Link to="#" className="text-slate-300 hover:text-white">
            Política de Privacidad
          </Link>
          <Link to="#" className="text-slate-300 hover:text-white">
            Términos de Servicio
          </Link>
          <Link to="#" className="text-slate-300 hover:text-white">
            Devoluciones
          </Link>
        </nav>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <p className="font-semibold uppercase tracking-tighter">Síguenos</p>
        <p className="text-xs leading-6">
          No te pierdas las novedades que ADDA seguridad tiene para ti...
        </p>

        <div className="flex">
          {socialLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="flex h-full w-full items-center justify-center py-3.5 text-slate-300 transition-all hover:bg-white hover:text-950"
            >
              <link.icon />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};