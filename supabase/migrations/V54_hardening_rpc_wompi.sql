-- =========================================================
-- V54 - Hardening RPC WOMPI
-- Protección de funciones críticas de pagos
-- Proyecto: ADDA Seguridad / ADDA Soluciones S.A.S.
-- =========================================================

BEGIN;

-- =========================================================
-- Revocar ejecución pública
-- =========================================================

REVOKE EXECUTE ON FUNCTION public.register_wompi_payment_transaction(
  uuid, text, integer, text, text, text, text, text, text, jsonb, jsonb
) FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.mark_wompi_payment_approved(
  uuid, text, text
) FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.mark_wompi_payment_not_approved(
  uuid, text, text, text
) FROM PUBLIC, anon, authenticated;

-- =========================================================
-- Permitir únicamente backend seguro
-- =========================================================

GRANT EXECUTE ON FUNCTION public.register_wompi_payment_transaction(
  uuid, text, integer, text, text, text, text, text, text, jsonb, jsonb
) TO postgres, service_role;

GRANT EXECUTE ON FUNCTION public.mark_wompi_payment_approved(
  uuid, text, text
) TO postgres, service_role;

GRANT EXECUTE ON FUNCTION public.mark_wompi_payment_not_approved(
  uuid, text, text, text
) TO postgres, service_role;

COMMIT;