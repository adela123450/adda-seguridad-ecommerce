import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCart } from "../hooks/useCart";
import { useFavorites } from "../hooks/useFavorites";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  price: number | string;
  description: string | null;
  image_url: string | null;
  stock: number | string | null;
  has_offer: boolean | null;
  offer_price: number | string | null;
  offer_label: string | null;
};

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

const getStockLabel = (stock: number) => {
  if (stock <= 0) return "Agotado";
  if (stock <= 5) return "Pocas unidades";
  return "Disponible";
};

export const ProductPage = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [product, setProduct] = useState<ProductRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const getProduct = async () => {
      if (!slug) return;

      setIsLoading(true);
      setLoadError(null);

      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, slug, sku, brand, category, subcategory, price, description, image_url, stock, has_offer, offer_price, offer_label"
        )
        .eq("slug", slug)
        .single();

      if (error) {
        console.error("Error cargando producto:", error.message);
        setProduct(null);
        setLoadError("No fue posible cargar la información del producto.");
      } else {
        setProduct(data as ProductRow);
      }

      setIsLoading(false);
    };

    getProduct();
  }, [slug]);

  useEffect(() => {
    if (!showToast) return;

    const timer = setTimeout(() => {
      setShowToast(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, [showToast]);

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-800">
          Cargando producto...
        </h1>
        <p className="mt-4 text-slate-600">
          Estamos consultando la información desde el catálogo.
        </p>
      </section>
    );
  }

  if (!product || loadError) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-800">
          Producto no encontrado
        </h1>
        <p className="mt-4 text-slate-600">
          {loadError ?? "El producto que buscas no existe o fue removido."}
        </p>
      </section>
    );
  }

  const stock = Number(product.stock ?? 0);
  const basePrice = Number(product.price ?? 0);
  const offerPrice = Number(product.offer_price ?? 0);
  const finalPrice =
    product.has_offer && offerPrice > 0 && offerPrice < basePrice
      ? offerPrice
      : basePrice;

  const imageUrl = product.image_url ?? "/placeholder-product.png";
  const brand = product.brand ?? "Sin marca";
  const category = product.category ?? "Sin categoría";
  const subcategory = product.subcategory ?? "Sin subcategoría";
  const stockLabel = getStockLabel(stock);
  const formattedPrice = formatPrice(finalPrice);
  const favoriteActive = isFavorite(product.slug);

  const stockBadgeClass =
    stockLabel === "Agotado"
      ? "border-red-100 bg-red-50 text-red-600"
      : stockLabel === "Pocas unidades"
      ? "border-amber-100 bg-amber-50 text-amber-600"
      : "border-emerald-100 bg-emerald-50 text-emerald-600";

  const handleAddToCart = () => {
    if (stock <= 0) {
      alert("Este producto no tiene unidades disponibles.");
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      img: imageUrl,
      price: finalPrice,
      stock,
    });

    setShowToast(true);
  };

  const handleToggleFavorite = () => {
    toggleFavorite({
      slug: product.slug,
      name: product.name,
      brand,
      img: imageUrl,
      formattedPrice,
    });
  };

  return (
    <>
      {showToast && (
        <div className="fixed right-4 top-24 z-50 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-xl">
          <p className="text-sm font-medium text-emerald-700">
            Producto agregado al carrito
          </p>
        </div>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#2D5398] via-[#234684] to-[#111827] px-6 py-10 text-white shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-blue-100">
            FICHA DE PRODUCTO
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-5xl">
            {product.name}
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
            Conoce las características, disponibilidad y datos principales de
            este equipo para tomar una mejor decisión de compra o cotización.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md transition duration-300 hover:shadow-xl">
              <div className="flex h-[340px] items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-100">
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="h-full w-full object-contain p-4 transition duration-300 hover:scale-105"
                />
              </div>

              <div className="mt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2D5398]">
                    {brand}
                  </span>

                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${stockBadgeClass}`}
                  >
                    {stockLabel}
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-bold text-slate-800">
                  {product.name}
                </h2>

                <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                  {formattedPrice}
                </p>

                {product.has_offer && offerPrice > 0 && offerPrice < basePrice && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-slate-400 line-through">
                      {formatPrice(basePrice)}
                    </span>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                      {product.offer_label || "Oferta"}
                    </span>
                  </div>
                )}

                <p className="mt-2 text-sm text-slate-500">
                  Precio referencial sujeto a disponibilidad
                </p>

                <div className="mt-5 space-y-2 text-sm text-slate-600">
                  <p>
                    SKU:{" "}
                    <span className="font-semibold text-slate-800">
                      {product.sku ?? "Sin SKU"}
                    </span>
                  </p>

                  <p>
                    Categoría:{" "}
                    <span className="font-semibold text-slate-800">
                      {category}
                    </span>
                  </p>

                  <p>
                    Subcategoría:{" "}
                    <span className="font-semibold text-slate-800">
                      {subcategory}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md transition duration-300 hover:shadow-xl">
              <h2 className="border-l-4 border-[#2D5398] pl-4 text-2xl font-bold text-slate-800">
                Descripción del producto
              </h2>

              <p className="mt-5 text-justify leading-8 text-slate-600">
                {product.description ||
                  "Producto disponible en el catálogo de ADDA Seguridad. Para mayor información técnica, disponibilidad o compatibilidad, puedes solicitar asesoría comercial."}
              </p>

              <h3 className="mt-10 border-l-4 border-[#2D5398] pl-4 text-xl font-semibold text-slate-800">
                Información principal
              </h3>

              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <li className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                  Marca: {brand}
                </li>

                <li className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                  Categoría: {category}
                </li>

                <li className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                  Subcategoría: {subcategory}
                </li>

                <li className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                  Disponibilidad: {stockLabel}
                </li>
              </ul>

              <h3 className="mt-10 border-l-4 border-[#2D5398] pl-4 text-xl font-semibold text-slate-800">
                Datos comerciales
              </h3>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 border-b border-slate-200 sm:grid-cols-2">
                  <div className="bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                    Código SKU
                  </div>
                  <div className="px-4 py-3 text-slate-600">
                    {product.sku ?? "Sin SKU"}
                  </div>
                </div>

                <div className="grid grid-cols-1 border-b border-slate-200 sm:grid-cols-2">
                  <div className="bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                    Precio
                  </div>
                  <div className="px-4 py-3 text-slate-600">
                    {formattedPrice}
                  </div>
                </div>

                <div className="grid grid-cols-1 border-b border-slate-200 sm:grid-cols-2">
                  <div className="bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                    Stock disponible
                  </div>
                  <div className="px-4 py-3 text-slate-600">{stock}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2">
                  <div className="bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                    Estado
                  </div>
                  <div className="px-4 py-3 text-slate-600">
                    {stockLabel}
                  </div>
                </div>
              </div>
            </div>
          </main>

          <aside className="lg:col-span-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md transition duration-300 hover:shadow-xl">
              <h2 className="border-l-4 border-[#2D5398] pl-4 text-xl font-bold text-slate-800">
                Disponibilidad y compra
              </h2>

              <div className="mt-5">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${stockBadgeClass}`}
                >
                  {stockLabel}
                </span>

                <p className="mt-4 text-sm text-slate-600">
                  Unidades disponibles:{" "}
                  <span className="font-semibold text-slate-800">{stock}</span>
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={stock <= 0}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-[#2D5398] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {stock <= 0 ? "Producto agotado" : "Agregar al carrito"}
                </button>

                <button
                  onClick={handleToggleFavorite}
                  className={`inline-flex w-full items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition duration-300 ${
                    favoriteActive
                      ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {favoriteActive
                    ? "Quitar de favoritos"
                    : "Agregar a favoritos"}
                </button>

                <a
                  href={`https://wa.me/573015068866?text=Hola,%20quiero%20cotizar%20el%20producto%20${encodeURIComponent(
                    product.name
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-[#2D5398] bg-white px-4 py-3 text-center text-sm font-semibold text-[#2D5398] transition duration-300 hover:bg-blue-50"
                >
                  Cotizar por WhatsApp
                </a>
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                <h3 className="text-sm font-semibold text-slate-800">
                  Información adicional
                </h3>

                <ul className="mt-3 space-y-3 text-sm text-slate-600">
                  <li>✔ Garantía por defectos de fábrica.</li>
                  <li>✔ Soporte técnico especializado.</li>
                  <li>✔ Asesoría para selección del equipo.</li>
                  <li>✔ Atención comercial vía WhatsApp.</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
};