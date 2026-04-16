import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { initialData } from "../data/initialData";
import { getPreparedProductBySlug } from "../helpers";
import { useCart } from "../hooks/useCart";

export const ProductPage = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const [showToast, setShowToast] = useState(false);

  const product = slug
    ? getPreparedProductBySlug(initialData.products, slug)
    : undefined;

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

  useEffect(() => {
    if (!showToast) return;

    const timer = setTimeout(() => {
      setShowToast(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, [showToast]);

  if (!product) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-800">
          Producto no encontrado
        </h1>
        <p className="mt-4 text-slate-600">
          El producto que buscas no existe o fue removido.
        </p>
      </section>
    );
  }

  return (
    <>
      {showToast && (
        <div className="fixed right-4 top-24 z-50 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg">
          <p className="text-sm font-medium text-emerald-700">
            Producto agregado al carrito
          </p>
        </div>
      )}

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Columna izquierda */}
          <aside className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-[320px] items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={product.img}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">
                  {product.brand}
                </p>

                <h1 className="mt-2 text-2xl font-bold text-slate-800">
                  {product.name}
                </h1>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {product.formattedPrice}
                </p>

                <p className="mt-3 text-sm text-slate-600">
                  Categoría:{" "}
                  <span className="font-medium text-slate-800">
                    {product.category}
                  </span>
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Subcategoría:{" "}
                  <span className="font-medium text-slate-800">
                    {product.subcategory}
                  </span>
                </p>
              </div>
            </div>
          </aside>

          {/* Columna central */}
          <main className="lg:col-span-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800">
                Descripción del producto
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                {product.description}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-slate-800">
                Características principales
              </h3>

              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {product.features.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    {feature}
                  </li>
                ))}
              </ul>

              <h3 className="mt-8 text-xl font-semibold text-slate-800">
                Especificaciones técnicas
              </h3>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                {product.details.map((detail, index) => (
                  <div
                    key={`${detail.label}-${index}`}
                    className={`grid grid-cols-1 sm:grid-cols-2 ${
                      index !== product.details.length - 1
                        ? "border-b border-slate-200"
                        : ""
                    }`}
                  >
                    <div className="bg-slate-50 px-4 py-3 font-medium text-slate-700">
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
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800">
                Disponibilidad
              </h2>

              <p
                className={`mt-4 text-base font-semibold ${
                  product.stockLabel === "Agotado"
                    ? "text-red-600"
                    : product.stockLabel === "Pocas unidades"
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              >
                {product.stockLabel}
              </p>

              <p className="mt-2 text-sm text-slate-600">
                Unidades disponibles:{" "}
                <span className="font-semibold text-slate-800">
                  {product.stock}
                </span>
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleAddToCart}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Agregar al carrito
                </button>

                <button className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Agregar a favoritos
                </button>
              </div>

              <div className="mt-8 rounded-xl bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-800">
                  Información adicional
                </h3>

                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>Garantía por defectos de fábrica.</li>
                  <li>Soporte técnico especializado.</li>
                  <li>Asesoría para selección del equipo.</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
};