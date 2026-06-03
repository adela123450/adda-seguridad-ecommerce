-- =========================================================
-- V53 - Hardening Supabase 2026
-- Proyecto: ADDA Seguridad / ADDA Soluciones S.A.S.
-- Objetivo:
-- 1. Crear base RBAC con user_roles.
-- 2. Registrar usuario super_admin inicial.
-- 3. Crear funciones auxiliares is_admin() y has_role().
-- 4. Endurecer tablas sensibles de pagos y auditoría.
-- =========================================================

-- 1. Tabla base de roles de usuario
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),

  constraint user_roles_user_role_unique unique (user_id, role),
  constraint user_roles_role_check check (
    role in ('super_admin', 'admin', 'sales', 'technician', 'customer')
  )
);

alter table public.user_roles enable row level security;

-- 2. Registrar super_admin inicial
insert into public.user_roles (user_id, role)
values (
  '0c549b83-6b39-4390-91f2-4834384aaadb',
  'super_admin'
)
on conflict (user_id, role) do nothing;

-- 3. Función para validar administradores
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('super_admin', 'admin')
  );
$$;

-- 4. Función para validar roles específicos
create or replace function public.has_role(_role text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role = _role
  );
$$;

-- 5. Endurecimiento de tablas críticas de pagos/auditoría

revoke all privileges on table public.webhook_logs from anon;
revoke all privileges on table public.webhook_logs from authenticated;
revoke all privileges on table public.webhook_logs from public;

grant select, insert, update, delete
on table public.webhook_logs
to service_role;


revoke all privileges on table public.payment_events from anon;
revoke all privileges on table public.payment_events from authenticated;
revoke all privileges on table public.payment_events from public;

grant select, insert, update, delete
on table public.payment_events
to service_role;


revoke all privileges on table public.payment_transactions from anon;
revoke all privileges on table public.payment_transactions from authenticated;
revoke all privileges on table public.payment_transactions from public;

grant select, insert, update, delete
on table public.payment_transactions
to service_role;

-- =========================================================
-- QA ejecutado manualmente:
-- Se realizó pago WOMPI Sandbox posterior al hardening.
-- Resultado:
-- orders actualizado correctamente.
-- payment_transactions funcional.
-- payment_events funcional.
-- webhook_logs funcional.
-- =========================================================