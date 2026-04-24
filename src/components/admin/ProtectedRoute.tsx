import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type ProtectedRouteProps = {
  allowedRoles?: string[];
  children: React.ReactNode;
};

export const ProtectedRoute = ({
  allowedRoles = ["super_admin", "admin", "editor"],
  children,
}: ProtectedRouteProps) => {
  const [status, setStatus] = useState<"loading" | "allowed" | "denied" | "no-session">(
    "loading"
  );

  useEffect(() => {
    const validateAccess = async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        setStatus("no-session");
        return;
      }

      const user = sessionData.session.user;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .single();

      if (error || !profile || !profile.is_active) {
        setStatus("denied");
        return;
      }

      if (!allowedRoles.includes(profile.role)) {
        setStatus("denied");
        return;
      }

      setStatus("allowed");
    };

    validateAccess();
  }, [allowedRoles]);

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

  if (status === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-slate-800">
            Acceso no autorizado
          </h1>
          <p className="mt-3 text-slate-600">
            Tu usuario no tiene permisos activos para ingresar al panel.
          </p>
        </div>
      </div>
    );
  }

  return children;
};