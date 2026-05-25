import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabaseAdmin } from "../lib/supabase";

type NavItem = {
  label: string;
  to: string;
  end?: boolean;
  icon: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", to: "/admin", end: true, icon: "⌂" },
      { label: "Productos", to: "/admin/products", icon: "▣" },
      { label: "Cotizaciones", to: "/admin/quotes", icon: "▤" },
      { label: "Plantillas", to: "/admin/templates", icon: "◫" },
      { label: "Perfiles emisores", to: "/admin/issuer-profiles", icon: "◎" },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { label: "Pedidos", to: "/admin/orders", icon: "□" },
      { label: "Multimedia cloud", to: "/admin/multimedia-migration", icon: "▧" },
    ],
  },
  {
    title: "Finanzas",
    items: [
      { label: "Finanzas", to: "/admin/finance", icon: "◈" },
      { label: "Gastos operativos", to: "/admin/expenses", icon: "◇" },
    ],
  },
  {
    title: "Configuración",
    items: [{ label: "Configuración", to: "/admin/settings", icon: "⚙" }],
  },
];

export const AdminLayout = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabaseAdmin.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);

  const handleLogout = async () => {
    await supabaseAdmin.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
      isActive
        ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
        : "text-blue-50/80 hover:bg-white/10 hover:text-white",
    ].join(" ");

  return (
    <section className="min-h-screen bg-slate-100 text-slate-900">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-[linear-gradient(180deg,#1E2F7A_0%,#2843A8_45%,#1C327F_100%)] text-white shadow-[0_10px_40px_rgba(15,35,95,0.35)] transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white p-1 shadow-lg">
              <img
                src="/brands/logo-adda-tres.jpg"
                alt="ADDA Seguridad"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight text-white">
                ADDA
              </h1>

              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
                Seguridad
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm italic leading-5 text-blue-50/80">
            Protección y confiabilidad a tu alcance
          </p>
        </div>

        <nav className="sidebar-scroll flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/50">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={navLinkClass}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-base">
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xl text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
                aria-label="Abrir menú"
              >
                ☰
              </button>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2D5398]">
                  ADDA Seguridad
                </p>
                <h2 className="text-xl font-bold text-slate-900">
                  Panel administrativo
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">

              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">
                  Administrador
                </p>
                <p className="max-w-[220px] truncate text-xs text-slate-500">
                  {email}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2D5398] text-sm font-bold text-white shadow-md">
                {email ? email.charAt(0).toUpperCase() : "A"}
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </section>
  );
};