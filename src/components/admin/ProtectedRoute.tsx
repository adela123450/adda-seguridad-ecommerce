import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabaseAdmin } from "../../lib/supabase";
import {
  getCurrentUserPermissions,
  getCurrentUserRole,
} from "../../modules/rbac/services/rbacService";

type ProtectedRouteProps = {
  allowedRoles?: string[];
  requiredPermission?: string;
  children: React.ReactNode;
};

export const ProtectedRoute = ({
  allowedRoles,
  requiredPermission,
  children,
}: ProtectedRouteProps) => {
  const navigate = useNavigate();

  const [status, setStatus] = useState<
    "loading" | "allowed" | "no-session" | "forbidden"
  >("loading");

  useEffect(() => {
    let isMounted = true;

    const validateAccess = async () => {
      try {
        const { data: sessionData } = await supabaseAdmin.auth.getSession();

        if (!isMounted) return;

        if (!sessionData.session) {
          setStatus("no-session");
          return;
        }

        const user = sessionData.session.user;

        const { data: profile, error } = await supabaseAdmin
          .from("profiles")
          .select("role, is_active")
          .eq("id", user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (error || !profile || !profile.is_active) {
          await supabaseAdmin.auth.signOut();
          setStatus("no-session");
          return;
        }

        const currentRole = await getCurrentUserRole();
        const role = currentRole ?? profile.role;

        if (role === "super_admin") {
          setStatus("allowed");
          return;
        }

        if (allowedRoles && !allowedRoles.includes(role)) {
          setStatus("forbidden");
          return;
        }

        if (requiredPermission) {
          const permissions = await getCurrentUserPermissions();

          if (!permissions.includes(requiredPermission)) {
            setStatus("forbidden");
            return;
          }
        }

        setStatus("allowed");
      } catch (error) {
        console.error("Error validando acceso protegido:", error);
        setStatus("no-session");
      }
    };

    validateAccess();

    return () => {
      isMounted = false;
    };
  }, [allowedRoles, requiredPermission]);

  const handleLogout = async () => {
    await supabaseAdmin.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Validando acceso...
      </div>
    );
  }

  if (status === "no-session") {
    return <Navigate to="/admin/login" replace />;
  }

  if (status === "forbidden") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2D5398]">
            Acceso restringido
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            No tienes permiso para acceder a esta página
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Tu rol no tiene autorización para usar este módulo. Si crees que
            esto es un error, solicita al administrador que revise tus permisos.
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#243C78]"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return children;
};
