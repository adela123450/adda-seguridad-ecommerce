import { useEffect, useState } from "react";
import {
  createRole,
  getRoles,
  type Role,
} from "../modules/rbac/services/rbacService";

export const AdminRolesPage = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadRoles = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await getRoles();
      setRoles(data);
    } catch (error) {
      console.error("Error cargando roles:", error);
      setErrorMessage("No fue posible cargar los roles del sistema.");
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setRoleName("");
    setRoleDescription("");
    setShowCreateForm(false);
  };

  const handleCreateRole = async () => {
    try {
      setErrorMessage("");
      setSuccessMessage("");

      const normalizedName = roleName.trim().toLowerCase();

      if (normalizedName.length < 3) {
        setErrorMessage("El nombre del rol debe tener al menos 3 caracteres.");
        return;
      }

      setCreating(true);

      await createRole(normalizedName, roleDescription.trim());

      setSuccessMessage(`Rol "${normalizedName}" creado correctamente.`);
      resetCreateForm();
      await loadRoles();
    } catch (error: any) {
      console.error("Error creando rol:", error);
      setErrorMessage(error?.message ?? "No fue posible crear el rol.");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2D5398]">
            Seguridad
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">Roles</h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Administración de roles del sistema. Desde aquí se crean roles
            operativos y se preparan perfiles como técnico CCTV, vendedor o
            soporte logístico.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateForm((current) => !current);
            setErrorMessage("");
            setSuccessMessage("");
          }}
          className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#24457f]"
        >
          {showCreateForm ? "Cancelar" : "+ Crear rol"}
        </button>
      </div>

      {showCreateForm && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">Nuevo rol</h2>
            <p className="mt-1 text-sm text-slate-500">
              Crea roles personalizados para controlar permisos desde el módulo
              RBAC.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_2fr_auto] md:items-end">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nombre del rol
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(event) => setRoleName(event.target.value)}
                placeholder="Ej: vendedor"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Descripción
              </label>
              <input
                type="text"
                value={roleDescription}
                onChange={(event) => setRoleDescription(event.target.value)}
                placeholder="Describe el alcance del rol"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={handleCreateRole}
              disabled={creating}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Creando..." : "Guardar rol"}
            </button>
          </div>
        </div>
      )}

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

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            Roles registrados
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Listado cargado desde la tabla RBAC <strong>roles</strong>.
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">Cargando roles...</div>
        ) : roles.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No hay roles registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Creado
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="rounded-xl bg-slate-100 px-3 py-1 text-sm font-bold text-slate-800">
                        {role.name}
                      </span>
                    </td>

                    <td className="max-w-xl px-6 py-4 text-sm text-slate-600">
                      {role.description ?? "Sin descripción"}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-bold",
                          role.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500",
                        ].join(" ")}
                      >
                        {role.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-bold",
                          role.is_system
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700",
                        ].join(" ")}
                      >
                        {role.is_system ? "Sistema" : "Personalizado"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {new Date(role.created_at).toLocaleDateString("es-CO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};