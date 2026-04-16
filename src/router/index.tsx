import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "../layouts/RootLayout";
import {AboutPage, EquiposPage, HomePage, ProductPage, CartPage,} from "../pages";

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
    ],
  },
]);
