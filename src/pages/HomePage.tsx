import { FeatureGrid } from "../components/home/FeatureGrid";
import { ProductGrid } from "../components/home/ProducGrid";

export const HomePage = () => {
  return (
    <div>
      <FeatureGrid />

      <ProductGrid 
          title="Nuevos Productos" 
          products={[{id: 1, title: "Producto 1"}]} />

      <ProductGrid 
          title="Productos Destacados" 
          products={[{id: 2, title: "Producto Destacado 1"}]} />
    </div>
  );
};