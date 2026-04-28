import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

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
  city: string;
  total_price: number;
  status: OrderStatus;
  created_at: string;
};

type PeriodFilter = "today" | "week" | "month" | "year" | "all";

const IVA_RATE = 0.19;

const REAL_SALE_STATUSES: OrderStatus[] = ["pagado", "enviado", "entregado"];
const RECEIVABLE_STATUSES: OrderStatus[] = ["pendiente", "confirmado"];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

const getStartDate = (period: PeriodFilter) => {
  const now = new Date();
  const start = new Date(now);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (period === "week") {
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (period === "year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  return null;
};

export const AdminFinancePage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("month");

  useEffect(() => {
    const loadFinance = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, city, total_price, status, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error cargando finanzas:", error.message);
        setOrders([]);
      } else {
        setOrders((data ?? []) as Order[]);
      }

      setLoading(false);
    };

    loadFinance();
  }, []);

  const filteredOrders = useMemo(() => {
    const startDate = getStartDate(period);

    if (!startDate) return orders;

    return orders.filter((order) => new Date(order.created_at) >= startDate);
  }, [orders, period]);

  const realSalesOrders = filteredOrders.filter((order) =>
    REAL_SALE_STATUSES.includes(order.status)
  );

  const receivableOrders = filteredOrders.filter((order) =>
    RECEIVABLE_STATUSES.includes(order.status)
  );

  const canceledOrders = filteredOrders.filter(
    (order) => order.status === "cancelado"
  );

  const realIncome = realSalesOrders.reduce(
    (total, order) => total + Number(order.total_price ?? 0),
    0
  );

  const receivableValue = receivableOrders.reduce(
    (total, order) => total + Number(order.total_price ?? 0),
    0
  );

  const estimatedIva = realIncome - realIncome / (1 + IVA_RATE);

  const subtotalWithoutIva = realIncome - estimatedIva;

  const averageTicket =
    realSalesOrders.length > 0 ? realIncome / realSalesOrders.length : 0;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] p-6 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
          Finanzas
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Módulo financiero ADDA
        </h1>

        <p className="mt-2 max-w-3xl text-blue-100">
          Resumen financiero preparado para ventas reales, cartera, IVA estimado
          y futuros reportes contables compatibles con procesos DIAN.
        </p>
      </div>

      <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Periodo de análisis
        </label>

        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value as PeriodFilter)}
          className="w-full max-w-xs rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
        >
          <option value="today">Hoy</option>
          <option value="week">Últimos 7 días</option>
          <option value="month">Mes actual</option>
          <option value="year">Año actual</option>
          <option value="all">Todo el historial</option>
        </select>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-8 text-center text-slate-600 shadow-sm ring-1 ring-slate-200">
          Cargando información financiera...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-green-200">
              <p className="text-sm font-semibold text-slate-500">
                Ingresos reales
              </p>
              <h2 className="mt-3 text-3xl font-bold text-green-700">
                {formatPrice(realIncome)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Pagado + enviado + entregado
              </p>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-amber-200">
              <p className="text-sm font-semibold text-slate-500">
                Cartera pendiente
              </p>
              <h2 className="mt-3 text-3xl font-bold text-amber-700">
                {formatPrice(receivableValue)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Pendiente + confirmado
              </p>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-200">
              <p className="text-sm font-semibold text-slate-500">
                IVA estimado
              </p>
              <h2 className="mt-3 text-3xl font-bold text-[#2D5398]">
                {formatPrice(estimatedIva)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Cálculo referencial al 19%
              </p>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-500">
                Ticket promedio
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                {formatPrice(averageTicket)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Promedio por venta real
              </p>
            </article>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-500">
                Base antes de IVA
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                {formatPrice(subtotalWithoutIva)}
              </h2>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-green-200">
              <p className="text-sm font-semibold text-slate-500">
                Ventas reales
              </p>
              <h2 className="mt-3 text-4xl font-bold text-green-700">
                {realSalesOrders.length}
              </h2>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-red-200">
              <p className="text-sm font-semibold text-slate-500">
                Cancelaciones
              </p>
              <h2 className="mt-3 text-4xl font-bold text-red-700">
                {canceledOrders.length}
              </h2>
            </article>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Movimientos financieros recientes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Vista de pedidos del periodo seleccionado.
              </p>

              <div className="mt-5 space-y-3">
                {filteredOrders.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    No hay movimientos en este periodo.
                  </p>
                ) : (
                  filteredOrders.slice(0, 8).map((order) => (
                    <div
                      key={order.id}
                      className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_0.9fr_0.7fr]"
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
                          {order.city}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatDate(order.created_at)}
                        </p>
                      </div>

                      <div>
                        <p className="font-bold text-slate-900">
                          {formatPrice(Number(order.total_price ?? 0))}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
                          {order.status}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <aside className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Preparación DIAN
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Esta versión estima IVA sobre ventas reales. Para una declaración
                formal se deben separar productos gravados, exentos y excluidos,
                además de registrar datos del comprador y tipo de comprobante.
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <div className="rounded-2xl bg-blue-50 p-4 text-[#2D5398]">
                  Próximo paso: agregar medio de pago y tipo de documento.
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Futuro: exportar CSV/Excel para contador.
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Futuro: estado DIAN, CUFE y notas crédito.
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
};