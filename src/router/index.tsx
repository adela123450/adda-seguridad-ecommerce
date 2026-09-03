import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "../layouts/RootLayout";

import {
  AboutPage,
  EquiposPage,
  HomePage,
  ProductPage,
  CartPage,
  AdminProductsPage,
  AdminOrdersPage,
  AdminFinancePage,
  AdminExpensesPage,
  AdminTemplatesPage,
  AdminQuotesPage,
  AdminQuoteEditorPage,
  AdminIssuerProfilesPage,
  AdminCustomersPage,
  AdminRolesPage,
  AdminUsersPage,
  AdminPermissionsPage,
} from "../pages";

import { CheckoutPage } from "../pages/CheckoutPage";
import { OrderConfirmationPage } from "../pages/OrderConfirmationPage";
import { PedidoFinalizadoPage } from "../pages/PedidoFinalizadoPage";
import { FavoritesPage } from "../pages/FavoritesPage";
import { PrivacyPage } from "../pages/PrivacyPage";
import { TermsPage } from "../pages/TermsPage";
import { ReturnsPage } from "../pages/ReturnsPage";
import { AccountPage } from "../pages/AccountPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { AdminLoginPage } from "../pages/AdminLoginPage";
import { AdminResetPasswordPage } from "../pages/AdminResetPasswordPage";
import { AdminLayout } from "../layouts/AdminLayout";
import { ProtectedRoute } from "../components/admin/ProtectedRoute";
import { AdminSettingsPage } from "../pages/AdminSettingsPage";
import { AdminMultimediaMigrationPage } from "../pages/AdminMultimediaMigrationPage";
import { AdminIndexRedirect } from "../components/admin/AdminIndexRedirect";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "Equipos de seguridad", element: <EquiposPage /> },
      { path: "Nosotros", element: <AboutPage /> },
      { path: "product/:slug", element: <ProductPage /> },
      { path: "carrito", element: <CartPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "confirmacion-pedido", element: <OrderConfirmationPage /> },
      { path: "pedido-finalizado", element: <PedidoFinalizadoPage /> },
      { path: "favoritos", element: <FavoritesPage /> },
      { path: "politica-privacidad", element: <PrivacyPage /> },
      { path: "terminos", element: <TermsPage /> },
      { path: "devoluciones", element: <ReturnsPage /> },
      { path: "account", element: <AccountPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },

      {
        path: "admin/login",
        element: <AdminLoginPage />,
      },
      {
        path: "admin/reset-password",
        element: <AdminResetPasswordPage />,
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "admin",
              "editor",
              "tecnico_cctv",
              "vendedor",
            ]}
          >
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <AdminIndexRedirect />,
          },
          {
            path: "products",
            element: (
              <ProtectedRoute requiredPermission="products.read">
                <AdminProductsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "multimedia-migration",
            element: (
              <ProtectedRoute requiredPermission="products.read">
                <AdminMultimediaMigrationPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "orders",
            element: (
              <ProtectedRoute requiredPermission="orders.read">
                <AdminOrdersPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "finance",
            element: (
              <ProtectedRoute requiredPermission="finance.read">
                <AdminFinancePage />
              </ProtectedRoute>
            ),
          },
          {
            path: "expenses",
            element: (
              <ProtectedRoute requiredPermission="expenses.read">
                <AdminExpensesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "settings",
            element: (
              <ProtectedRoute requiredPermission="settings.read">
                <AdminSettingsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "templates",
            element: (
              <ProtectedRoute requiredPermission="quotes.read">
                <AdminTemplatesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "issuer-profiles",
            element: (
              <ProtectedRoute requiredPermission="quotes.read">
                <AdminIssuerProfilesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "quotes",
            element: (
              <ProtectedRoute requiredPermission="quotes.read">
                <AdminQuotesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "quotes/:quoteId",
            element: (
              <ProtectedRoute requiredPermission="quotes.read">
                <AdminQuoteEditorPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "customers",
            element: (
              <ProtectedRoute requiredPermission="orders.read">
                <AdminCustomersPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "security/roles",
            element: (
              <ProtectedRoute requiredPermission="roles.manage">
                <AdminRolesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "security/users",
            element: (
              <ProtectedRoute requiredPermission="roles.assign">
                <AdminUsersPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "security/permissions",
            element: (
              <ProtectedRoute requiredPermission="permissions.read">
                <AdminPermissionsPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },
]);