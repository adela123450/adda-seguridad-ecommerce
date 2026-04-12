import { Brands } from "../components/home/Brands";
import { FeatureGrid } from "../components/home/FeatureGrid";
import { ProductGrid } from "../components/home/ProducGrid";
import { initialData } from "../data/initialData";

export const HomePage = () => {
  const newProducts = initialData.products.filter((product) => product.isNew);
  const featuredProducts = initialData.products.filter(
    (product) => product.isFeatured
  );

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
