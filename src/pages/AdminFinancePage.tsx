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

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

type ProductCost = {
  id: string;
  name: string;
  sku: string | null;
  brand: string | null;
  category: string | null;
  cost_price: number | string | null;
};

type PeriodFilter = "today" | "week" | "month" | "year" | "all";

type ProductProfitRow = {
  productId: string;
  productName: string;
  sku: string | null;
  brand: string | null;
  category: string | null;
  quantity: number;
  income: number;
  cost: number;
  profit: number;
  margin: number;
};

const IVA_RATE = 0.19;
const LOW_MARGIN_LIMIT = 15;

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

const formatMonth = (value: string) =>
  new Date(value).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
  });

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

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

const getPeriodLabel = (period: PeriodFilter) => {
  const labels: Record<PeriodFilter, string> = {
    today: "hoy",
    week: "ultimos_7_dias",
    month: "mes_actual",
    year: "anio_actual",
    all: "todo_el_historial",
  };

  return labels[period];
};

const escapeCsvValue = (value: string | number) => {
  const cleanValue = String(value).replace(/"/g, '""');
  return `"${cleanValue}"`;
};

const getMarginTextClass = (margin: number) => {
  if (margin < 0) return "text-red-700";
  if (margin < LOW_MARGIN_LIMIT) return "text-amber-700";
  return "text-green-700";
};

const getMarginBadgeClass = (margin: number) => {
  if (margin < 0) return "bg-red-100 text-red-700";
  if (margin < LOW_MARGIN_LIMIT) return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
};

export const AdminFinancePage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<ProductCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const [profitabilityWarning, setProfitabilityWarning] = useState<string | null>(
    null
  );

  useEffect(() => {
    const loadFinance = async () => {
      setLoading(true);
      setProfitabilityWarning(null);

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          "id, order_number, customer_name, city, total_price, status, created_at"
        )
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error cargando finanzas:", ordersError.message);
        setOrders([]);
      } else {
        setOrders((ordersData ?? []) as Order[]);
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("id, order_id, product_id, product_name, price, quantity, subtotal");

      if (itemsError) {
        console.error("Error cargando detalle de rentabilidad:", itemsError.message);
        setOrderItems([]);
        setProfitabilityWarning(
          "No fue posible cargar el detalle de productos vendidos. Los indicadores generales siguen funcionando."
        );
      } else {
        setOrderItems((itemsData ?? []) as OrderItem[]);
      }

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, sku, brand, category, cost_price");

      if (productsError) {
        console.error("Error cargando costos de productos:", productsError.message);
        setProducts([]);
        setProfitabilityWarning(
          "No fue posible cargar costos de productos. La rentabilidad puede quedar incompleta."
        );
      } else {
        setProducts((productsData ?? []) as ProductCost[]);
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

  const realSaleOrderIds = useMemo(
    () => new Set(realSalesOrders.map((order) => order.id)),
    [realSalesOrders]
  );

  const productCostMap = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, [products]);

  const realSalesItems = useMemo(() => {
    return orderItems.filter((item) => realSaleOrderIds.has(item.order_id));
  }, [orderItems, realSaleOrderIds]);

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

  const productProfitRows = useMemo(() => {
    const rows = new Map<string, ProductProfitRow>();

    realSalesItems.forEach((item) => {
      const product = productCostMap.get(item.product_id);
      const costPrice = Number(product?.cost_price ?? 0);
      const quantity = Number(item.quantity ?? 0);
      const income = Number(item.subtotal ?? 0);
      const cost = costPrice * quantity;
      const profit = income - cost;
      const current = rows.get(item.product_id);

      if (current) {
        current.quantity += quantity;
        current.income += income;
        current.cost += cost;
        current.profit += profit;
        current.margin = current.income > 0 ? (current.profit / current.income) * 100 : 0;
        return;
      }

      rows.set(item.product_id, {
        productId: item.product_id,
        productName: product?.name ?? item.product_name,
        sku: product?.sku ?? null,
        brand: product?.brand ?? null,
        category: product?.category ?? null,
        quantity,
        income,
        cost,
        profit,
        margin: income > 0 ? (profit / income) * 100 : 0,
      });
    });

    return Array.from(rows.values());
  }, [realSalesItems, productCostMap]);

  const grossProfit = productProfitRows.reduce(
    (total, product) => total + product.profit,
    0
  );

  const totalCost = productProfitRows.reduce(
    (total, product) => total + product.cost,
    0
  );

  const businessMargin = realIncome > 0 ? (grossProfit / realIncome) * 100 : 0;

  const averageGrossProfit =
    realSalesOrders.length > 0 ? grossProfit / realSalesOrders.length : 0;

  const profitableProducts = [...productProfitRows]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  const lowMarginProducts = [...productProfitRows]
    .filter((product) => product.margin < LOW_MARGIN_LIMIT)
    .sort((a, b) => a.margin - b.margin)
    .slice(0, 5);

  const monthlyProfitRows = useMemo(() => {
    const rows = new Map<
      string,
      { month: string; income: number; cost: number; profit: number; margin: number }
    >();

    realSalesOrders.forEach((order) => {
      const monthKey = order.created_at.slice(0, 7);
      const current = rows.get(monthKey) ?? {
        month: monthKey,
        income: 0,
        cost: 0,
        profit: 0,
        margin: 0,
      };

      current.income += Number(order.total_price ?? 0);
      rows.set(monthKey, current);
    });

    realSalesItems.forEach((item) => {
      const order = realSalesOrders.find((currentOrder) => currentOrder.id === item.order_id);

      if (!order) return;

      const monthKey = order.created_at.slice(0, 7);
      const product = productCostMap.get(item.product_id);
      const costPrice = Number(product?.cost_price ?? 0);
      const quantity = Number(item.quantity ?? 0);
      const current = rows.get(monthKey);

      if (!current) return;

      current.cost += costPrice * quantity;
      current.profit = current.income - current.cost;
      current.margin = current.income > 0 ? (current.profit / current.income) * 100 : 0;
    });

    return Array.from(rows.values()).sort((a, b) => b.month.localeCompare(a.month));
  }, [realSalesOrders, realSalesItems, productCostMap]);

  const bestMonth = [...monthlyProfitRows].sort((a, b) => b.profit - a.profit)[0];

  const exportFinancialCsv = () => {
    const headers = [
      "Pedido",
      "Cliente",
      "Ciudad",
      "Fecha",
      "Estado",
      "Total",
      "Base estimada sin IVA",
      "IVA estimado 19%",
      "Tipo de movimiento",
      "Costo estimado",
      "Utilidad bruta estimada",
      "Margen estimado",
    ];

    const costByOrder = new Map<string, number>();

    realSalesItems.forEach((item) => {
      const product = productCostMap.get(item.product_id);
      const costPrice = Number(product?.cost_price ?? 0);
      const itemCost = costPrice * Number(item.quantity ?? 0);

      costByOrder.set(item.order_id, (costByOrder.get(item.order_id) ?? 0) + itemCost);
    });

    const rows = filteredOrders.map((order) => {
      const total = Number(order.total_price ?? 0);
      const iva = total - total / (1 + IVA_RATE);
      const base = total - iva;
      const orderCost = REAL_SALE_STATUSES.includes(order.status)
        ? costByOrder.get(order.id) ?? 0
        : 0;
      const orderProfit = REAL_SALE_STATUSES.includes(order.status)
        ? total - orderCost
        : 0;
      const orderMargin =
        total > 0 && REAL_SALE_STATUSES.includes(order.status)
          ? (orderProfit / total) * 100
          : 0;

      const movementType = REAL_SALE_STATUSES.includes(order.status)
        ? "Venta real"
        : RECEIVABLE_STATUSES.includes(order.status)
        ? "Cartera pendiente"
        : order.status === "cancelado"
        ? "Cancelado"
        : "Otro";

      return [
        order.order_number,
        order.customer_name,
        order.city,
        formatDate(order.created_at),
        order.status,
        total,
        Math.round(base),
        Math.round(iva),
        movementType,
        Math.round(orderCost),
        Math.round(orderProfit),
        `${orderMargin.toFixed(1)}%`,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `reporte_financiero_adda_${getPeriodLabel(period)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] p-6 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
          Finanzas
        </p>

        <h1 className="mt-2 text-3xl font-bold">Módulo financiero ADDA</h1>

        <p className="mt-2 max-w-3xl text-blue-100">
          Resumen financiero preparado para ventas reales, cartera, IVA estimado
          y futuros reportes contables compatibles con procesos DIAN.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-end md:justify-between">
        <div>
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

        <button
          type="button"
          onClick={exportFinancialCsv}
          disabled={loading || filteredOrders.length === 0}
          className="inline-flex rounded-xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Exportar CSV / Excel
        </button>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-8 text-center text-slate-600 shadow-sm ring-1 ring-slate-200">
          Cargando información financiera...
        </div>
      ) : (
        <>
          {profitabilityWarning && (
            <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-medium text-amber-800">
              {profitabilityWarning}
            </div>
          )}

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

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-200">
              <p className="text-sm font-semibold text-slate-500">
                Utilidad bruta
              </p>
              <h2 className="mt-3 text-3xl font-bold text-emerald-700">
                {formatPrice(grossProfit)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Ventas reales menos costo de producto
              </p>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-200">
              <p className="text-sm font-semibold text-slate-500">
                Margen negocio
              </p>
              <h2 className={`mt-3 text-3xl font-bold ${getMarginTextClass(businessMargin)}`}>
                {formatPercent(businessMargin)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Utilidad bruta / ingresos reales
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
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-200">
              <p className="text-sm font-semibold text-slate-500">
                Utilidad promedio
              </p>
              <h2 className="mt-3 text-3xl font-bold text-emerald-700">
                {formatPrice(averageGrossProfit)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Utilidad bruta promedio por pedido
              </p>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-500">
                Costo de mercancía
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                {formatPrice(totalCost)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Costo estimado de productos vendidos
              </p>
            </article>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
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

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-amber-200">
              <p className="text-sm font-semibold text-slate-500">
                Margen bajo
              </p>
              <h2 className="mt-3 text-4xl font-bold text-amber-700">
                {lowMarginProducts.length}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Productos bajo {LOW_MARGIN_LIMIT}% de margen
              </p>
            </article>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Top productos rentables
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Ranking por utilidad bruta en ventas reales del periodo.
              </p>

              <div className="mt-5 space-y-3">
                {profitableProducts.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    Aún no hay detalle suficiente para calcular productos rentables.
                  </p>
                ) : (
                  profitableProducts.map((product) => (
                    <div
                      key={product.productId}
                      className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_0.7fr_0.7fr]"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {product.productName}
                        </p>
                        <p className="text-sm text-slate-500">
                          {product.sku ?? "Sin SKU"} · {product.category ?? "Sin categoría"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Utilidad</p>
                        <p className="font-bold text-emerald-700">
                          {formatPrice(product.profit)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Margen</p>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getMarginBadgeClass(
                            product.margin
                          )}`}
                        >
                          {formatPercent(product.margin)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Productos con margen bajo
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Revisión comercial para descuentos, compras y precios.
              </p>

              <div className="mt-5 space-y-3">
                {lowMarginProducts.length === 0 ? (
                  <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
                    No se detectan productos por debajo del margen mínimo configurado.
                  </p>
                ) : (
                  lowMarginProducts.map((product) => (
                    <div
                      key={product.productId}
                      className="grid gap-3 rounded-2xl bg-amber-50 p-4 md:grid-cols-[1fr_0.7fr_0.7fr]"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {product.productName}
                        </p>
                        <p className="text-sm text-slate-500">
                          Vendidos: {product.quantity} · {product.brand ?? "Sin marca"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Utilidad</p>
                        <p className="font-bold text-amber-700">
                          {formatPrice(product.profit)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Margen</p>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getMarginBadgeClass(
                            product.margin
                          )}`}
                        >
                          {formatPercent(product.margin)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
                        <p className="text-sm text-slate-600">{order.city}</p>
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
                Lectura gerencial
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-2xl bg-blue-50 p-4 text-[#2D5398]">
                  Mejor mes:{" "}
                  <span className="font-bold">
                    {bestMonth ? formatMonth(`${bestMonth.month}-01`) : "Sin datos"}
                  </span>
                  {bestMonth && (
                    <>
                      {" "}
                      con utilidad de{" "}
                      <span className="font-bold">{formatPrice(bestMonth.profit)}</span>.
                    </>
                  )}
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Utilidad bruta actual: ventas reales menos costo del producto.
                  Todavía no descuenta pasarela, envíos, publicidad, devoluciones
                  ni gastos operativos.
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Próximo salto contable: guardar cost_price_snapshot en cada
                  item del pedido para conservar el costo histórico exacto.
                </div>
              </div>

              <h2 className="mt-6 text-xl font-bold text-slate-900">
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
                  Exportación CSV lista para Excel o Google Sheets.
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
