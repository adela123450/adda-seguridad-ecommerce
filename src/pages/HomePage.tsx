import { Brands } from "../components/home/Brands";
import { FeatureGrid } from "../components/home/FeatureGrid";
import { ProductGrid } from "../components/home/ProducGrid";
import { initialData } from "../data/initialData";

export const HomePage = () => {
  const newProducts = initialData.products
    .filter((product) => product.isNew)
    .slice(0, 4);

  const featuredProducts = initialData.products
    .filter((product) => product.isFeatured)
    .slice(0, 4);

  return (
    <div>
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
