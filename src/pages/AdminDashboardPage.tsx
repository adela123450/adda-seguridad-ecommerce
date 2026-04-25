import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  brand: string | null;
  category: string | null;
  stock: number | null;
  has_offer: boolean | null;
  created_at: string | null;
};

export const AdminDashboardPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, brand, category, stock, has_offer, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error cargando dashboard:", error.message);
        setProducts([]);
      } else {
        setProducts(data ?? []);
      }

      setLoading(false);
    };

    loadProducts();
  }, []);

  const totalProducts = products.length;
  const lowStock = products.filter((product) => Number(product.stock ?? 0) > 0 && Number(product.stock ?? 0) <= 5).length;
  const outOfStock = products.filter((product) => Number(product.stock ?? 0) <= 0).length;
  const offers = products.filter((product) => product.has_offer).length;
  const latestProducts = products.slice(0, 5);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2D5398]">
          Centro de control
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          Dashboard administrativo
        </h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Resumen general del catálogo, inventario y productos destacados del sistema ADDA Seguridad.
        </p>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-8 text-center text-slate-600 shadow-sm ring-1 ring-slate-200">
          Cargando información del dashboard...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-500">Total productos</p>
              <h3 className="mt-3 text-4xl font-bold text-slate-900">{totalProducts}</h3>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-yellow-200">
              <p className="text-sm font-semibold text-slate-500">Stock bajo</p>
              <h3 className="mt-3 text-4xl font-bold text-yellow-700">{lowStock}</h3>
              <p className="mt-2 text-sm text-slate-500">5 unidades o menos</p>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-red-200">
              <p className="text-sm font-semibold text-slate-500">Sin stock</p>
              <h3 className="mt-3 text-4xl font-bold text-red-700">{outOfStock}</h3>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-200">
              <p className="text-sm font-semibold text-slate-500">Con oferta</p>
              <h3 className="mt-3 text-4xl font-bold text-[#2D5398]">{offers}</h3>
            </article>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Últimos productos creados
                  </h3>
                  <p className="text-sm text-slate-500">
                    Productos agregados recientemente al catálogo.
                  </p>
                </div>

                <Link
                  to="/admin/products"
                  className="rounded-xl bg-[#2D5398] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#234684]"
                >
                  Ver productos
                </Link>
              </div>

              <div className="space-y-3">
                {latestProducts.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    Aún no hay productos registrados.
                  </p>
                ) : (
                  latestProducts.map((product) => (
                    <div
                      key={product.id}
                      className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1.4fr_0.8fr_0.6fr]"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{product.name}</p>
                        <p className="text-sm text-slate-500">{product.sku ?? "Sin SKU"}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {product.brand ?? "Sin marca"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {product.category ?? "Sin categoría"}
                        </p>
                      </div>

                      <div className="text-sm font-semibold text-slate-700">
                        Stock: {product.stock ?? 0}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <aside className="rounded-3xl bg-[#2D5398] p-6 text-white shadow-sm">
              <h3 className="text-xl font-bold">Acciones rápidas</h3>
              <p className="mt-2 text-sm text-white/80">
                Accede a las funciones principales del panel administrativo.
              </p>

              <div className="mt-6 space-y-3">
                <Link
                  to="/admin/products"
                  className="block rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold text-[#2D5398] transition hover:bg-slate-100"
                >
                  Gestionar productos
                </Link>

                <Link
                  to="/admin/products"
                  className="block rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-bold text-white ring-1 ring-white/30 transition hover:bg-white/20"
                >
                  Crear producto
                </Link>
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
};