import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabaseAdmin } from "../../lib/supabase";

type ProtectedRouteProps = {
  allowedRoles?: string[];
  children: React.ReactNode;
};

export const ProtectedRoute = ({
  allowedRoles = ["super_admin", "admin", "editor"],
  children,
}: ProtectedRouteProps) => {
  const [status, setStatus] = useState<
    "loading" | "allowed" | "no-session"
  >("loading");

  useEffect(() => {
    let isMounted = true;

    const validateAccess = async () => {
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
       
        setStatus("no-session");
        return;
      }

      if (!allowedRoles.includes(profile.role)) {
        setStatus("no-session");
        return;
      }

      setStatus("allowed");
    };

    validateAccess();

    return () => {
      isMounted = false;
    };
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

  return children;
};