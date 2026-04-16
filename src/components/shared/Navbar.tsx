import { Link, NavLink } from "react-router-dom";
import { navbarLinks } from "../../constants/links";
import { HiOutlineSearch, HiOutlineShoppingBag } from "react-icons/hi";
import { FaBarsStaggered } from "react-icons/fa6";
import { Logo } from "./Logo";
import { useCart } from "../../hooks/useCart";

export const Navbar = () => {
  const { totalItems } = useCart();

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
        <button aria-label="Buscar">
          <HiOutlineSearch size={25} />
        </button>

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

