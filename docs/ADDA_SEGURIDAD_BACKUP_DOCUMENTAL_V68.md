# ADDA Seguridad --- Backup Documental V68

## Estado de sprints

-   V61 --- Creación de usuarios desde UX.
-   V62 --- Edición de roles.
-   V63 --- Protección dinámica de rutas.
-   V64 --- Gestión de permisos desde UX.
-   V65 --- Activación y desactivación de usuarios.
-   V66 --- Gestión logística de pedidos.
-   V67 --- Eliminación segura de roles.
-   V68 --- Backup documental del hardening.

## Resumen ejecutivo

ADDA Seguridad es una plataforma integral que unifica ecommerce B2C/B2B,
ERP comercial, cotizaciones PRO, gestión de clientes, logística,
finanzas y seguridad RBAC.

## Arquitectura

Frontend: React, Vite, TypeScript, TailwindCSS y React Router.

Backend: Supabase, PostgreSQL, RLS, Edge Functions y Storage.

Pagos: Wompi.

## Seguridad

-   RLS habilitado.
-   Grants mínimos.
-   Policies explícitas.
-   Hardening de autenticación.
-   Compatibilidad Data API 2026.
-   Clientes Supabase separados: `supabasePublic` y `supabaseAdmin`.

## RBAC

Tablas:

-   roles
-   permissions
-   role_permissions
-   user_roles

Roles:

-   super_admin
-   admin
-   tecnico_cctv
-   vendedor

## Sprints finales

### V66 --- Gestión logística de pedidos

-   Registro de guía.
-   Observaciones logísticas.
-   Evidencias.
-   Control por permisos RBAC.

### V67 --- Eliminación segura de roles

-   No eliminar super_admin.
-   No eliminar roles del sistema.
-   No eliminar roles con usuarios asociados.
-   No eliminar roles con permisos activos.

### V68 --- Backup documental

-   Arquitectura.
-   Hardening.
-   RBAC.
-   Lecciones aprendidas.
-   Auditorías ejecutadas.

## Metodología Scrum

1.  Auditoría
2.  Diagnóstico
3.  Diseño
4.  Implementación
5.  QA
6.  Build
7.  Commit
8.  Push
9.  Retrospectiva

## Lecciones aprendidas

-   No tocar Auth sin auditoría.
-   No modificar RLS sin revisión.
-   Ocultar menú no protege rutas.
-   QA antes del build.
-   Build obligatorio antes del commit.
-   No reemplazar archivos completos sin revisar impacto.

## Estado final

✅ V61 ✅ V62 ✅ V63 ✅ V64 ✅ V65 ✅ V66 ✅ V67 ✅ V68
