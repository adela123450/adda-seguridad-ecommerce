-- HARDENING SUPABASE 2026
-- Tabla: business_expenses
-- Objetivo:
-- Eliminar dependencia de anon
-- Mantener CRUD admin vía authenticated + RLS

REVOKE SELECT, INSERT, UPDATE, DELETE
ON TABLE public.business_expenses
FROM anon;