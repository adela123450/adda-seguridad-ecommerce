import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
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
import { supabasePublic } from "../../lib/supabase";

type CustomerNavbarData = {
  full_name: string | null;
};

const getFirstName = (fullName?: string | null) => {
  if (
    fullName &&
    fullName.trim() &&
    fullName.trim().toLowerCase() !== "null"
  ) {
    return fullName.trim().split(" ")[0];
  }

  return "";
};

export const Navbar = () => {
  const { totalItems } = useCart();
  const { totalFavorites } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    const isCatalogPage = location.pathname === "/Equipos de seguridad";

    if (!isCatalogPage) {
      setSearchTerm("");
    }
  }, [location.pathname]);

  useEffect(() => {
    const loadCustomerName = async () => {
      const { data: sessionData } = await supabasePublic.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        setCustomerName("");
        return;
      }

      const { data, error } = await supabasePublic
        .from("customers")
        .select("full_name")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        setCustomerName("");
        return;
      }

      const customer = data as CustomerNavbarData;

      setCustomerName(getFirstName(customer.full_name));
    };

    loadCustomerName();

    const { data: authListener } =
      supabasePublic.auth.onAuthStateChange(() => {
        loadCustomerName();
      });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
              className={`flex items-center gap-2 rounded-full border-2 px-3 py-2 text-sm font-semibold transition-all duration-300 ${
                customerName
                  ? "border-[#2D5398] bg-[#2D5398]/10 text-[#2D5398]"
                  : "border-slate-700 text-slate-700 hover:border-[#2D5398] hover:text-[#2D5398]"
              }`}
              aria-label="Mi cuenta"
            >
              <HiOutlineUser size={21} />

              {customerName && (
                <span className="max-w-[110px] truncate">
                  Hola, {customerName}
                </span>
              )}
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

        {/* MOBILE */}
        <div className="grid grid-cols-[88px_1fr_48px] items-center gap-2 px-4 py-3 md:hidden">
          <div className="flex items-center justify-start overflow-hidden">
            <Logo compact />
          </div>

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
              className={`grid h-9 w-9 place-items-center rounded-full border-2 transition-all duration-300 ${
                customerName
                  ? "border-[#2D5398] bg-[#2D5398]/10 text-[#2D5398]"
                  : "border-slate-700 text-slate-700 hover:border-[#2D5398] hover:text-[#2D5398]"
              }`}
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
              >
                ×
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto px-5 py-5">
              {customerName && (
                <Link
                  to="/account"
                  onClick={closeMenu}
                  className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-[#2D5398]"
                >
                  Hola, {customerName}
                </Link>
              )}

              <nav className="flex flex-col gap-4">
                {navbarLinks.map((link) => (
                  <NavLink
                    key={link.id}
                    to={link.href}
                    onClick={closeMenu}
                    className="border-b border-slate-100 pb-3 text-base font-medium text-slate-700 hover:text-[#2D5398]"
                  >
                    {link.title}
                  </NavLink>
                ))}

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