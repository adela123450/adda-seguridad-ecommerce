import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { navbarLinks } from "../../constants/links";
import {
  HiOutlineSearch,
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiOutlineUser,
} from "react-icons/hi";
import { HiOutlineMenuAlt3 } from "react-icons/hi";
import { Logo } from "./Logo";
import { useCart } from "../../hooks/useCart";
import { useFavorites } from "../../hooks/useFavorites";

export const Navbar = () => {
  const { totalItems } = useCart();
  const { totalFavorites } = useFavorites();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearch = () => {
    const query = searchTerm.trim();

    if (!query) {
      navigate("/Equipos de seguridad");
      return;
    }

    navigate(`/Equipos de seguridad?q=${encodeURIComponent(query)}`);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch();
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 text-[#111827] shadow-sm backdrop-blur-md">
        {/* DESKTOP */}
        <div className="hidden items-center justify-between px-5 py-4 md:flex lg:px-12">
          <Logo />

          <nav className="flex items-center space-x-7">
            {navbarLinks.map((link) => (
              <NavLink
                key={link.id}
                to={link.href}
                className={({ isActive }) =>
                  `relative font-medium transition-all duration-300 ${
                    isActive
                      ? "text-[#2D5398]"
                      : "text-slate-700 hover:text-[#2D5398]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.title}
                    <span
                      className={`absolute -bottom-1 left-0 h-[2px] rounded-full bg-[#2D5398] transition-all duration-300 ${
                        isActive ? "w-full" : "w-0"
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <div className="flex items-center rounded-xl border border-blue-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-[#2D5398]">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar equipos..."
                  className="w-[180px] bg-transparent text-sm outline-none lg:w-[220px]"
                />

                <button
                  type="submit"
                  aria-label="Buscar"
                  className="text-slate-600 transition hover:text-[#2D5398]"
                >
                  <HiOutlineSearch size={22} />
                </button>
              </div>
            </form>

            <Link
              to="/favoritos"
              className="relative text-slate-700 transition hover:text-[#2D5398]"
              aria-label="Ir a favoritos"
            >
              <span className="absolute -bottom-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-[#2D5398] text-xs text-white">
                {totalFavorites}
              </span>
              <HiOutlineHeart size={25} />
            </Link>

            <Link
              to="/account"
              className="grid h-9 w-9 place-items-center rounded-full border-2 border-slate-700 text-slate-700 transition-all duration-300 hover:border-[#2D5398] hover:text-[#2D5398]"
              aria-label="Mi cuenta"
            >
              <HiOutlineUser size={22} />
            </Link>

            <Link
              to="/carrito"
              className="relative text-slate-700 transition hover:text-[#2D5398]"
              aria-label="Ir al carrito"
            >
              <span className="absolute -bottom-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-[#2D5398] text-xs text-white">
                {totalItems}
              </span>
              <HiOutlineShoppingBag size={25} />
            </Link>
          </div>
        </div>

        {/* MOBILE - 3 BLOQUES */}
        <div className="grid grid-cols-[88px_1fr_48px] items-center gap-2 px-4 py-3 md:hidden">
          {/* IZQUIERDA: LOGO */}
          <div className="flex items-center justify-start overflow-hidden">
            <Logo compact />
          </div>

          {/* CENTRO: ICONOS */}
          <div className="flex items-center justify-center gap-5">
            <Link
              to="/favoritos"
              className="relative text-slate-700 transition hover:text-[#2D5398]"
              aria-label="Ir a favoritos"
            >
              <span className="absolute -bottom-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-[#2D5398] text-xs text-white">
                {totalFavorites}
              </span>
              <HiOutlineHeart size={24} />
            </Link>

            <Link
              to="/account"
              className="grid h-9 w-9 place-items-center rounded-full border-2 border-slate-700 text-slate-700 transition-all duration-300 hover:border-[#2D5398] hover:text-[#2D5398]"
              aria-label="Mi cuenta"
            >
              <HiOutlineUser size={21} />
            </Link>

            <Link
              to="/carrito"
              className="relative text-slate-700 transition hover:text-[#2D5398]"
              aria-label="Ir al carrito"
            >
              <span className="absolute -bottom-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-[#2D5398] text-xs text-white">
                {totalItems}
              </span>
              <HiOutlineShoppingBag size={24} />
            </Link>
          </div>

          {/* DERECHA: HAMBURGUESA */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="grid h-9 w-9 place-items-center text-slate-700 transition hover:text-[#2D5398]"
              aria-label="Abrir menú"
            >
              <HiOutlineMenuAlt3 size={26} />
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={closeMenu}
          />

          <div className="fixed top-0 right-0 z-50 flex h-full w-[85%] max-w-[360px] flex-col bg-white shadow-2xl md:hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-[#111827]">Menú</h2>

              <button
                type="button"
                onClick={closeMenu}
                className="grid h-9 w-9 place-items-center text-2xl text-slate-700 transition hover:text-[#2D5398]"
                aria-label="Cerrar menú"
              >
                ×
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto px-5 py-5">
              <nav className="flex flex-col gap-4">
                <NavLink
                  to="/"
                  onClick={closeMenu}
                  className="border-b border-slate-100 pb-3 text-base font-medium text-slate-700 hover:text-[#2D5398]"
                >
                  Inicio
                </NavLink>

                <NavLink
                  to="/Equipos de seguridad"
                  onClick={closeMenu}
                  className="border-b border-slate-100 pb-3 text-base font-medium text-slate-700 hover:text-[#2D5398]"
                >
                  Equipos
                </NavLink>

                <NavLink
                  to="/favoritos"
                  onClick={closeMenu}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 text-base font-medium text-slate-700 hover:text-[#2D5398]"
                >
                  <span>Favoritos</span>
                  <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-[#2D5398] px-1 text-xs text-white">
                    {totalFavorites}
                  </span>
                </NavLink>

                <NavLink
                  to="/carrito"
                  onClick={closeMenu}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 text-base font-medium text-slate-700 hover:text-[#2D5398]"
                >
                  <span>Carrito</span>
                  <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-[#2D5398] px-1 text-xs text-white">
                    {totalItems}
                  </span>
                </NavLink>
              </nav>

              <div className="my-6 border-t border-slate-200" />

              <nav className="flex flex-col gap-4">
                <NavLink
                  to="/instalacion-cctv"
                  onClick={closeMenu}
                  className="border-b border-slate-100 pb-3 text-base font-medium text-slate-700 hover:text-[#2D5398]"
                >
                  Instalación CCTV
                </NavLink>

                <NavLink
                  to="/soporte-tecnico"
                  onClick={closeMenu}
                  className="border-b border-slate-100 pb-3 text-base font-medium text-slate-700 hover:text-[#2D5398]"
                >
                  Soporte técnico
                </NavLink>

                <NavLink
                  to="/nosotros"
                  onClick={closeMenu}
                  className="border-b border-slate-100 pb-3 text-base font-medium text-slate-700 hover:text-[#2D5398]"
                >
                  Nosotros
                </NavLink>

                <NavLink
                  to="/account"
                  onClick={closeMenu}
                  className="border-b border-slate-100 pb-3 text-base font-medium text-slate-700 hover:text-[#2D5398]"
                >
                  Mi cuenta
                </NavLink>
              </nav>

              <div className="mt-auto pt-8">
                <a
                  href="https://wa.me/573015068866?text=Hola,%20quiero%20cotizar%20un%20equipo%20de%20seguridad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl bg-[#2D5398] px-4 py-3 text-center font-semibold text-white transition hover:bg-[#234684]"
                >
                  Cotizar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};