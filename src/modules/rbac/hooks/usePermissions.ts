import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCurrentUserPermissions,
  getCurrentUserRole,
} from "../services/rbacService";

export const usePermissions = () => {
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const isSuperAdmin = role === "super_admin";

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      console.log("RBAC: iniciando carga de permisos");

      const currentRole = await getCurrentUserRole();
      console.log("RBAC: rol actual:", currentRole);

      const currentPermissions = await getCurrentUserPermissions();
      console.log("RBAC: permisos actuales:", currentPermissions);

      setRole(currentRole);
      setPermissions(currentPermissions);
    } catch (error) {
      console.error("RBAC: error cargando permisos del usuario:", error);
      setRole(null);
      setPermissions([]);
      setErrorMessage("No fue posible cargar los permisos del usuario.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const permissionSet = useMemo(() => {
    return new Set(permissions);
  }, [permissions]);

  const hasPermission = useCallback(
    (permission?: string) => {
      if (!permission) return true;
      if (isSuperAdmin) return true;

      const allowed = permissionSet.has(permission);

      console.log("RBAC: validando permiso:", {
        permission,
        allowed,
        role,
      });

      return allowed;
    },
    [isSuperAdmin, permissionSet, role]
  );

  return {
    role,
    permissions,
    loading,
    errorMessage,
    isSuperAdmin,
    hasPermission,
    reloadPermissions: loadPermissions,
  };
};