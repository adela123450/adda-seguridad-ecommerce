import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export const AdminLayout = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <section className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2D5398]">
              ADDA Seguridad
            </p>
            <h1 className="text-xl font-bold text-slate-800">
              Panel administrativo
            </h1>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <span className="rounded-xl bg-[#2D5398]/10 px-4 py-2 text-sm font-medium text-[#2D5398]">
              {email}
            </span>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-[#2D5398] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#234684]"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </section>
  );
};