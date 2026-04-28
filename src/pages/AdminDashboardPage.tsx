import { useEffect, useMemo, useState } from "react";
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

type OrderStatus =
  | "pendiente"
  | "confirmado"
  | "pagado"
  | "enviado"
  | "entregado"
  | "cancelado";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  city: string;
  total_price: number;
  status: OrderStatus;
  created_at: string;
};

const PAID_STATUSES: OrderStatus[] = ["pagado", "enviado", "entregado"];
const RECEIVABLE_STATUSES: OrderStatus[] = ["pendiente", "confirmado"];
const LOW_STOCK_LIMIT = 5;

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

const getStatusClass = (status: OrderStatus) => {
  const styles: Record<OrderStatus, string> = {
    pendiente: "bg-amber-100 text-amber-700",
    confirmado: "bg-blue-100 text-blue-700",
    pagado: "bg-green-100 text-green-700",
    enviado: "bg-purple-100 text-purple-700",
    entregado: "bg-slate-900 text-white",
    cancelado: "bg-red-100 text-red-700",
  };

  return styles[status];
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
        .select(
          "id, order_number, customer_name, phone, city, total_price, status, created_at"
        )
        .order("created_at", { ascending: false });

      if (productsError) {
        console.error("Error cargando productos:", productsError.message);
        setProducts([]);
      } else {
        setProducts((productsData ?? []) as Product[]);
      }

      if (ordersError) {
        console.error("Error cargando pedidos:", ordersError.message);
        setOrders([]);
      } else {
        setOrders((ordersData ?? []) as Order[]);
      }

      setLoading(false);
    };

    loadDashboard();
  }, []);

  const realSalesOrders = useMemo(
    () => orders.filter((order) => PAID_STATUSES.includes(order.status)),
    [orders]
  );

  const receivableOrders = useMemo(
    () => orders.filter((order) => RECEIVABLE_STATUSES.includes(order.status)),
    [orders]
  );

  const canceledOrders = orders.filter(
    (order) => order.status === "cancelado"
  );

  const shippedOrders = orders.filter((order) => order.status === "enviado");
  const deliveredOrders = orders.filter((order) => order.status === "entregado");

  const pendingToManage = receivableOrders.length;

  const realSalesValue = realSalesOrders.reduce(
    (total, order) => total + Number(order.total_price ?? 0),
    0
  );

  const receivableValue = receivableOrders.reduce(
    (total, order) => total + Number(order.total_price ?? 0),
    0
  );

  const averageTicket =
    realSalesOrders.length > 0 ? realSalesValue / realSalesOrders.length : 0;

  const usefulOrders = orders.filter((order) => order.status !== "cancelado");
  const conversionRate =
    usefulOrders.length > 0
      ? Math.round((realSalesOrders.length / usefulOrders.length) * 100)
      : 0;

  const lowStockProducts = products.filter((product) => {
    const stock = Number(product.stock ?? 0);
    return stock > 0 && stock <= LOW_STOCK_LIMIT;
  });

  const outOfStockProducts = products.filter(
    (product) => Number(product.stock ?? 0) <= 0
  );

  const criticalProducts = [...outOfStockProducts, ...lowStockProducts].slice(
    0,
    6
  );

  const latestOrders = orders.slice(0, 6);
  const latestRealSales = realSalesOrders.slice(0, 5);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] p-6 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
          Centro de control
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          Dashboard administrativo ADDA
        </h2>

        <p className="mt-2 max-w-3xl text-blue-100">
          Indicadores reales de ventas, cartera, operación logística e inventario
          crítico para tomar decisiones comerciales.
        </p>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-8 text-center text-slate-600 shadow-sm ring-1 ring-slate-200">
          Cargando información del dashboard...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-green-200">
              <p className="text-sm font-semibold text-slate-500">
                Ventas reales
              </p>
              <h3 className="mt-3 text-3xl font-bold text-green-700">
                {formatPrice(realSalesValue)}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Pagado + enviado + entregado
              </p>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-200">
              <p className="text-sm font-semibold text-slate-500">
                Ticket promedio
              </p>
              <h3 className="mt-3 text-3xl font-bold text-[#2D5398]">
                {formatPrice(averageTicket)}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Promedio por venta real
              </p>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-amber-200">
              <p className="text-sm font-semibold text-slate-500">
                Cartera pendiente
              </p>
              <h3 className="mt-3 text-3xl font-bold text-amber-700">
                {formatPrice(receivableValue)}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Pendiente + confirmado
              </p>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-red-200">
              <p className="text-sm font-semibold text-slate-500">
                Cancelados
              </p>
              <h3 className="mt-3 text-4xl font-bold text-red-700">
                {canceledOrders.length}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                No cuentan como venta
              </p>
            </article>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-500">
                Por gestionar
              </p>
              <h3 className="mt-3 text-4xl font-bold text-slate-900">
                {pendingToManage}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Pedidos pendientes o confirmados
              </p>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-200">
              <p className="text-sm font-semibold text-slate-500">Enviados</p>
              <h3 className="mt-3 text-4xl font-bold text-purple-700">
                {shippedOrders.length}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                En proceso logístico
              </p>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-300">
              <p className="text-sm font-semibold text-slate-500">
                Entregados
              </p>
              <h3 className="mt-3 text-4xl font-bold text-slate-900">
                {deliveredOrders.length}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Ventas cerradas completamente
              </p>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-yellow-200">
              <p className="text-sm font-semibold text-slate-500">
                Conversión útil
              </p>
              <h3 className="mt-3 text-4xl font-bold text-yellow-700">
                {conversionRate}%
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Ventas reales sobre pedidos no cancelados
              </p>
            </article>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-500">
                Productos activos
              </p>
              <h3 className="mt-3 text-4xl font-bold text-slate-900">
                {products.length}
              </h3>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-yellow-200">
              <p className="text-sm font-semibold text-slate-500">
                Stock bajo
              </p>
              <h3 className="mt-3 text-4xl font-bold text-yellow-700">
                {lowStockProducts.length}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                1 a {LOW_STOCK_LIMIT} unidades
              </p>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-red-200">
              <p className="text-sm font-semibold text-slate-500">Sin stock</p>
              <h3 className="mt-3 text-4xl font-bold text-red-700">
                {outOfStockProducts.length}
              </h3>
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
                      Estado comercial y operativo reciente.
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

                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-slate-800">
                            {formatPrice(Number(order.total_price ?? 0))}
                          </p>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
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
                      Ventas reales recientes
                    </h3>
                    <p className="text-sm text-slate-500">
                      Solo pedidos pagados, enviados o entregados.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {latestRealSales.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                      Todavía no hay ventas reales registradas.
                    </p>
                  ) : (
                    latestRealSales.map((order) => (
                      <div
                        key={order.id}
                        className="grid gap-3 rounded-2xl bg-green-50 p-4 md:grid-cols-[1fr_1fr_0.7fr]"
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
                          <p className="text-sm text-slate-600">
                            {formatDate(order.created_at)}
                          </p>
                          <span
                            className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <p className="text-sm font-bold text-green-700">
                          {formatPrice(Number(order.total_price ?? 0))}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Inventario crítico
                    </h3>
                    <p className="text-sm text-slate-500">
                      Productos sin stock o con pocas unidades.
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
                  {criticalProducts.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                      No hay productos críticos en inventario.
                    </p>
                  ) : (
                    criticalProducts.map((product) => {
                      const stock = Number(product.stock ?? 0);
                      const isOut = stock <= 0;

                      return (
                        <div
                          key={product.id}
                          className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1.4fr_0.8fr_0.6fr]"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">
                              {product.name}
                            </p>
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

                          <span
                            className={`inline-flex h-fit w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                              isOut
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            Stock: {stock}
                          </span>
                        </div>
                      );
                    })
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

                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
                  <p className="text-sm font-bold">Lectura gerencial</p>
                  <p className="mt-2 text-sm text-white/80">
                    Las ventas reales excluyen pendientes, confirmados y
                    cancelados. La cartera pendiente ayuda a priorizar gestión
                    comercial.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
};