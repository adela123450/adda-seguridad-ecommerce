import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
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
    return <Navigate to="/admin" replace />;
  }

  return children;
};