import { Navigate } from "react-router-dom";
import { usePermissions } from "../../modules/rbac/hooks/usePermissions";
import { AdminDashboardPage } from "../../pages";

export const AdminIndexRedirect = () => {
  const { role, loading, isSuperAdmin } = usePermissions();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
        Validando permisos...
      </div>
    );
  }

  if (isSuperAdmin || role === "admin") {
    return <AdminDashboardPage />;
  }

  return <Navigate to="/admin/quotes" replace />;
};