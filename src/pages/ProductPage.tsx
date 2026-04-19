import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { initialData } from "../data/initialData";
import { getPreparedProductBySlug } from "../helpers";
import { useCart } from "../hooks/useCart";
import { useFavorites } from "../hooks/useFavorites";

export const ProductPage = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [showToast, setShowToast] = useState(false);

  const product = slug
    ? getPreparedProductBySlug(initialData.products, slug)
    : undefined;

  const favoriteActive = product ? isFavorite(product.slug) : false;

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      img: product.img,
      price: product.price,
      stock: product.stock,
    });

    setShowToast(true);
  };

  const handleToggleFavorite = () => {
    if (!product) return;

    toggleFavorite({
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      img: product.img,
      formattedPrice: product.formattedPrice,
    });
  };

  useEffect(() => {
    if (!showToast) return;

    const timer = setTimeout(() => {
      setShowToast(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, [showToast]);

  if (!product) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-800">
          Producto no encontrado
        </h1>
        <p className="mt-4 text-slate-600">
          El producto que buscas no existe o fue removido.
        </p>
      </section>
    );
  }

  const stockBadgeClass =
    product.stockLabel === "Agotado"
      ? "border-red-100 bg-red-50 text-red-600"
      : product.stockLabel === "Pocas unidades"
      ? "border-amber-100 bg-amber-50 text-amber-600"
      : "border-emerald-100 bg-emerald-50 text-emerald-600";

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
            Conoce las características, especificaciones técnicas y
            disponibilidad de este equipo para tomar una mejor decisión de
            compra o cotización.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Columna izquierda */}
          <aside className="lg:col-span-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md transition duration-300 hover:shadow-xl">
              <div className="flex h-[340px] items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-100">
                <img
                  src={product.img}
                  alt={product.name}
                  className="h-full w-full object-contain p-4 transition duration-300 hover:scale-105"
                />
              </div>

              <div className="mt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2D5398]">
                    {product.brand}
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${stockBadgeClass}`}
                  >
                    {product.stockLabel}
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-bold text-slate-800">
                  {product.name}
                </h2>

                <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                  {product.formattedPrice}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Precio referencial sujeto a disponibilidad
                </p>

                <div className="mt-5 space-y-2 text-sm text-slate-600">
                  <p>
                    Categoría:{" "}
                    <span className="font-semibold text-slate-800">
                      {product.category}
                    </span>
                  </p>
                  <p>
                    Subcategoría:{" "}
                    <span className="font-semibold text-slate-800">
                      {product.subcategory}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Columna central */}
          <main className="lg:col-span-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md transition duration-300 hover:shadow-xl">
              <h2 className="border-l-4 border-[#2D5398] pl-4 text-2xl font-bold text-slate-800">
                Descripción del producto
              </h2>

              <p className="mt-5 text-justify leading-8 text-slate-600">
                {product.description}
              </p>

              <h3 className="mt-10 border-l-4 border-[#2D5398] pl-4 text-xl font-semibold text-slate-800">
                Características principales
              </h3>

              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {product.features.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition duration-300 hover:shadow-md"
                  >
                    {feature}
                  </li>
                ))}
              </ul>

              <h3 className="mt-10 border-l-4 border-[#2D5398] pl-4 text-xl font-semibold text-slate-800">
                Especificaciones técnicas
              </h3>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                {product.details.map((detail, index) => (
                  <div
                    key={`${detail.label}-${index}`}
                    className={`grid grid-cols-1 sm:grid-cols-2 ${
                      index !== product.details.length - 1
                        ? "border-b border-slate-200"
                        : ""
                    }`}
                  >
                    <div className="bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                      {detail.label}
                    </div>
                    <div className="px-4 py-3 text-slate-600">
                      {detail.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* Columna derecha */}
          <aside className="lg:col-span-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md transition duration-300 hover:shadow-xl">
              <h2 className="border-l-4 border-[#2D5398] pl-4 text-xl font-bold text-slate-800">
                Disponibilidad y compra
              </h2>

              <div className="mt-5">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${stockBadgeClass}`}
                >
                  {product.stockLabel}
                </span>

                <p className="mt-4 text-sm text-slate-600">
                  Unidades disponibles:{" "}
                  <span className="font-semibold text-slate-800">
                    {product.stock}
                  </span>
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleAddToCart}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-[#2D5398]"
                >
                  Agregar al carrito
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
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-[#2D5398] bg-white px-4 py-3 text-sm font-semibold text-[#2D5398] transition duration-300 hover:bg-blue-50 text-center"
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