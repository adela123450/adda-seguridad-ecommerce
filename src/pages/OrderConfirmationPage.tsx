import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { supabase } from "../lib/supabase";

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

type CheckoutCustomer = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
};

export const OrderConfirmationPage = () => {
  const navigate = useNavigate();
  const { cart, totalItems, totalPrice, clearCart } = useCart();

  const [loading, setLoading] = useState(false);

  const storedCustomer = localStorage.getItem("checkoutCustomer");

  const customer: CheckoutCustomer | null = storedCustomer
    ? JSON.parse(storedCustomer)
    : null;

  const generateOrderNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const time = now.getTime().toString().slice(-6);

    return `ADDA-${year}-${time}`;
  };

  const handleConfirmOrder = async () => {
    if (!customer || cart.length === 0) return;

    try {
      setLoading(true);

      const orderNumber = generateOrderNumber();

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            order_number: orderNumber,
            customer_name: customer.fullName,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            city: customer.city,
            notes: customer.notes,
            total_items: totalItems,
            total_price: totalPrice,
            status: "pendiente",
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      const itemsToInsert = cart.map((item) => ({
        order_id: orderData.id,
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      localStorage.setItem(
        "lastOrder",
        JSON.stringify({
          orderNumber,
          customer,
          cart,
          totalItems,
          totalPrice,
          createdAt: new Date().toISOString(),
        })
      );

      clearCart();
      localStorage.removeItem("checkoutCustomer");

      navigate("/pedido-finalizado");
    } catch (error) {
      console.error("Error creando pedido:", error);
      alert("No fue posible registrar el pedido. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!customer || cart.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-800">
          No hay información suficiente para confirmar el pedido
        </h1>

        <p className="mt-4 text-slate-600">
          Verifica que hayas completado el checkout y que el carrito tenga
          productos.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/checkout"
            className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Volver al checkout
          </Link>

          <Link
            to="/carrito"
            className="inline-flex rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Volver al carrito
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Confirmación del pedido
        </h1>

        <p className="mt-2 text-slate-600">
          Revisa cuidadosamente la información antes de confirmar tu solicitud.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800">
              Datos del cliente
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Nombre completo</p>
                <p className="mt-1 font-medium text-slate-800">
                  {customer.fullName}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Celular</p>
                <p className="mt-1 font-medium text-slate-800">
                  {customer.phone}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Correo</p>
                <p className="mt-1 font-medium text-slate-800">
                  {customer.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Ciudad</p>
                <p className="mt-1 font-medium text-slate-800">
                  {customer.city}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm text-slate-500">Dirección</p>
                <p className="mt-1 font-medium text-slate-800">
                  {customer.address}
                </p>
              </div>

              {customer.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-slate-500">Observaciones</p>
                  <p className="mt-1 font-medium text-slate-800">
                    {customer.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800">
              Productos solicitados
            </h2>

            <div className="mt-6 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Cantidad: {item.quantity}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Precio unitario: {formatPrice(item.price)}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-2xl font-bold text-slate-800">
              Resumen final
            </h2>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Productos diferentes</span>
                <span className="font-medium text-slate-800">
                  {cart.length}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Unidades</span>
                <span className="font-medium text-slate-800">
                  {totalItems}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-slate-800">
                    Total
                  </span>

                  <span className="text-2xl font-bold text-slate-900">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={handleConfirmOrder}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Registrando pedido..." : "Confirmar pedido"}
              </button>

              <Link
                to="/checkout"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Editar datos
              </Link>
            </div>

            <div className="mt-8 rounded-xl bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Pedido real activado
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Al confirmar, el pedido quedará registrado en la base de datos.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};