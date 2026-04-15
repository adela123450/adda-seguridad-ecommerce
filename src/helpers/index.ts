type ProductDetail = {
  label: string;
  value: string;
};

type ProductVariant = {
  color: string;
  stock: number;
};

type ProductColor = {
  name: string;
  color: string;
};

type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  slug: string;
  images: string[];
  description: string;
  details: ProductDetail[];
  features: string[];
  colors: ProductColor[];
  variants: ProductVariant[];
  isNew: boolean;
  isFeatured: boolean;
};

export const prepareProducts = (products: Product[]) => {
  return products.map((product) => {
    const stock = product.variants?.[0]?.stock ?? 0;

    let stockLabel = "Disponible";

    if (stock === 0) {
      stockLabel = "Agotado";
    } else if (stock <= 5) {
      stockLabel = "Pocas unidades";
    }

    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      subcategory: product.subcategory,
      slug: product.slug,
      img: product.images?.[0] || "/img/placeholder.jpg",
      price: product.price,
      formattedPrice: new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(product.price),
      description: product.description,
      details: product.details,
      features: product.features,
      stock,
      stockLabel,
      isNew: product.isNew,
      isFeatured: product.isFeatured,
    };
  });
};