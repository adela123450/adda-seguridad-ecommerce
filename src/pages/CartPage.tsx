import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

export const CartPage = () => {
  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();

  if (cart.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-800">
          Tu carrito está vacío
        </h1>

        <p className="mt-4 text-slate-600">
          Aún no has agregado productos. Explora el catálogo y selecciona los
          equipos que necesitas.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Ir a la tienda
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Columna izquierda: productos */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-3xl font-bold text-slate-800">
                Carrito de compras
              </h1>

              <button
                onClick={clearCart}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Vaciar carrito
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-600">
              Unidades agregadas:{" "}
              <span className="font-semibold text-slate-800">{totalItems}</span>
            </p>

            <div className="mt-8 space-y-6">
              {cart.map((item) => (
                <article
                  key={item.id}
                  className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[110px_1fr]"
                >
                  <div className="flex h-[110px] w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="flex flex-col justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">
                        {item.name}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Precio unitario: {formatPrice(item.price)}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Stock disponible: {item.stock}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          -
                        </button>

                        <span className="min-w-[32px] text-center text-base font-semibold text-slate-800">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => increaseQuantity(item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex flex-col items-start gap-3 sm:items-end">
                        <p className="text-lg font-bold text-slate-900">
                          Subtotal: {formatPrice(item.price * item.quantity)}
                        </p>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Columna derecha: resumen */}
        <aside className="lg:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-2xl font-bold text-slate-800">
              Resumen del pedido
            </h2>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Productos diferentes</span>
                <span className="font-medium text-slate-800">{cart.length}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Unidades</span>
                <span className="font-medium text-slate-800">{totalItems}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium text-slate-800">
                  {formatPrice(totalPrice)}
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
              <Link
                to="/checkout"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Continuar pedido
              </Link>

              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Seguir comprando
              </Link>
            </div>

            <div className="mt-8 rounded-xl bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Información importante
              </h3>

              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>Los precios pueden variar según disponibilidad.</li>
                <li>La reserva definitiva se confirma al validar el pedido.</li>
                <li>Recibirás asesoría técnica si lo necesitas.</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};