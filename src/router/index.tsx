import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "../layouts/RootLayout";

import {
  AboutPage,
  EquiposPage,
  HomePage,
  ProductPage,
  CartPage,
  AdminProductsPage,
} from "../pages";

import { CheckoutPage } from "../pages/CheckoutPage";
import { OrderConfirmationPage } from "../pages/OrderConfirmationPage";
import { PedidoFinalizadoPage } from "../pages/PedidoFinalizadoPage";
import { FavoritesPage } from "../pages/FavoritesPage";
import { PrivacyPage } from "../pages/PrivacyPage";
import { TermsPage } from "../pages/TermsPage";
import { ReturnsPage } from "../pages/ReturnsPage";
import { AccountPage } from "../pages/AccountPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "Equipos de seguridad",
        element: <EquiposPage />,
      },
      {
        path: "Nosotros",
        element: <AboutPage />,
      },
      {
        path: "product/:slug",
        element: <ProductPage />,
      },
      {
        path: "carrito",
        element: <CartPage />,
      },
      {
        path: "checkout",
        element: <CheckoutPage />,
      },
      {
        path: "confirmacion-pedido",
        element: <OrderConfirmationPage />,
      },
      {
        path: "pedido-finalizado",
        element: <PedidoFinalizadoPage />,
      },
      {
        path: "favoritos",
        element: <FavoritesPage />,
      },
      {
        path: "politica-privacidad",
        element: <PrivacyPage />,
      },
      {
        path: "terminos",
        element: <TermsPage />,
      },
      {
        path: "devoluciones",
        element: <ReturnsPage />,
      },
      {
        path: "account",
        element: <AccountPage />,
      },
      {
        path: "admin/products",
        element: <AdminProductsPage />,
      },
    ],
  },
]);