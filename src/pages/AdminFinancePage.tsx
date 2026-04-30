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
  unit_cost?: number | string | null;
  base_price?: number | string | null;
  tax_amount?: number | string | null;
  gross_profit?: number | string | null;
  profit_margin?: number | string | null;
};

type ProductCost = {
  id: string;
  name: string;
  sku: string | null;
  brand: string | null;
  category: string | null;
  cost_price: number | string | null;
};

type BusinessExpense = {
  id: string;
  expense_date: string;
  category: string;
  description: string | null;
  amount: number | string;
  created_at: string;
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

type ExpenseCategoryRow = {
  category: string;
  amount: number;
  percent: number;
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
  const [expenses, setExpenses] = useState<BusinessExpense[]>([]);
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
        .select(
          "id, order_id, product_id, product_name, price, quantity, subtotal, unit_cost, base_price, tax_amount, gross_profit, profit_margin"
        );

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

      const { data: expensesData, error: expensesError } = await supabase
        .from("business_expenses")
        .select("id, expense_date, category, description, amount, created_at")
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (expensesError) {
        console.error("Error cargando gastos operativos:", expensesError.message);
        setExpenses([]);
        setProfitabilityWarning(
          "No fue posible cargar gastos operativos. La utilidad neta puede quedar incompleta."
        );
      } else {
        setExpenses((expensesData ?? []) as BusinessExpense[]);
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

  const filteredExpenses = useMemo(() => {
    const startDate = getStartDate(period);

    if (!startDate) return expenses;

    return expenses.filter((expense) => {
      const expenseDate = new Date(`${expense.expense_date}T00:00:00`);
      return expenseDate >= startDate;
    });
  }, [expenses, period]);

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
      const quantity = Number(item.quantity ?? 0);
      const income = Number(item.subtotal ?? 0);

      const snapshotBase = Number(item.base_price ?? 0);
      const snapshotCost = Number(item.unit_cost ?? 0) * quantity;
      const snapshotProfit = Number(item.gross_profit ?? 0);

      const hasSnapshot =
        snapshotBase > 0 ||
        snapshotCost > 0 ||
        snapshotProfit !== 0 ||
        Number(item.profit_margin ?? 0) !== 0;

      const fallbackBaseIncome = getBaseWithoutTax(income, taxMode, taxRate);
      const fallbackCost = Number(product?.cost_price ?? 0) * quantity;
      const fallbackProfit = fallbackBaseIncome - fallbackCost;

      const baseIncome = hasSnapshot ? snapshotBase : fallbackBaseIncome;
      const cost = hasSnapshot ? snapshotCost : fallbackCost;
      const profit = hasSnapshot ? snapshotProfit : fallbackProfit;

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

  const totalExpenses = filteredExpenses.reduce(
    (total, expense) => total + Number(expense.amount ?? 0),
    0
  );

  const netProfit = grossProfit - totalExpenses;

  const businessMargin =
    subtotalWithoutIva > 0 ? (grossProfit / subtotalWithoutIva) * 100 : 0;

  const netMargin =
    subtotalWithoutIva > 0 ? (netProfit / subtotalWithoutIva) * 100 : 0;

  const averageGrossProfit =
    realSalesOrders.length > 0 ? grossProfit / realSalesOrders.length : 0;

  const averageNetProfit =
    realSalesOrders.length > 0 ? netProfit / realSalesOrders.length : 0;

  const profitableProducts = [...productProfitRows]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  const lowMarginProducts = [...productProfitRows]
    .filter((product) => product.margin < LOW_MARGIN_LIMIT)
    .sort((a, b) => a.margin - b.margin)
    .slice(0, 5);

  const lossProducts = [...productProfitRows]
    .filter((product) => product.profit < 0 || product.margin < 0)
    .sort((a, b) => a.margin - b.margin);

  const expenseCategoryRows = useMemo(() => {
    const rows = new Map<string, number>();

    filteredExpenses.forEach((expense) => {
      const category = expense.category || "Sin categoría";
      const amount = Number(expense.amount ?? 0);
      rows.set(category, (rows.get(category) ?? 0) + amount);
    });

    return Array.from(rows.entries())
      .map(([category, amount]): ExpenseCategoryRow => ({
        category,
        amount,
        percent: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalExpenses]);

  const monthlyProfitRows = useMemo(() => {
    const rows = new Map<
      string,
      {
        month: string;
        income: number;
        baseIncome: number;
        cost: number;
        grossProfit: number;
        expenses: number;
        netProfit: number;
        grossMargin: number;
        netMargin: number;
      }
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
        grossProfit: 0,
        expenses: 0,
        netProfit: 0,
        grossMargin: 0,
        netMargin: 0,
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
      const current = rows.get(monthKey);

      if (!current) return;

      const quantity = Number(item.quantity ?? 0);
      const income = Number(item.subtotal ?? 0);

      const snapshotBase = Number(item.base_price ?? 0);
      const snapshotCost = Number(item.unit_cost ?? 0) * quantity;
      const snapshotProfit = Number(item.gross_profit ?? 0);

      const hasSnapshot =
        snapshotBase > 0 ||
        snapshotCost > 0 ||
        snapshotProfit !== 0 ||
        Number(item.profit_margin ?? 0) !== 0;

      const product = productCostMap.get(item.product_id);
      const fallbackBaseIncome = getBaseWithoutTax(income, taxMode, taxRate);
      const fallbackCost = Number(product?.cost_price ?? 0) * quantity;
      const fallbackProfit = fallbackBaseIncome - fallbackCost;

      current.cost += hasSnapshot ? snapshotCost : fallbackCost;
      current.grossProfit += hasSnapshot ? snapshotProfit : fallbackProfit;
    });

    filteredExpenses.forEach((expense) => {
      const monthKey = expense.expense_date.slice(0, 7);
      const current = rows.get(monthKey) ?? {
        month: monthKey,
        income: 0,
        baseIncome: 0,
        cost: 0,
        grossProfit: 0,
        expenses: 0,
        netProfit: 0,
        grossMargin: 0,
        netMargin: 0,
      };

      current.expenses += Number(expense.amount ?? 0);
      rows.set(monthKey, current);
    });

    rows.forEach((row) => {
      row.netProfit = row.grossProfit - row.expenses;
      row.grossMargin =
        row.baseIncome > 0 ? (row.grossProfit / row.baseIncome) * 100 : 0;
      row.netMargin =
        row.baseIncome > 0 ? (row.netProfit / row.baseIncome) * 100 : 0;
    });

    return Array.from(rows.values()).sort((a, b) =>
      b.month.localeCompare(a.month)
    );
  }, [
    realSalesOrders,
    realSalesItems,
    filteredExpenses,
    productCostMap,
    taxMode,
    taxRate,
  ]);

  const bestMonth = [...monthlyProfitRows].sort(
    (a, b) => b.netProfit - a.netProfit
  )[0];

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
      "Costo",
      "Utilidad bruta",
      "Margen bruto",
    ];

    const costByOrder = new Map<string, number>();
    const profitByOrder = new Map<string, number>();
    const baseByOrder = new Map<string, number>();

    realSalesItems.forEach((item) => {
      const quantity = Number(item.quantity ?? 0);
      const subtotal = Number(item.subtotal ?? 0);

      const snapshotBase = Number(item.base_price ?? 0);
      const snapshotCost = Number(item.unit_cost ?? 0) * quantity;
      const snapshotProfit = Number(item.gross_profit ?? 0);

      const hasSnapshot =
        snapshotBase > 0 ||
        snapshotCost > 0 ||
        snapshotProfit !== 0 ||
        Number(item.profit_margin ?? 0) !== 0;

      const product = productCostMap.get(item.product_id);
      const fallbackBase = getBaseWithoutTax(subtotal, taxMode, taxRate);
      const fallbackCost = Number(product?.cost_price ?? 0) * quantity;
      const fallbackProfit = fallbackBase - fallbackCost;

      const itemBase = hasSnapshot ? snapshotBase : fallbackBase;
      const itemCost = hasSnapshot ? snapshotCost : fallbackCost;
      const itemProfit = hasSnapshot ? snapshotProfit : fallbackProfit;

      baseByOrder.set(item.order_id, (baseByOrder.get(item.order_id) ?? 0) + itemBase);
      costByOrder.set(item.order_id, (costByOrder.get(item.order_id) ?? 0) + itemCost);
      profitByOrder.set(
        item.order_id,
        (profitByOrder.get(item.order_id) ?? 0) + itemProfit
      );
    });

    const rows = filteredOrders.map((order) => {
      const total = Number(order.total_price ?? 0);
      const iva = getTaxAmount(total, taxMode, taxRate);
      const base = REAL_SALE_STATUSES.includes(order.status)
        ? baseByOrder.get(order.id) ?? getBaseWithoutTax(total, taxMode, taxRate)
        : getBaseWithoutTax(total, taxMode, taxRate);

      const orderCost = REAL_SALE_STATUSES.includes(order.status)
        ? costByOrder.get(order.id) ?? 0
        : 0;

      const orderProfit = REAL_SALE_STATUSES.includes(order.status)
        ? profitByOrder.get(order.id) ?? 0
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

    const expenseHeaders = [
      "Tipo",
      "Fecha",
      "Categoria",
      "Descripcion",
      "Valor",
    ];

    const expenseRows = filteredExpenses.map((expense) => [
      "Gasto operativo",
      expense.expense_date,
      expense.category,
      expense.description ?? "",
      Number(expense.amount ?? 0),
    ]);

    const lossHeaders = [
      "Producto con pérdida",
      "SKU",
      "Categoría",
      "Cantidad",
      "Base venta",
      "Costo",
      "Utilidad",
      "Margen",
    ];

    const lossRows = lossProducts.map((product) => [
      product.productName,
      product.sku ?? "",
      product.category ?? "",
      product.quantity,
      Math.round(product.baseIncome),
      Math.round(product.cost),
      Math.round(product.profit),
      `${product.margin.toFixed(1)}%`,
    ]);

    const summaryRows = [
      [],
      ["Resumen"],
      ["Ingresos reales", realIncome],
      ["Base sin IVA", Math.round(subtotalWithoutIva)],
      ["IVA calculado", Math.round(estimatedIva)],
      ["Costo mercancía", Math.round(totalCost)],
      ["Utilidad bruta", Math.round(grossProfit)],
      ["Gastos operativos", Math.round(totalExpenses)],
      ["Utilidad neta", Math.round(netProfit)],
      ["Margen bruto", `${businessMargin.toFixed(1)}%`],
      ["Margen neto", `${netMargin.toFixed(1)}%`],
      [],
      expenseHeaders,
      ...expenseRows,
      [],
      lossHeaders,
      ...lossRows,
    ];

    const csvContent = [headers, ...rows, ...summaryRows]
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
          Resumen financiero con ventas reales, IVA fiscal, utilidad bruta,
          gastos operativos, utilidad neta, margen neto y alertas de pérdida.
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

          {lossProducts.length > 0 && (
            <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-800">
              <h2 className="text-lg font-bold">
                Alerta: productos vendidos con pérdida
              </h2>
              <p className="mt-1 text-sm">
                Se detectaron productos con utilidad o margen negativo. Revisa precios,
                costos y descuentos antes de seguir vendiéndolos.
              </p>
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

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-red-200">
              <p className="text-sm font-semibold text-slate-500">
                Gastos operativos
              </p>
              <h2 className="mt-3 text-3xl font-bold text-red-700">
                {formatPrice(totalExpenses)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Publicidad, logística, operación y otros
              </p>
            </article>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-200">
              <p className="text-sm font-semibold text-slate-500">
                Utilidad neta
              </p>
              <h2 className={`mt-3 text-3xl font-bold ${getMarginTextClass(netMargin)}`}>
                {formatPrice(netProfit)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Utilidad bruta menos gastos operativos
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

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-200">
              <p className="text-sm font-semibold text-slate-500">
                Margen neto
              </p>
              <h2 className={`mt-3 text-3xl font-bold ${getMarginTextClass(netMargin)}`}>
                {formatPercent(netMargin)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Utilidad neta / base sin IVA
              </p>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-red-200">
              <p className="text-sm font-semibold text-slate-500">
                Productos con pérdida
              </p>
              <h2 className="mt-3 text-4xl font-bold text-red-700">
                {lossProducts.length}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Margen o utilidad negativa
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
                Utilidad bruta promedio
              </p>
              <h2 className="mt-3 text-3xl font-bold text-emerald-700">
                {formatPrice(averageGrossProfit)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Por pedido real
              </p>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-200">
              <p className="text-sm font-semibold text-slate-500">
                Utilidad neta promedio
              </p>
              <h2 className="mt-3 text-3xl font-bold text-purple-700">
                {formatPrice(averageNetProfit)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Después de gastos operativos
              </p>
            </article>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-500">
                Costo de mercancía
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                {formatPrice(totalCost)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Costo de productos vendidos
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

          {lossProducts.length > 0 && (
            <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-red-200">
              <h2 className="text-xl font-bold text-red-700">
                Productos vendidos con pérdida
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Revisión prioritaria para ajustar precio, costo o descuento.
              </p>

              <div className="mt-5 space-y-3">
                {lossProducts.slice(0, 8).map((product) => (
                  <div
                    key={product.productId}
                    className="grid gap-3 rounded-2xl bg-red-50 p-4 md:grid-cols-[1fr_0.7fr_0.7fr_0.5fr]"
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
                      <p className="text-sm text-slate-500">Costo</p>
                      <p className="font-bold text-slate-900">
                        {formatPrice(product.cost)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Utilidad</p>
                      <p className="font-bold text-red-700">
                        {formatPrice(product.profit)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Margen</p>
                      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        {formatPercent(product.margin)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Gastos por categoría
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Distribución de gastos operativos del periodo.
              </p>

              <div className="mt-5 space-y-3">
                {expenseCategoryRows.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    No hay gastos operativos registrados en este periodo.
                  </p>
                ) : (
                  expenseCategoryRows.map((expense) => (
                    <div
                      key={expense.category}
                      className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_0.7fr_0.5fr]"
                    >
                      <div>
                        <p className="font-semibold capitalize text-slate-900">
                          {expense.category}
                        </p>
                        <p className="text-sm text-slate-500">
                          Participación sobre gastos del periodo
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Valor</p>
                        <p className="font-bold text-red-700">
                          {formatPrice(expense.amount)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Peso</p>
                        <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          {formatPercent(expense.percent)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Gastos recientes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Últimos gastos registrados para el periodo seleccionado.
              </p>

              <div className="mt-5 space-y-3">
                {filteredExpenses.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    Aún no hay gastos para mostrar.
                  </p>
                ) : (
                  filteredExpenses.slice(0, 6).map((expense) => (
                    <div
                      key={expense.id}
                      className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_0.7fr]"
                    >
                      <div>
                        <p className="font-semibold capitalize text-slate-900">
                          {expense.category}
                        </p>
                        <p className="text-sm text-slate-500">
                          {expense.description || "Sin descripción"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(expense.expense_date)}
                        </p>
                      </div>

                      <div className="md:text-right">
                        <p className="text-sm text-slate-500">Valor</p>
                        <p className="font-bold text-red-700">
                          {formatPrice(Number(expense.amount ?? 0))}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
                      con utilidad neta de{" "}
                      <span className="font-bold">
                        {formatPrice(bestMonth.netProfit)}
                      </span>
                      .
                    </>
                  )}
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  Utilidad bruta: base sin IVA menos costo del producto.
                  Utilidad neta: utilidad bruta menos gastos operativos.
                </div>

                <div className="rounded-2xl bg-red-50 p-4 text-red-700">
                  Productos con pérdida detectados:{" "}
                  <span className="font-bold">{lossProducts.length}</span>.
                  Revisa precios, descuentos y costos antes de continuar vendiéndolos.
                </div>
              </div>

              <h2 className="mt-6 text-xl font-bold text-slate-900">
                Preparación contable
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Esta versión lee gastos operativos desde el módulo de gastos y permite
                evaluar utilidad neta aproximada. El siguiente nivel es automatizar
                comisiones Wompi / PayU, devoluciones e impuestos reales.
              </p>
            </aside>
          </div>
        </>
      )}
    </section>
  );
};