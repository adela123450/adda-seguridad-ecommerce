import { CardProduct } from "../Products/CardProduct";

interface Props {
  title: string;
  products: any[];
}

export const ProductGrid = ({ title, products }: Props) => {
  return (
    <section className="my-24">
      <div className="max-w-7xl mx-auto px-4">

        <h2 className="mb-10 text-center text-3xl font-semibold md:text-4xl lg:text-5xl">
          {title}
        </h2>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 justify-items-center">
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
    </section>
  );
};