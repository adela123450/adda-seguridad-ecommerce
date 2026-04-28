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

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  city: string;
  total_price: number;
  status: string;
  created_at: string;
};

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export const AdminDashboardPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, sku, brand, category, stock, has_offer, created_at")
        .order("created_at", { ascending: false });

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, phone, city, total_price, status, created_at")
        .order("created_at", { ascending: false });

      if (productsError) {
        console.error("Error cargando productos:", productsError.message);
        setProducts([]);
      } else {
        setProducts(productsData ?? []);
      }

      if (ordersError) {
        console.error("Error cargando pedidos:", ordersError.message);
        setOrders([]);
      } else {
        setOrders(ordersData ?? []);
      }

      setLoading(false);
    };

    loadDashboard();
  }, []);

  const totalProducts = products.length;
  const lowStock = products.filter(
    (product) => Number(product.stock ?? 0) > 0 && Number(product.stock ?? 0) <= 5
  ).length;
  const outOfStock = products.filter(
    (product) => Number(product.stock ?? 0) <= 0
  ).length;

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (order) => order.status === "pendiente"
  ).length;
  const totalSales = orders.reduce(
    (total, order) => total + Number(order.total_price ?? 0),
    0
  );

  const latestProducts = products.slice(0, 5);
  const latestOrders = orders.slice(0, 5);

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
          Resumen general de productos, inventario, pedidos y ventas del sistema ADDA Seguridad.
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

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-amber-200">
              <p className="text-sm font-semibold text-slate-500">Pedidos pendientes</p>
              <h3 className="mt-3 text-4xl font-bold text-amber-700">{pendingOrders}</h3>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-200">
              <p className="text-sm font-semibold text-slate-500">Pedidos totales</p>
              <h3 className="mt-3 text-4xl font-bold text-[#2D5398]">{totalOrders}</h3>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-green-200">
              <p className="text-sm font-semibold text-slate-500">Ventas registradas</p>
              <h3 className="mt-3 text-3xl font-bold text-green-700">
                {formatPrice(totalSales)}
              </h3>
            </article>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-yellow-200">
              <p className="text-sm font-semibold text-slate-500">Stock bajo</p>
              <h3 className="mt-3 text-4xl font-bold text-yellow-700">{lowStock}</h3>
              <p className="mt-2 text-sm text-slate-500">5 unidades o menos</p>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-red-200">
              <p className="text-sm font-semibold text-slate-500">Sin stock</p>
              <h3 className="mt-3 text-4xl font-bold text-red-700">{outOfStock}</h3>
            </article>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-6">
              <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Últimos pedidos
                    </h3>
                    <p className="text-sm text-slate-500">
                      Pedidos registrados recientemente.
                    </p>
                  </div>

                  <Link
                    to="/admin/orders"
                    className="rounded-xl bg-[#2D5398] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#234684]"
                  >
                    Ver pedidos
                  </Link>
                </div>

                <div className="space-y-3">
                  {latestOrders.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                      Aún no hay pedidos registrados.
                    </p>
                  ) : (
                    latestOrders.map((order) => (
                      <div
                        key={order.id}
                        className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_1fr_0.7fr]"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {order.order_number}
                          </p>
                          <p className="text-sm text-slate-500">
                            {order.customer_name}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {order.city}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatDate(order.created_at)}
                          </p>
                        </div>

                        <div className="text-sm font-semibold text-slate-800">
                          {formatPrice(Number(order.total_price ?? 0))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>

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
                          <p className="text-sm text-slate-500">
                            {product.sku ?? "Sin SKU"}
                          </p>
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
            </div>

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
                  to="/admin/orders"
                  className="block rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-bold text-white ring-1 ring-white/30 transition hover:bg-white/20"
                >
                  Ver pedidos
                </Link>

                <Link
                  to="/admin/products"
                  className="block rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-bold text-white ring-1 ring-white/30 transition hover:bg-white/20"
                >
                  Crear producto
                </Link>

                <button
                  type="button"
                  disabled
                  className="block w-full cursor-not-allowed rounded-2xl bg-white/5 px-4 py-3 text-center text-sm font-bold text-white/60 ring-1 ring-white/20"
                >
                  Dashboard ventas próximamente
                </button>

                <button
                  type="button"
                  disabled
                  className="block w-full cursor-not-allowed rounded-2xl bg-white/5 px-4 py-3 text-center text-sm font-bold text-white/60 ring-1 ring-white/20"
                >
                  Usuarios próximamente
                </button>
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
};