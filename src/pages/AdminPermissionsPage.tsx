import { useEffect, useMemo, useState } from "react";
import {
  assignPermissionToRole,
  getRolePermissionsMatrix,
  removePermissionFromRole,
  type RolePermissionMatrixRow,
} from "../modules/rbac/services/rbacService";

export const AdminPermissionsPage = () => {
  const [rows, setRows] = useState<RolePermissionMatrixRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadMatrix = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await getRolePermissionsMatrix();
      setRows(data);
    } catch (error) {
      console.error("Error cargando matriz de permisos:", error);
      setErrorMessage("No fue posible cargar la matriz de permisos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, []);

  const modules = useMemo(() => {
    return Array.from(
      new Set(rows.map((row) => row.permission_module))
    ).sort();
  }, [rows]);

  const handleTogglePermission = async (
    row: RolePermissionMatrixRow
  ) => {
    if (row.role_name === "super_admin") {
      return;
    }

    const key = `${row.role_name}-${row.permission_code}`;

    try {
      setSavingKey(key);
      setSuccessMessage("");
      setErrorMessage("");

      if (row.assigned) {
        await removePermissionFromRole(
          row.role_name,
          row.permission_code
        );
      } else {
        await assignPermissionToRole(
          row.role_name,
          row.permission_code
        );
      }

      setSuccessMessage("Permiso actualizado correctamente.");

      await loadMatrix();
    } catch (error) {
      console.error("Error actualizando permiso:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible actualizar el permiso."
      );
    } finally {
      setSavingKey("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2D5398]">
          Seguridad
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Permisos
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Gestiona dinámicamente los permisos asociados a cada rol del sistema.
        </p>
      </div>

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Cargando matriz de permisos...
        </div>
      ) : (
        <div className="space-y-6">
          {modules.map((moduleName) => {
            const moduleRows = rows.filter(
              (row) => row.permission_module === moduleName
            );

            return (
              <div
                key={moduleName}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-lg font-bold capitalize text-slate-900">
                    {moduleName.replaceAll("_", " ")}
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Rol
                        </th>

                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Permiso
                        </th>

                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Descripción
                        </th>

                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Estado
                        </th>

                        <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                          Acción
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {moduleRows.map((row) => {
                        const key = `${row.role_name}-${row.permission_code}`;
                        const isSaving = savingKey === key;
                        const isProtected =
                          row.role_name === "super_admin";

                        return (
                          <tr
                            key={`${row.role_id}-${row.permission_id}`}
                            className="hover:bg-slate-50/80"
                          >
                            <td className="px-6 py-4">
                              <span className="rounded-xl bg-slate-100 px-3 py-1 text-sm font-bold text-slate-800">
                                {row.role_name}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                              {row.permission_code}
                            </td>

                            <td className="max-w-xl px-6 py-4 text-sm text-slate-600">
                              {row.permission_description ?? "Sin descripción"}
                            </td>

                            <td className="px-6 py-4">
                              <span
                                className={[
                                  "rounded-full px-3 py-1 text-xs font-bold",
                                  row.assigned
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500",
                                ].join(" ")}
                              >
                                {row.assigned ? "Asignado" : "Sin asignar"}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-right">
                              {isProtected ? (
                                <span className="text-xs font-semibold text-slate-400">
                                  Protegido
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() =>
                                    handleTogglePermission(row)
                                  }
                                  className={[
                                    "rounded-xl px-4 py-2 text-sm font-semibold transition",
                                    row.assigned
                                      ? "bg-red-50 text-red-700 hover:bg-red-100"
                                      : "bg-[#2D5398] text-white hover:bg-[#1F3C75]",
                                    isSaving
                                      ? "cursor-not-allowed opacity-60"
                                      : "",
                                  ].join(" ")}
                                >
                                  {isSaving
                                    ? "Guardando..."
                                    : row.assigned
                                    ? "Retirar"
                                    : "Asignar"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};