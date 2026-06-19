import { supabaseAdmin as supabase } from "../../../lib/supabase";

export type Role = {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
};

export type AdminUserRole = {
  profile_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  profile_role: string | null;
  profile_is_active: boolean;
  assigned_role: string | null;
  role_description: string | null;
  is_system: boolean | null;
  role_is_active: boolean | null;
  role_assigned_at: string | null;
};

export type RolePermissionMatrixRow = {
  role_id: string;
  role_name: string;
  role_description: string | null;
  is_system: boolean;
  role_is_active: boolean;
  permission_id: string;
  permission_code: string;
  permission_module: string;
  permission_description: string | null;
  assigned: boolean;
};

export type CreateAdminUserPayload = {
  full_name: string;
  email: string;
  temporary_password: string;
  role: string;
};

export const getRoles = async () => {
  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .order("name");

  if (error) throw error;
  return (data ?? []) as Role[];
};

export const createRole = async (name: string, description: string) => {
  const { data, error } = await supabase.rpc("create_role_admin", {
    _name: name,
    _description: description || null,
  });

  if (error) throw error;
  return data as string;
};

export const updateRole = async (
  roleId: string,
  description: string,
  isActive: boolean
) => {
  const { error } = await supabase.rpc("update_role_admin", {
    _role_id: roleId,
    _description: description || null,
    _is_active: isActive,
  });

  if (error) throw error;
};

export const getCurrentUserRole = async () => {
  const { data, error } = await supabase.rpc("get_current_user_role");

  if (error) throw error;
  return (data ?? null) as string | null;
};

export const getCurrentUserPermissions = async () => {
  const { data, error } = await supabase.rpc("get_current_user_permissions");

  if (error) throw error;

  return ((data ?? []) as { permission_code: string }[]).map(
    (row) => row.permission_code
  );
};

export const getUsersWithRoles = async () => {
  const { data, error } = await supabase
    .from("admin_users_with_roles")
    .select("*")
    .order("full_name");

  if (error) throw error;
  return (data ?? []) as AdminUserRole[];
};

export const getRolePermissionsMatrix = async () => {
  const { data, error } = await supabase
    .from("admin_role_permissions_matrix")
    .select("*")
    .order("role_name");

  if (error) throw error;
  return (data ?? []) as RolePermissionMatrixRow[];
};

export const assignRoleToUser = async (userId: string, role: string) => {
  const { error } = await supabase.rpc("assign_role_to_user", {
    _user_id: userId,
    _role: role,
  });

  if (error) throw error;
};

export const getRolesForSelect = async () => {
  const { data, error } = await supabase
    .from("roles")
    .select("name")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
};

export const createAdminUser = async (payload: CreateAdminUserPayload) => {
  const { data, error } = await supabase.functions.invoke("create-admin-user", {
    body: payload,
  });

  if (error) throw error;

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
};