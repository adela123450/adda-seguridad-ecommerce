import { useEffect, useState } from "react";

import { Brands } from "../components/home/Brands";
import { FeatureGrid } from "../components/home/FeatureGrid";
import { ProductGrid } from "../components/home/ProducGrid";

import { initialData } from "../data/initialData";
import { prepareProducts } from "../helpers";

import { supabase } from "../lib/supabase";

export const HomePage = () => {
  const [connectionStatus, setConnectionStatus] = useState<
    "loading" | "success" | "error"
  >("loading");

  const preparedProducts = prepareProducts(initialData.products);

  const newProducts = preparedProducts
    .filter((product) => product.isNew)
    .slice(0, 4);

  const featuredProducts = preparedProducts
    .filter((product) => product.isFeatured)
    .slice(0, 4);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { error } = await supabase.auth.getSession();

        if (error) {
          setConnectionStatus("error");
          return;
        }

        setConnectionStatus("success");
      } catch {
        setConnectionStatus("error");
      }
    };

    testConnection();
  }, []);

  return (
    <div>
      {/* TEST CONEXIÓN SUPABASE */}
      <div className="mx-auto mt-4 max-w-7xl px-4">
        {connectionStatus === "loading" && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            Verificando conexión backend...
          </div>
        )}

        {connectionStatus === "success" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
            Backend conectado correctamente con Supabase.
          </div>
        )}

        {connectionStatus === "error" && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            Error de conexión con Supabase.
          </div>
        )}
      </div>

      <FeatureGrid />

      <ProductGrid
        title="Nuevos Productos"
        products={newProducts}
      />

      <ProductGrid
        title="Productos Destacados"
        products={featuredProducts}
      />

      <Brands />
    </div>
  );
};