

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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
  return new Date(value).toLocaleString("es-CO");
};

export const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const getOrders = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    getOrders();
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Gestión de pedidos
        </h1>

        <p className="mt-2 text-slate-600">
          Consulta los pedidos registrados en tiempo real.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Cargando pedidos...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aún no existen pedidos registrados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3">Pedido</th>
                  <th className="px-3 py-3">Cliente</th>
                  <th className="px-3 py-3">Celular</th>
                  <th className="px-3 py-3">Ciudad</th>
                  <th className="px-3 py-3">Total</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3">Fecha</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-100"
                  >
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
                      {formatPrice(order.total_price)}
                    </td>

                    <td className="px-3 py-3">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        {order.status}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-slate-500">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};