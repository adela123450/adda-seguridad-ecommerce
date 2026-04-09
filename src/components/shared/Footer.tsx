import { BiChevronRight } from "react-icons/bi";
import { Link } from "react-router-dom";
import { socialLinks } from "../../constants/links";

export const Footer = () => {
  return (
    <footer className="py-16 bg-gray-950 px-12 flex justify-between gap-10 text-slate-200 text-sm flex-wrap mt-10 md:flex-nowrap">
      <Link
        to="/"
        className="flex-1 flex items-center"
      >
        <img
          src="/brands/logo-dos-adda.jpg"
          alt="ADDA Seguridad"
          className="h-10 sm:h-18 md:h-22 lg:h-26 object-contain"
      />
      </Link>

      <div className="flex flex-col gap-4 flex-1">
        <p className="font-semibold uppercase tracking-tighter">
          Suscríbete
        </p>
        <p className="text-xs font-medium">
          Recibe las últimas noticias y ofertas
        </p>
        <div className="border border-gray-800 flex items-center gap-2 px-3 py-3 rounded-full">
          <input
            type="email"
            placeholder="Tu correo electrónico"
            className="pl-2 bg-gray-950 text-slate-200 w-full focus:outline-none"
          />
          <button className="text-slate-200 hover:text-white transition-colors">
            <BiChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        <p className="font-semibold uppercase tracking-tighter">
          Políticas
        </p>
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

      <div className="flex flex-col gap-4 flex-1">
        <p className="font-semibold uppercase tracking-tighter">
          Síguenos
        </p>
        <p className="text-xs leading-6">
          No te pierdas las novedades que ADDA seguridad tiene para ti...
        </p>

        <div className="flex">
          {socialLinks.map(link => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="text-slate-300 border-gray-800 w-full h-full py-3.5 flex items-center justify-center transition-all hover:bg-white hover:text-950"
            >
              <link.icon />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};
