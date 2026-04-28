// src/pages/AdminOrdersPage.tsx
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
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

type ProductStock = {
  id: string;
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

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value: string) => {
  return new Date(value).toLocaleString("es-CO");
};

const isValidUuid = (value: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
    value
  );
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

  return styles[status] ?? styles.pendiente;
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

  const discountStockForOrder = async (orderId: string) => {
    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select("id, order_id, product_id, product_name, price, quantity, subtotal")
      .eq("order_id", orderId);

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    const items = (itemsData ?? []) as OrderItem[];

    if (items.length === 0) {
      throw new Error("El pedido no tiene productos asociados.");
    }

    for (const item of items) {
      if (!isValidUuid(item.product_id)) {
        throw new Error(
          `El producto "${item.product_name}" no tiene un ID válido para descontar stock.`
        );
      }

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("id, stock")
        .eq("id", item.product_id)
        .single();

      if (productError) {
        throw new Error(`No se encontró el producto: ${item.product_name}`);
      }

      const product = productData as ProductStock;
      const currentStock = Number(product.stock ?? 0);
      const newStock = currentStock - Number(item.quantity ?? 0);

      if (newStock < 0) {
        throw new Error(
          `Stock insuficiente para "${item.product_name}". Stock actual: ${currentStock}, solicitado: ${item.quantity}.`
        );
      }

      const { error: updateProductError } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", item.product_id);

      if (updateProductError) {
        throw new Error(
          `No fue posible descontar stock de "${item.product_name}".`
        );
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
        paidStatuses.includes(newStatus) && !currentOrder.stock_discounted;

      if (mustDiscountStock) {
        await discountStockForOrder(orderId);
      }

      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          stock_discounted: currentOrder.stock_discounted || mustDiscountStock,
        })
        .eq("id", orderId);

      if (error) {
        throw new Error(error.message);
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                stock_discounted:
                  order.stock_discounted || mustDiscountStock,
              }
            : order
        )
      );

      setSelectedOrder((currentSelectedOrder) =>
        currentSelectedOrder && currentSelectedOrder.id === orderId
          ? {
              ...currentSelectedOrder,
              status: newStatus,
              stock_discounted:
                currentSelectedOrder.stock_discounted || mustDiscountStock,
            }
          : currentSelectedOrder
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
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2D5398]">
          Administración
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-800">
          Gestión de pedidos
        </h1>

        <p className="mt-2 text-slate-600">
          Consulta, filtra, revisa detalles y actualiza el estado de los pedidos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Por gestionar</p>
          <h2 className="mt-2 text-3xl font-bold text-[#2D5398]">
            {ordersToManage}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Pendientes y confirmados
          </p>
        </article>

        <article className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Ventas pagadas
          </p>
          <h2 className="mt-2 text-2xl font-bold text-green-700">
            {formatPrice(paidSales)}
          </h2>
          <p className="mt-1 text-xs text-slate-500">Pagados y entregados</p>
        </article>

        <article className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Enviados</p>
          <h2 className="mt-2 text-3xl font-bold text-purple-700">
            {shippedOrders}
          </h2>
          <p className="mt-1 text-xs text-slate-500">En proceso de entrega</p>
        </article>

        <article className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Cancelados</p>
          <h2 className="mt-2 text-3xl font-bold text-red-700">
            {canceledOrders}
          </h2>
          <p className="mt-1 text-xs text-slate-500">No suman como venta</p>
        </article>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_240px]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Buscar pedido
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por pedido, cliente, celular, correo o ciudad..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Filtrar por estado
            </label>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "todos" | OrderStatus)
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
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

        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-slate-500">Cargando pedidos...</p>
          ) : filteredOrders.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
              No hay pedidos que coincidan con la búsqueda o el filtro aplicado.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-3 py-3">Pedido</th>
                      <th className="px-3 py-3">Cliente</th>
                      <th className="px-3 py-3">Celular</th>
                      <th className="px-3 py-3">Ciudad</th>
                      <th className="px-3 py-3">Total</th>
                      <th className="px-3 py-3">Estado</th>
                      <th className="px-3 py-3">Stock</th>
                      <th className="px-3 py-3">Cambiar estado</th>
                      <th className="px-3 py-3">Fecha</th>
                      <th className="px-3 py-3">Detalle</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-100">
                        <td className="px-3 py-3 font-semibold text-slate-800">
                          {order.order_number}
                        </td>

                        <td className="px-3 py-3 text-slate-700">
                          {order.customer_name}
                        </td>

                        <td className="px-3 py-3 text-slate-700">
                          {order.phone}
                        </td>

                        <td className="px-3 py-3 text-slate-700">
                          {order.city}
                        </td>

                        <td className="px-3 py-3 font-medium text-slate-800">
                          {formatPrice(Number(order.total_price ?? 0))}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              order.stock_discounted
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {order.stock_discounted ? "descontado" : "pendiente"}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <select
                            value={order.status}
                            disabled={updatingOrderId === order.id}
                            onChange={(event) =>
                              handleStatusChange(
                                order.id,
                                event.target.value as OrderStatus
                              )
                            }
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none transition focus:border-[#2D5398]"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-3 py-3 text-slate-500">
                          {formatDate(order.created_at)}
                        </td>

                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(order)}
                            className="rounded-xl bg-[#2D5398] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#234684]"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 lg:hidden">
                {filteredOrders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">
                          {order.order_number}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {order.customer_name}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
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
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                          Cambiar estado
                        </label>
                        <select
                          value={order.status}
                          disabled={updatingOrderId === order.id}
                          onChange={(event) =>
                            handleStatusChange(
                              order.id,
                              event.target.value as OrderStatus
                            )
                          }
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#2D5398]"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenDetail(order)}
                        className="w-full rounded-xl bg-[#2D5398] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#234684]"
                      >
                        Ver detalle
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2D5398]">
                  Detalle del pedido
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {selectedOrder.order_number}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Registrado el {formatDate(selectedOrder.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
              <article className="rounded-2xl bg-slate-50 p-5">
                <h3 className="text-lg font-bold text-slate-900">
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

              <article className="rounded-2xl bg-slate-50 p-5">
                <h3 className="text-lg font-bold text-slate-900">
                  Estado del pedido
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      selectedOrder.stock_discounted
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    stock{" "}
                    {selectedOrder.stock_discounted
                      ? "descontado"
                      : "pendiente"}
                  </span>
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
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <div className="mt-5 border-t border-slate-200 pt-4">
                  <p className="text-sm text-slate-500">Total pedido</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {formatPrice(Number(selectedOrder.total_price ?? 0))}
                  </p>
                </div>
              </article>
            </div>

            <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-bold text-slate-900">
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
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="px-3 py-3">Producto</th>
                        <th className="px-3 py-3">Precio</th>
                        <th className="px-3 py-3">Cantidad</th>
                        <th className="px-3 py-3">Subtotal</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orderItems.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="px-3 py-3 font-semibold text-slate-800">
                            {item.product_name}
                          </td>
                          <td className="px-3 py-3 text-slate-700">
                            {formatPrice(Number(item.price ?? 0))}
                          </td>
                          <td className="px-3 py-3 text-slate-700">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-3 font-semibold text-slate-800">
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