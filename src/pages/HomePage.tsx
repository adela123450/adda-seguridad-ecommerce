import { useEffect, useState } from "react";

import { Brands } from "../components/home/Brands";
import { FeatureGrid } from "../components/home/FeatureGrid";
import { ProductGrid } from "../components/home/ProducGrid";

import { prepareProducts, type Product } from "../helpers";

import { supabase } from "../lib/supabase";

export const HomePage = () => {
  const [, setConnectionStatus] = useState<
    "loading" | "success" | "error"
  >("loading");

  const [products, setProducts] = useState<Product[]>([]);

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

  useEffect(() => {
    const getProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("visible", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error cargando productos:", error.message);
        return;
      }

      setProducts((data ?? []) as Product[]);
    };

    getProducts();
  }, []);

  const preparedProducts = prepareProducts(products);

  const newProducts = preparedProducts
    .filter((product) => product.isNew)
    .slice(0, 4);

  const featuredProducts = preparedProducts
    .filter((product) => product.isFeatured)
    .slice(0, 4);

  return (
    <div>
      <FeatureGrid />

      <ProductGrid
        title="Nuevos Productos"
        products={
          newProducts.length > 0 ? newProducts : preparedProducts.slice(0, 4)
        }
      />

      <ProductGrid
        title="Productos Destacados"
        products={
          featuredProducts.length > 0
            ? featuredProducts
            : preparedProducts.slice(4, 8)
        }
      />

      <Brands />
    </div>
  );
};