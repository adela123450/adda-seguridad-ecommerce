# ADDA Seguridad

Aplicación web de comercio electrónico y gestión administrativa para una empresa dedicada al suministro e instalación de soluciones de videovigilancia.

El sistema centraliza la publicación de productos, la gestión de clientes, pedidos, cotizaciones, inventario, finanzas y usuarios. También integra pagos electrónicos mediante Wompi y control de acceso basado en roles y permisos.

## Funcionalidades principales

### Portal público

- Catálogo de equipos de seguridad.
- Consulta detallada de productos, precios y disponibilidad.
- Carrito de compras y lista de favoritos.
- Registro, inicio de sesión y recuperación de contraseña.
- Proceso de checkout.
- Pago mediante transferencia o Wompi.
- Consulta del historial de pedidos desde la cuenta del cliente.
- Páginas informativas, políticas, términos y devoluciones.

### Panel administrativo

- Tablero general de operación.
- Gestión de productos, imágenes, precios, ofertas y existencias.
- Administración y seguimiento de pedidos.
- Gestión de clientes.
- Creación y seguimiento de cotizaciones.
- Configuración de plantillas y perfiles emisores.
- Registro de ingresos, costos, gastos e indicadores financieros.
- Configuración fiscal y de métodos de pago.
- Administración de usuarios, roles y permisos.
- Control de acceso mediante RBAC.

## Tecnologías utilizadas

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Icons
- Lucide React

### Backend y servicios

- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security
- Supabase Storage
- Supabase Edge Functions
- Wompi

### Calidad y control de versiones

- ESLint
- Git
- GitHub
- Pull requests y ramas de trabajo

## Arquitectura general

La aplicación utiliza una arquitectura web desacoplada:

1. React gestiona la interfaz pública y administrativa.
2. Supabase Auth administra la autenticación y las sesiones.
3. PostgreSQL almacena la información del negocio.
4. Row Level Security y RBAC controlan el acceso a los datos y módulos.
5. Supabase Storage gestiona los recursos multimedia.
6. Las Edge Functions procesan operaciones sensibles del servidor.
7. Wompi gestiona los pagos electrónicos y notifica sus resultados mediante webhook.

## Seguridad implementada

- Variables sensibles almacenadas como secretos de Supabase.
- Validación de firma en notificaciones de Wompi.
- Procesamiento del webhook antes de actualizar el estado financiero.
- Restricción de creación de usuarios administrativos al rol `super_admin`.
- Validación de sesión y permisos para operaciones administrativas.
- Separación entre claves públicas del cliente y credenciales privadas del servidor.
- Reversión de usuarios incompletos cuando falla su creación administrativa.
- Control de acceso mediante roles, permisos y políticas de base de datos.

> Las claves privadas, contraseñas y credenciales reales no están incluidas en el repositorio.

## Estructura principal

```text
src/
├── components/       Componentes reutilizables
├── context/          Estado global de carrito y favoritos
├── helpers/          Transformación y preparación de datos
├── hooks/            Hooks personalizados
├── layouts/          Diseños público y administrativo
├── lib/              Configuración de servicios
├── modules/          Módulos funcionales, cotizaciones y RBAC
├── pages/            Páginas públicas y administrativas
└── router/           Configuración de rutas

supabase/
├── functions/        Edge Functions
├── migrations/       Migraciones de base de datos
└── config.toml       Configuración del proyecto