import { useEffect, useState } from "react";
import {
  assignRoleToUser,
  createAdminUser,
  getRolesForSelect,
  getUsersWithRoles,
  type AdminUserRole,
} from "../modules/rbac/services/rbacService";

type RoleOption = {
  name: string;
};

const initialNewUser = {
  full_name: "",
  email: "",
  temporary_password: "",
  role: "",
};

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<AdminUserRole[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  const [newUser, setNewUser] = useState(initialNewUser);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [usersData, rolesData] = await Promise.all([
        getUsersWithRoles(),
        getRolesForSelect(),
      ]);

      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      console.error(error);
      setErrorMessage("No fue posible cargar la información de usuarios.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (userId: string, role: string) => {
    try {
      setSaving(userId);
      setErrorMessage("");
      setSuccessMessage("");

      await assignRoleToUser(userId, role);
      setSuccessMessage(`Rol "${role}" asignado correctamente.`);
      await loadData();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message ?? "No fue posible asignar el rol.");
    } finally {
      setSaving(null);
    }
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setCreatingUser(true);
      setErrorMessage("");
      setSuccessMessage("");

      await createAdminUser(newUser);

      setSuccessMessage("Usuario creado correctamente.");
      setNewUser(initialNewUser);
      setShowCreateForm(false);

      await loadData();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message ?? "No fue posible crear el usuario.");
    } finally {
      setCreatingUser(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2D5398]">
            Seguridad
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Usuarios y Roles
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Administración de usuarios y asignación de roles dentro del sistema
            ADDA Seguridad.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((current) => !current)}
          className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#243C78]"
        >
          {showCreateForm ? "Cancelar" : "+ Crear usuario"}
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreateUser}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Crear nuevo usuario
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Crea el acceso administrativo y asigna un rol inicial.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Nombre completo
              </span>
              <input
                type="text"
                required
                value={newUser.full_name}
                onChange={(event) =>
                  setNewUser((current) => ({
                    ...current,
                    full_name: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#2D5398]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Correo electrónico
              </span>
              <input
                type="email"
                required
                value={newUser.email}
                onChange={(event) =>
                  setNewUser((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#2D5398]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Contraseña temporal
              </span>
              <input
                type="password"
                required
                minLength={8}
                value={newUser.temporary_password}
                onChange={(event) =>
                  setNewUser((current) => ({
                    ...current,
                    temporary_password: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#2D5398]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Rol inicial
              </span>
              <select
                required
                value={newUser.role}
                onChange={(event) =>
                  setNewUser((current) => ({
                    ...current,
                    role: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#2D5398]"
              >
                <option value="">Seleccionar rol...</option>
                {roles.map((role) => (
                  <option key={role.name} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setNewUser(initialNewUser);
              }}
              className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={creatingUser}
              className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#243C78] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingUser ? "Creando usuario..." : "Crear usuario"}
            </button>
          </div>
        </form>
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
            Usuarios registrados
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Gestión de usuarios y asignación de roles RBAC.
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">Cargando usuarios...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No existen usuarios registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Rol actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Asignar rol
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map((user) => (
                  <tr key={user.profile_id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {user.full_name || "Sin nombre"}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.email}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-xl bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                        {user.assigned_role || "Sin rol"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-bold",
                          user.profile_is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700",
                        ].join(" ")}
                      >
                        {user.profile_is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        defaultValue=""
                        disabled={saving === user.user_id}
                        onChange={(event) => {
                          const role = event.target.value;
                          if (!role) return;
                          handleAssignRole(user.user_id, role);
                        }}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        {roles
                          .filter((role) => role.name !== user.assigned_role)
                          .map((role) => (
                            <option key={role.name} value={role.name}>
                              {role.name}
                            </option>
                          ))}
                      </select>
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