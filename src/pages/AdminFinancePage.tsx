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

type BusinessSettings = {
  tax_mode: "sin_iva" | "con_iva";
  tax_rate: number | string | null;
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
  baseIncome: number;
  cost: number;
  profit: number;
  margin: number;
};

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

const normalizeTaxRate = (value: number | string | null | undefined) => {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue) || numericValue <= 0) return 0;

  return numericValue > 1 ? numericValue / 100 : numericValue;
};

const getBaseWithoutTax = (total: number, taxMode: string, taxRate: number) => {
  if (taxMode !== "con_iva" || taxRate <= 0) return total;

  return total / (1 + taxRate);
};

const getTaxAmount = (total: number, taxMode: string, taxRate: number) => {
  if (taxMode !== "con_iva" || taxRate <= 0) return 0;

  return total - total / (1 + taxRate);
};

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
  const [businessSettings, setBusinessSettings] =
    useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const [profitabilityWarning, setProfitabilityWarning] = useState<string | null>(
    null
  );

  useEffect(() => {
    const loadFinance = async () => {
      setLoading(true);
      setProfitabilityWarning(null);

      const { data: settingsData, error: settingsError } = await supabase
        .from("business_settings")
        .select("tax_mode, tax_rate")
        .limit(1)
        .maybeSingle();

      if (settingsError) {
        console.error("Error cargando configuración fiscal:", settingsError.message);
        setBusinessSettings({
          tax_mode: "sin_iva",
          tax_rate: 0,
        });
        setProfitabilityWarning(
          "No fue posible cargar la configuración fiscal. El módulo financiero usará valores sin IVA como respaldo."
        );
      } else {
        setBusinessSettings(
          (settingsData as BusinessSettings | null) ?? {
            tax_mode: "sin_iva",
            tax_rate: 0,
          }
        );
      }

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

  const taxMode = businessSettings?.tax_mode ?? "sin_iva";
  const taxRate = normalizeTaxRate(businessSettings?.tax_rate);
  const taxRateLabel = taxMode === "con_iva" ? formatPercent(taxRate * 100) : "0%";

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

  const estimatedIva = getTaxAmount(realIncome, taxMode, taxRate);
  const subtotalWithoutIva = getBaseWithoutTax(realIncome, taxMode, taxRate);

  const averageTicket =
    realSalesOrders.length > 0 ? realIncome / realSalesOrders.length : 0;

  const productProfitRows = useMemo(() => {
    const rows = new Map<string, ProductProfitRow>();

    realSalesItems.forEach((item) => {
      const product = productCostMap.get(item.product_id);
      const costPrice = Number(product?.cost_price ?? 0);
      const quantity = Number(item.quantity ?? 0);
      const income = Number(item.subtotal ?? 0);
      const baseIncome = getBaseWithoutTax(income, taxMode, taxRate);
      const cost = costPrice * quantity;
      const profit = baseIncome - cost;
      const current = rows.get(item.product_id);

      if (current) {
        current.quantity += quantity;
        current.income += income;
        current.baseIncome += baseIncome;
        current.cost += cost;
        current.profit += profit;
        current.margin =
          current.baseIncome > 0 ? (current.profit / current.baseIncome) * 100 : 0;
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
        baseIncome,
        cost,
        profit,
        margin: baseIncome > 0 ? (profit / baseIncome) * 100 : 0,
      });
    });

    return Array.from(rows.values());
  }, [realSalesItems, productCostMap, taxMode, taxRate]);

  const grossProfit = productProfitRows.reduce(
    (total, product) => total + product.profit,
    0
  );

  const totalCost = productProfitRows.reduce(
    (total, product) => total + product.cost,
    0
  );

  const businessMargin =
    subtotalWithoutIva > 0 ? (grossProfit / subtotalWithoutIva) * 100 : 0;

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
      { month: string; income: number; baseIncome: number; cost: number; profit: number; margin: number }
    >();

    realSalesOrders.forEach((order) => {
      const monthKey = order.created_at.slice(0, 7);
      const income = Number(order.total_price ?? 0);
      const baseIncome = getBaseWithoutTax(income, taxMode, taxRate);

      const current = rows.get(monthKey) ?? {
        month: monthKey,
        income: 0,
        baseIncome: 0,
        cost: 0,
        profit: 0,
        margin: 0,
      };

      current.income += income;
      current.baseIncome += baseIncome;
      rows.set(monthKey, current);
    });

    realSalesItems.forEach((item) => {
      const order = realSalesOrders.find(
        (currentOrder) => currentOrder.id === item.order_id
      );

      if (!order) return;

      const monthKey = order.created_at.slice(0, 7);
      const product = productCostMap.get(item.product_id);
      const costPrice = Number(product?.cost_price ?? 0);
      const quantity = Number(item.quantity ?? 0);
      const current = rows.get(monthKey);

      if (!current) return;

      current.cost += costPrice * quantity;
      current.profit = current.baseIncome - current.cost;
      current.margin =
        current.baseIncome > 0 ? (current.profit / current.baseIncome) * 100 : 0;
    });

    return Array.from(rows.values()).sort((a, b) =>
      b.month.localeCompare(a.month)
    );
  }, [realSalesOrders, realSalesItems, productCostMap, taxMode, taxRate]);

  const bestMonth = [...monthlyProfitRows].sort((a, b) => b.profit - a.profit)[0];

  const exportFinancialCsv = () => {
    const headers = [
      "Pedido",
      "Cliente",
      "Ciudad",
      "Fecha",
      "Estado",
      "Total cobrado",
      "Base sin IVA",
      `IVA ${taxRateLabel}`,
      "Modo IVA",
      "Tipo de movimiento",
      "Costo estimado",
      "Utilidad bruta",
      "Margen bruto",
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
      const iva = getTaxAmount(total, taxMode, taxRate);
      const base = getBaseWithoutTax(total, taxMode, taxRate);

      const orderCost = REAL_SALE_STATUSES.includes(order.status)
        ? costByOrder.get(order.id) ?? 0
        : 0;

      const orderProfit = REAL_SALE_STATUSES.includes(order.status)
        ? base - orderCost
        : 0;

      const orderMargin =
        base > 0 && REAL_SALE_STATUSES.includes(order.status)
          ? (orderProfit / base) * 100
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
        taxMode,
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
          Finanzas PRO
        </p>

        <h1 className="mt-2 text-3xl font-bold">Módulo financiero ADDA</h1>

        <p className="mt-2 max-w-3xl text-blue-100">
          Resumen financiero preparado para ventas reales, cartera, IVA desde
          configuración fiscal y utilidad bruta por producto.
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

          <div className="mb-6 rounded-3xl bg-blue-50 p-5 text-sm text-[#2D5398] ring-1 ring-blue-100">
            <span className="font-bold">Configuración fiscal activa:</span>{" "}
            {taxMode === "con_iva"
              ? `Precios con IVA incluido. Tarifa aplicada: ${taxRateLabel}.`
              : "Modo sin IVA. Los valores se calculan sin impuesto."}
          </div>

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

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-200">
              <p className="text-sm font-semibold text-slate-500">
                Base sin IVA
              </p>
              <h2 className="mt-3 text-3xl font-bold text-[#2D5398]">
                {formatPrice(subtotalWithoutIva)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Valor real usado para margen
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
                Base sin IVA menos costo de producto
              </p>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-200">
              <p className="text-sm font-semibold text-slate-500">
                Margen bruto
              </p>
              <h2 className={`mt-3 text-3xl font-bold ${getMarginTextClass(businessMargin)}`}>
                {formatPercent(businessMargin)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Utilidad bruta / base sin IVA
              </p>
            </article>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-200">
              <p className="text-sm font-semibold text-slate-500">
                IVA calculado
              </p>
              <h2 className="mt-3 text-3xl font-bold text-[#2D5398]">
                {formatPrice(estimatedIva)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Según configuración fiscal del admin
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
                          {product.sku ?? "Sin SKU"} ·{" "}
                          {product.category ?? "Sin categoría"}
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
                          Vendidos: {product.quantity} ·{" "}
                          {product.brand ?? "Sin marca"}
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
                      con utilidad bruta de{" "}
                      <span className="font-bold">
                        {formatPrice(bestMonth.profit)}
                      </span>
                      .
                    </>
                  )}
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Utilidad bruta actual: base sin IVA menos costo del producto.
                  Todavía no descuenta pasarela, envíos, publicidad, devoluciones
                  ni gastos operativos.
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Próximo salto contable: guardar el costo histórico del producto
                  en cada item del pedido para evitar que cambios futuros de costo
                  alteren reportes anteriores.
                </div>
              </div>

              <h2 className="mt-6 text-xl font-bold text-slate-900">
                Preparación contable
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Esta versión calcula IVA según la configuración fiscal del admin.
                Para utilidad neta contable se deben registrar comisiones de pasarela,
                logística, publicidad, devoluciones, gastos operativos e impuestos.
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <div className="rounded-2xl bg-blue-50 p-4 text-[#2D5398]">
                  Próximo paso: guardar costo histórico por item vendido.
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Exportación CSV lista para Excel o Google Sheets.
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Futuro: pasarela de pago, costos logísticos, devoluciones y
                  utilidad neta.
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
};