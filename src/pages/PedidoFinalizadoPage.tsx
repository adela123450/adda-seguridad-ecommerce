import { Link } from "react-router-dom";

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

type LastOrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type LastOrderCustomer = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
};

type LastOrder = {
  customer: LastOrderCustomer;
  cart: LastOrderItem[];
  totalItems: number;
  subtotal?: number;
  ivaAmount?: number;
  totalPrice: number;
  taxMode?: "sin_iva" | "con_iva";
  createdAt: string;
};

export const PedidoFinalizadoPage = () => {
  const storedOrder = localStorage.getItem("lastOrder");

  const order: LastOrder | null = storedOrder ? JSON.parse(storedOrder) : null;

  if (!order) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-800">
          No se encontró información del pedido
        </h1>

        <p className="mt-4 text-slate-600">
          Parece que aún no se ha registrado un pedido reciente.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-700"
        >
          Volver a la tienda
        </Link>
      </section>
    );
  }

  const subtotal =
    order.subtotal ??
    order.cart.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

  const ivaAmount = order.ivaAmount ?? 0;

  const whatsappMessage = encodeURIComponent(
    `Hola ADDA Seguridad, envío mi pedido:%0A%0A` +
      `Cliente: ${order.customer.fullName}%0A` +
      `Celular: ${order.customer.phone}%0A` +
      `Correo: ${order.customer.email}%0A` +
      `Ciudad: ${order.customer.city}%0A%0A` +
      `Subtotal: ${formatPrice(subtotal)}%0A` +
      `IVA: ${formatPrice(ivaAmount)}%0A` +
      `Total: ${formatPrice(order.totalPrice)}`
  );

  const whatsappLink = `https://wa.me/573015068866?text=${whatsappMessage}`;

  return (
    <section className="max-w-5xl mx-auto px-4 py-14">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <span className="text-2xl">✓</span>
          </div>

          <h1 className="mt-6 text-3xl font-bold text-slate-800">
            Pedido registrado correctamente
          </h1>

          <p className="mt-3 text-slate-600">
            Tu solicitud fue guardada exitosamente.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-bold text-slate-800">
              Datos del cliente
            </h2>

            <div className="mt-5 space-y-3 text-sm text-slate-700">
              <p><strong>Nombre:</strong> {order.customer.fullName}</p>
              <p><strong>Celular:</strong> {order.customer.phone}</p>
              <p><strong>Correo:</strong> {order.customer.email}</p>
              <p><strong>Ciudad:</strong> {order.customer.city}</p>
              <p><strong>Dirección:</strong> {order.customer.address}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-bold text-slate-800">
              Resumen del pedido
            </h2>

            <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
              <div className="flex justify-between text-sm">
                <span>Productos diferentes</span>
                <span>{order.cart.length}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Unidades</span>
                <span>{order.totalItems}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>IVA</span>
                <span>{formatPrice(ivaAmount)}</span>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-3">
                <span className="text-lg font-semibold">Total a pagar</span>
                <span className="text-2xl font-bold text-slate-900">
                  {formatPrice(order.totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-medium text-white hover:bg-green-700"
          >
            Enviar pedido por WhatsApp
          </a>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-700"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    </section>
  );
};