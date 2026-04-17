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
  totalPrice: number;
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
          Parece que aún no se ha registrado un pedido reciente para mostrar.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Volver a la tienda
        </Link>
      </section>
    );
  }

  const whatsappMessage = encodeURIComponent(
    `Hola, ADDA Seguridad. Quiero enviar mi pedido:\n\n` +
      `Cliente: ${order.customer.fullName}\n` +
      `Celular: ${order.customer.phone}\n` +
      `Correo: ${order.customer.email}\n` +
      `Ciudad: ${order.customer.city}\n` +
      `Dirección: ${order.customer.address}\n` +
      `Observaciones: ${order.customer.notes || "Sin observaciones"}\n\n` +
      `Productos solicitados:\n` +
      `${order.cart
        .map(
          (item) =>
            `• ${item.name} | Cantidad: ${item.quantity} | Subtotal: ${formatPrice(
              item.price * item.quantity
            )}`
        )
        .join("\n")}\n\n` +
      `Productos diferentes: ${order.cart.length}\n` +
      `Unidades totales: ${order.totalItems}\n` +
      `Total del pedido: ${formatPrice(order.totalPrice)}`
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
            Hemos guardado la información de tu solicitud. Ahora puedes enviar
            el pedido directamente por WhatsApp para continuar la atención.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-bold text-slate-800">
              Datos del cliente
            </h2>

            <div className="mt-5 space-y-3 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Nombre:</span>{" "}
                {order.customer.fullName}
              </p>
              <p>
                <span className="font-semibold">Celular:</span>{" "}
                {order.customer.phone}
              </p>
              <p>
                <span className="font-semibold">Correo:</span>{" "}
                {order.customer.email}
              </p>
              <p>
                <span className="font-semibold">Ciudad:</span>{" "}
                {order.customer.city}
              </p>
              <p>
                <span className="font-semibold">Dirección:</span>{" "}
                {order.customer.address}
              </p>

              {order.customer.notes && (
                <p>
                  <span className="font-semibold">Observaciones:</span>{" "}
                  {order.customer.notes}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-bold text-slate-800">
              Resumen del pedido
            </h2>

            <div className="mt-5 space-y-4">
              {order.cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Cantidad: {item.quantity}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Productos diferentes</span>
                <span className="font-medium text-slate-800">
                  {order.cart.length}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Unidades</span>
                <span className="font-medium text-slate-800">
                  {order.totalItems}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-lg font-semibold text-slate-800">
                  Total
                </span>
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
            className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-green-700"
          >
            Enviar pedido por WhatsApp
          </a>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Volver a la tienda
          </Link>

          <Link
            to="/carrito"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Ir al carrito
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <h3 className="text-sm font-semibold text-slate-800">
            Registro opcional futuro
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Más adelante podrás ofrecer creación de cuenta opcional para guardar
            datos, consultar pedidos y comprar más rápido.
          </p>
        </div>
      </div>
    </section>
  );
};