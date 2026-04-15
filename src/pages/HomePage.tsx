import { Brands } from "../components/home/Brands";
import { FeatureGrid } from "../components/home/FeatureGrid";
import { ProductGrid } from "../components/home/ProducGrid";
import { initialData } from "../data/initialData";
import { prepareProducts } from "../helpers";

export const HomePage = () => {
  const preparedProducts = prepareProducts(initialData.products);

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