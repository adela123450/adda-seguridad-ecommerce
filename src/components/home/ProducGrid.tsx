import { CardProduct } from "../Products/CardProduct";

interface Props {
  title: string;
  products: any[];
}

export const ProductGrid = ({ title, products }: Props) => {
  return (
    <div className="my-32">
      <h2 className="mb-8 text-center text-3xl font-semibold md:text-4xl lg:text-5xl">
        {title}
      </h2>

      <div className="grid grid-cols-1 gap-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <CardProduct
            key={product.id}
            name={product.name}
            price={product.price}
            colors={product.colors}
            img={product.images?.[0] || "/img/img-banner.jpg"}
            slug={product.slug}
            variants={product.variants}
          />
        ))}
      </div>
    </div>
  );
};
