// src/pages/AdminOrdersPage.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { EnterpriseTable } from "../components/admin/EnterpriseTable";
import { MetricCard } from "../components/admin/MetricCard";
import { PageHero } from "../components/admin/PageHero";
import { StatusBadge } from "../components/admin/StatusBadge";

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
  email: string | null;
  address: string | null;
  city: string;
  notes: string | null;
  total_price: number;
  status: OrderStatus;
  stock_discounted: boolean;
  created_at: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

type ProductStock = {
  id: string;
  name: string;
  stock: number | null;
};

const statusOptions: OrderStatus[] = [
  "pendiente",
  "confirmado",
  "pagado",
  "enviado",
  "entregado",
  "cancelado",
];

const managementStatuses: OrderStatus[] = ["pendiente", "confirmado"];
const paidStatuses: OrderStatus[] = ["pagado", "entregado"];
const stockDiscountStatuses: OrderStatus[] = ["pagado", "enviado", "entregado"];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) => new Date(value).toLocaleString("es-CO");

const getStatusTone = (status: OrderStatus) => {
  const tones: Record<
    OrderStatus,
    "amber" | "blue" | "green" | "purple" | "dark" | "red"
  > = {
    pendiente: "amber",
    confirmado: "blue",
    pagado: "green",
    enviado: "purple",
    entregado: "dark",
    cancelado: "red",
  };

  return tones[status];
};

export const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | OrderStatus>(
    "todos"
  );

  const getOrders = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, phone, email, address, city, notes, total_price, status, stock_discounted, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando pedidos:", error.message);
      setOrders([]);
    } else {
      setOrders((data ?? []) as Order[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    getOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !normalizedSearch ||
        order.order_number.toLowerCase().includes(normalizedSearch) ||
        order.customer_name.toLowerCase().includes(normalizedSearch) ||
        order.phone.toLowerCase().includes(normalizedSearch) ||
        order.city.toLowerCase().includes(normalizedSearch) ||
        (order.email ?? "").toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "todos" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const ordersToManage = orders.filter((order) =>
    managementStatuses.includes(order.status)
  ).length;

  const paidSales = orders
    .filter((order) => paidStatuses.includes(order.status))
    .reduce((total, order) => total + Number(order.total_price ?? 0), 0);

  const shippedOrders = orders.filter(
    (order) => order.status === "enviado"
  ).length;

  const canceledOrders = orders.filter(
    (order) => order.status === "cancelado"
  ).length;

  const getOrderItems = async (orderId: string) => {
    const { data, error } = await supabase
      .from("order_items")
      .select("id, order_id, product_id, product_name, price, quantity, subtotal")
      .eq("order_id", orderId);

    if (error) throw new Error(error.message);

    const items = (data ?? []) as OrderItem[];

    if (items.length === 0) {
      throw new Error("El pedido no tiene productos asociados.");
    }

    return items;
  };

  const resolveProductForStock = async (item: OrderItem) => {
    if (item.product_id) {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock")
        .eq("id", item.product_id)
        .maybeSingle();

      if (error) {
        throw new Error(
          `No fue posible validar el producto "${item.product_name}".`
        );
      }

      if (data) return data as ProductStock;
    }

    const { data: productByName, error: productByNameError } = await supabase
      .from("products")
      .select("id, name, stock")
      .eq("name", item.product_name)
      .maybeSingle();

    if (productByNameError) {
      throw new Error(
        `No fue posible buscar el producto "${item.product_name}" por nombre.`
      );
    }

    if (!productByName) {
      throw new Error(
        `No se encontró el producto "${item.product_name}" en el catálogo real de Supabase.`
      );
    }

    const product = productByName as ProductStock;

    if (item.product_id !== product.id) {
      const { error: updateItemError } = await supabase
        .from("order_items")
        .update({ product_id: product.id })
        .eq("id", item.id);

      if (updateItemError) {
        throw new Error(
          `No fue posible corregir el ID del producto "${item.product_name}" en el pedido.`
        );
      }
    }

    return product;
  };

  const discountStockForOrder = async (orderId: string) => {
    const items = await getOrderItems(orderId);

    for (const item of items) {
      const product = await resolveProductForStock(item);
      const currentStock = Number(product.stock ?? 0);
      const quantity = Number(item.quantity ?? 0);
      const newStock = currentStock - quantity;

      if (newStock < 0) {
        throw new Error(
          `Stock insuficiente para "${product.name}". Stock actual: ${currentStock}, solicitado: ${quantity}.`
        );
      }

      const { error } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", product.id);

      if (error) {
        throw new Error(`No fue posible descontar stock de "${product.name}".`);
      }
    }
  };

  const restoreStockForOrder = async (orderId: string) => {
    const items = await getOrderItems(orderId);

    for (const item of items) {
      const product = await resolveProductForStock(item);
      const currentStock = Number(product.stock ?? 0);
      const quantity = Number(item.quantity ?? 0);
      const newStock = currentStock + quantity;

      const { error } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", product.id);

      if (error) {
        throw new Error(`No fue posible devolver stock de "${product.name}".`);
      }
    }
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    const currentOrder = orders.find((order) => order.id === orderId);
    if (!currentOrder) return;

    setUpdatingOrderId(orderId);

    try {
      const mustDiscountStock =
        stockDiscountStatuses.includes(newStatus) &&
        !currentOrder.stock_discounted;

      const mustRestoreStock =
        newStatus === "cancelado" && currentOrder.stock_discounted;

      if (mustDiscountStock) await discountStockForOrder(orderId);
      if (mustRestoreStock) await restoreStockForOrder(orderId);

      const nextStockDiscounted = mustRestoreStock
        ? false
        : currentOrder.stock_discounted || mustDiscountStock;

      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          stock_discounted: nextStockDiscounted,
        })
        .eq("id", orderId);

      if (error) throw new Error(error.message);

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                stock_discounted: nextStockDiscounted,
              }
            : order
        )
      );

      setSelectedOrder((current) =>
        current && current.id === orderId
          ? {
              ...current,
              status: newStatus,
              stock_discounted: nextStockDiscounted,
            }
          : current
      );
    } catch (error) {
      console.error("Error actualizando estado:", error);
      alert(
        error instanceof Error
          ? error.message
          : "No fue posible actualizar el estado del pedido."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleOpenDetail = async (order: Order) => {
    setSelectedOrder(order);
    setOrderItems([]);
    setLoadingDetail(true);

    const { data, error } = await supabase
      .from("order_items")
      .select("id, order_id, product_id, product_name, price, quantity, subtotal")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error cargando detalle del pedido:", error.message);
      setOrderItems([]);
    } else {
      setOrderItems((data ?? []) as OrderItem[]);
    }

    setLoadingDetail(false);
  };

  const handleCloseDetail = () => {
    setSelectedOrder(null);
    setOrderItems([]);
  };

  return (
    <section className="space-y-8">
      <PageHero
        eyebrow="Panel Administrador"
        title="Gestión de pedidos"
        description="Consulta, filtra, revisa detalles y actualiza el estado de los pedidos con una experiencia más clara, moderna y profesional."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Por gestionar"
          value={ordersToManage}
          description="Pendientes y confirmados"
          tone="blue"
        />

        <MetricCard
          title="Ventas pagadas"
          value={formatPrice(paidSales)}
          description="Pagados y entregados"
          tone="green"
        />

        <MetricCard
          title="Enviados"
          value={shippedOrders}
          description="En proceso de entrega"
          tone="purple"
        />

        <MetricCard
          title="Cancelados"
          value={canceledOrders}
          description="No suman como venta"
          tone="red"
        />
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-200/70 backdrop-blur">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2D5398]">
              Operación comercial
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">
              Listado de pedidos
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredOrders.length} pedidos encontrados
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_220px] lg:w-[720px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por pedido, cliente, celular, correo o ciudad..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398] focus:bg-white focus:ring-4 focus:ring-[#2D5398]/10"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "todos" | OrderStatus)
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm capitalize outline-none transition focus:border-[#2D5398] focus:bg-white focus:ring-4 focus:ring-[#2D5398]/10"
            >
              <option value="todos">Todos</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
            Cargando pedidos...
          </p>
        ) : filteredOrders.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
            No hay pedidos que coincidan con la búsqueda o el filtro aplicado.
          </p>
        ) : (
          <>
            <div className="hidden lg:block">
              <EnterpriseTable>
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50">
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                      <th className="px-4 py-4">Pedido</th>
                      <th className="px-4 py-4">Cliente</th>
                      <th className="px-4 py-4">Ciudad</th>
                      <th className="px-4 py-4">Total</th>
                      <th className="px-4 py-4">Estado</th>
                      <th className="px-4 py-4">Stock</th>
                      <th className="px-4 py-4">Cambiar estado</th>
                      <th className="px-4 py-4">Fecha</th>
                      <th className="px-4 py-4 text-right">Acción</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="bg-white transition hover:bg-blue-50/40"
                      >
                        <td className="px-4 py-4">
                          <p className="font-black text-slate-900">
                            {order.order_number}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {order.phone}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-800">
                            {order.customer_name}
                          </p>
                          <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                            {order.email ?? "Sin correo"}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {order.city}
                        </td>

                        <td className="px-4 py-4 font-black text-slate-900">
                          {formatPrice(Number(order.total_price ?? 0))}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            label={order.status}
                            tone={getStatusTone(order.status)}
                          />
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            label={
                              order.stock_discounted
                                ? "descontado"
                                : "pendiente"
                            }
                            tone={order.stock_discounted ? "green" : "slate"}
                          />
                        </td>

                        <td className="px-4 py-4">
                          <select
                            value={order.status}
                            disabled={updatingOrderId === order.id}
                            onChange={(event) =>
                              handleStatusChange(
                                order.id,
                                event.target.value as OrderStatus
                              )
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs capitalize outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/10 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-4 text-xs text-slate-500">
                          {formatDate(order.created_at)}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(order)}
                            className="rounded-xl bg-[#2D5398] px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-[#234684]"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </EnterpriseTable>
            </div>

            <div className="space-y-4 lg:hidden">
              {filteredOrders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900">
                        {order.order_number}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {order.customer_name}
                      </p>
                    </div>

                    <StatusBadge
                      label={order.status}
                      tone={getStatusTone(order.status)}
                    />
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-slate-700">
                    <p>
                      <span className="font-semibold">Celular:</span>{" "}
                      {order.phone}
                    </p>
                    <p>
                      <span className="font-semibold">Ciudad:</span>{" "}
                      {order.city}
                    </p>
                    <p>
                      <span className="font-semibold">Total:</span>{" "}
                      {formatPrice(Number(order.total_price ?? 0))}
                    </p>
                    <p>
                      <span className="font-semibold">Stock:</span>{" "}
                      {order.stock_discounted ? "descontado" : "pendiente"}
                    </p>
                    <p>
                      <span className="font-semibold">Fecha:</span>{" "}
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <select
                      value={order.status}
                      disabled={updatingOrderId === order.id}
                      onChange={(event) =>
                        handleStatusChange(
                          order.id,
                          event.target.value as OrderStatus
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm capitalize outline-none transition focus:border-[#2D5398]"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleOpenDetail(order)}
                      className="w-full rounded-xl bg-[#2D5398] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#234684]"
                    >
                      Ver detalle
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2D5398]">
                  Detalle del pedido
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-900">
                  {selectedOrder.order_number}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Registrado el {formatDate(selectedOrder.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
              <article className="rounded-3xl bg-slate-50 p-5">
                <h3 className="text-lg font-black text-slate-900">
                  Datos del cliente
                </h3>

                <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                  <p>
                    <span className="font-semibold">Nombre:</span>{" "}
                    {selectedOrder.customer_name}
                  </p>
                  <p>
                    <span className="font-semibold">Celular:</span>{" "}
                    {selectedOrder.phone}
                  </p>
                  <p>
                    <span className="font-semibold">Correo:</span>{" "}
                    {selectedOrder.email ?? "No registrado"}
                  </p>
                  <p>
                    <span className="font-semibold">Ciudad:</span>{" "}
                    {selectedOrder.city}
                  </p>
                  <p className="md:col-span-2">
                    <span className="font-semibold">Dirección:</span>{" "}
                    {selectedOrder.address ?? "No registrada"}
                  </p>
                  <p className="md:col-span-2">
                    <span className="font-semibold">Observaciones:</span>{" "}
                    {selectedOrder.notes || "Sin observaciones"}
                  </p>
                </div>
              </article>

              <article className="rounded-3xl bg-slate-50 p-5">
                <h3 className="text-lg font-black text-slate-900">
                  Estado del pedido
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge
                    label={selectedOrder.status}
                    tone={getStatusTone(selectedOrder.status)}
                  />

                  <StatusBadge
                    label={
                      selectedOrder.stock_discounted
                        ? "stock descontado"
                        : "stock pendiente"
                    }
                    tone={selectedOrder.stock_discounted ? "green" : "slate"}
                  />
                </div>

                <label className="mt-5 mb-2 block text-sm font-semibold text-slate-700">
                  Cambiar estado
                </label>

                <select
                  value={selectedOrder.status}
                  disabled={updatingOrderId === selectedOrder.id}
                  onChange={(event) =>
                    handleStatusChange(
                      selectedOrder.id,
                      event.target.value as OrderStatus
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm capitalize outline-none transition focus:border-[#2D5398]"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <div className="mt-5 border-t border-slate-200 pt-4">
                  <p className="text-sm text-slate-500">Total pedido</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">
                    {formatPrice(Number(selectedOrder.total_price ?? 0))}
                  </p>
                </div>
              </article>
            </div>

            <article className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black text-slate-900">
                Productos comprados
              </h3>

              {loadingDetail ? (
                <p className="mt-4 text-sm text-slate-500">
                  Cargando productos del pedido...
                </p>
              ) : orderItems.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  No se encontraron productos asociados a este pedido.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                        <th className="px-3 py-3">Producto</th>
                        <th className="px-3 py-3">Precio</th>
                        <th className="px-3 py-3">Cantidad</th>
                        <th className="px-3 py-3">Subtotal</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {orderItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-3 font-semibold text-slate-800">
                            {item.product_name}
                          </td>
                          <td className="px-3 py-3 text-slate-700">
                            {formatPrice(Number(item.price ?? 0))}
                          </td>
                          <td className="px-3 py-3 text-slate-700">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-3 font-black text-slate-900">
                            {formatPrice(Number(item.subtotal ?? 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </div>
        </div>
      )}
    </section>
  );
};