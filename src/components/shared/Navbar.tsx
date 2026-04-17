import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { navbarLinks } from "../../constants/links";
import {
  HiOutlineSearch,
  HiOutlineShoppingBag,
  HiOutlineHeart,
} from "react-icons/hi";
import { FaBarsStaggered } from "react-icons/fa6";
import { Logo } from "./Logo";
import { useCart } from "../../hooks/useCart";
import { useFavorites } from "../../hooks/useFavorites";

export const Navbar = () => {
  const { totalItems } = useCart();
  const { totalFavorites } = useFavorites();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    const query = searchTerm.trim();

    if (!query) {
      navigate("/Equipos de seguridad");
      return;
    }

    navigate(
      `/Equipos de seguridad?q=${encodeURIComponent(query)}`
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 text-black lg:px-12">
      <Logo />

      <nav className="hidden space-x-5 md:flex">
        {navbarLinks.map((link) => (
          <NavLink
            key={link.id}
            to={link.href}
            className={({ isActive }) =>
              `${
                isActive ? "underline" : ""
              } font-medium transition-all duration-300 hover:text-cyan-600 hover:underline`
            }
          >
            {link.title}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-5">
        <form onSubmit={handleSubmit} className="hidden items-center gap-2 md:flex">
          <div className="flex items-center rounded-xl border border-slate-300 px-3 py-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar equipos..."
              className="w-[180px] bg-transparent text-sm outline-none lg:w-[220px]"
            />
            <button type="submit" aria-label="Buscar">
              <HiOutlineSearch size={22} />
            </button>
          </div>
        </form>

        <Link
          to="/favoritos"
          className="relative"
          aria-label="Ir a favoritos"
        >
          <span className="absolute -bottom-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-black text-xs text-white">
            {totalFavorites}
          </span>
          <HiOutlineHeart size={25} />
        </Link>

        <div className="relative">
          <Link
            to="/account"
            className="grid h-9 w-9 place-items-center rounded-full border-2 border-slate-700 text-lg font-bold"
          >
            R
          </Link>
        </div>

        <Link to="/carrito" className="relative" aria-label="Ir al carrito">
          <span className="absolute -bottom-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-black text-xs text-white">
            {totalItems}
          </span>
          <HiOutlineShoppingBag size={25} />
        </Link>
      </div>

      <button className="md:hidden" aria-label="Abrir menú">
        <FaBarsStaggered size={25} />
      </button>
    </header>
  );
};