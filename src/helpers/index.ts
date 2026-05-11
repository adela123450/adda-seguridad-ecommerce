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

  images?: string[];
  image_url?: string | null;

  description: string;
  details: ProductDetail[];
  features: string[];
  colors: ProductColor[];
  variants?: ProductVariant[];

  stock?: number | string | null;

  isNew?: boolean;
  isFeatured?: boolean;

  is_new?: boolean | null;
  is_featured?: boolean | null;

  has_offer?: boolean | null;
  offer_price?: number | string | null;
  offer_label?: string | null;
};

const PLACEHOLDER_IMAGE = "/placeholder-product.png";

const getProductImage = (product: Product) => {
  const cloudImage = product.image_url?.trim();
  const legacyImage = product.images?.[0]?.trim();

  return cloudImage || legacyImage || PLACEHOLDER_IMAGE;
};

export const prepareProducts = (products: Product[]) => {
  return products.map((product) => {
    const stock =
      product.stock !== undefined
        ? Number(product.stock)
        : product.variants?.[0]?.stock ?? 0;

    let stockLabel = "Disponible";

    if (stock === 0) {
      stockLabel = "Agotado";
    } else if (stock <= 5) {
      stockLabel = "Pocas unidades";
    }

    const basePrice = Number(product.price ?? 0);
    const offerPrice = Number(product.offer_price ?? 0);

    const hasValidOffer =
      Boolean(product.has_offer) &&
      offerPrice > 0 &&
      offerPrice < basePrice;

    const finalPrice = hasValidOffer ? offerPrice : basePrice;

    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      subcategory: product.subcategory,
      slug: product.slug,

      img: getProductImage(product),

      price: finalPrice,

      formattedPrice: new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(basePrice),

      formattedOfferPrice: hasValidOffer
        ? new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
          }).format(offerPrice)
        : undefined,

      hasOffer: hasValidOffer,
      offerLabel: product.offer_label || "Oferta",

      description: product.description,
      details: product.details,
      features: product.features,

      stock,
      stockLabel,

      isNew: Boolean(product.isNew ?? product.is_new),
      isFeatured: Boolean(product.isFeatured ?? product.is_featured),
    };
  });
};

export const getPreparedProductBySlug = (
  products: Product[],
  slug: string
) => {
  const preparedProducts = prepareProducts(products);

  return preparedProducts.find((product) => product.slug === slug);
};