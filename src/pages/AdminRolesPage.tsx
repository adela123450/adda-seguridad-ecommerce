import { useEffect, useState } from "react";
import {
  createRole,
  deleteRole,
  getRoles,
  updateRole,
  type Role,
} from "../modules/rbac/services/rbacService";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  return fallback;
};

export const AdminRolesPage = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");

  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

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

  const closeEditModal = () => {
    setEditingRole(null);
    setEditDescription("");
    setEditIsActive(true);
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
    } catch (error) {
      console.error("Error creando rol:", error);
      setErrorMessage(getErrorMessage(error, "No fue posible crear el rol."));
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEditModal = (role: Role) => {
    if (role.name === "super_admin") {
      setErrorMessage("El rol super_admin no se puede modificar.");
      setSuccessMessage("");
      return;
    }

    setEditingRole(role);
    setEditDescription(role.description ?? "");
    setEditIsActive(role.is_active);
    setShowCreateForm(false);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      setUpdating(true);
      setErrorMessage("");
      setSuccessMessage("");

      await updateRole(editingRole.id, editDescription.trim(), editIsActive);

      setSuccessMessage(`Rol "${editingRole.name}" actualizado correctamente.`);
      closeEditModal();
      await loadRoles();
    } catch (error) {
      console.error("Error actualizando rol:", error);
      setErrorMessage(
        getErrorMessage(error, "No fue posible actualizar el rol.")
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    const confirmed = window.confirm(
      `¿Deseas eliminar el rol "${role.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingRoleId(role.id);
      setErrorMessage("");
      setSuccessMessage("");

      await deleteRole(role.id);

      setSuccessMessage(`Rol "${role.name}" eliminado correctamente.`);
      await loadRoles();
    } catch (error) {
      console.error("Error eliminando rol:", error);
      setErrorMessage(
        getErrorMessage(error, "No fue posible eliminar el rol.")
      );
    } finally {
      setDeletingRoleId(null);
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
            Administración de roles del sistema. Desde aquí se crean y editan
            roles operativos para técnico CCTV, vendedor, administración y
            soporte logístico.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateForm((current) => !current);
            closeEditModal();
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
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {roles.map((role) => {
                  const isProtected = role.is_system;

                  return (
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

                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(role)}
                            disabled={isProtected}
                            className={[
                              "rounded-2xl px-4 py-2 text-xs font-bold transition",
                              isProtected
                                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                : "bg-[#2D5398] text-white shadow-sm hover:bg-[#24457f]",
                            ].join(" ")}
                          >
                            {isProtected ? "Protegido" : "Editar"}
                          </button>

                          {!role.is_system && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRole(role)}
                              disabled={deletingRoleId === role.id}
                              className="rounded-2xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingRoleId === role.id
                                ? "Eliminando..."
                                : "Eliminar"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2D5398]">
                    RBAC PRO
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    Editar rol
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Actualiza la descripción y el estado del rol sin modificar
                    su identificador interno.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Rol seleccionado
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="rounded-xl bg-slate-900 px-3 py-1 text-sm font-bold text-white">
                    {editingRole.name}
                  </span>

                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-bold",
                      editingRole.is_system
                        ? "bg-blue-50 text-blue-700"
                        : "bg-amber-50 text-amber-700",
                    ].join(" ")}
                  >
                    {editingRole.is_system ? "Sistema" : "Personalizado"}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    Nombre no editable
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Descripción
                </label>
                <textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  placeholder="Describe el alcance operativo de este rol"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Estado del rol
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setEditIsActive(true)}
                    className={[
                      "rounded-2xl border px-4 py-4 text-left transition",
                      editIsActive
                        ? "border-emerald-300 bg-emerald-50 ring-4 ring-emerald-100"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <span className="block text-sm font-bold text-slate-900">
                      Activo
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      El rol puede usarse para asignación y operación.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditIsActive(false)}
                    className={[
                      "rounded-2xl border px-4 py-4 text-left transition",
                      !editIsActive
                        ? "border-slate-300 bg-slate-100 ring-4 ring-slate-100"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <span className="block text-sm font-bold text-slate-900">
                      Inactivo
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      El rol queda deshabilitado para uso operativo.
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={updating}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={updating}
                className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#24457f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};