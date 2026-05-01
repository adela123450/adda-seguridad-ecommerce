import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { supabase } from "../lib/supabase";

const IVA_RATE = 0.19;
const WOMPI_FEE_RATE = 0.032;
const WOMPI_FIXED_FEE = 900;

type TaxMode = "sin_iva" | "con_iva";
type PaymentMode = "solo_transferencia" | "solo_wompi" | "hibrido";
type PaymentMethod = "transferencia" | "wompi";

type BusinessSettings = {
  tax_mode: TaxMode;
  tax_rate: number | string | null;
  payment_mode?: PaymentMode | null;
};

type CheckoutSummary = {
  subtotal: number;
  iva_amount: number;
  total_base: number;
  payment_method: PaymentMethod;
  payment_fee: number;
  total_final: number;
  tax_mode: TaxMode;
  tax_rate: number;
};

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

type CheckoutFormData = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
};

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, totalItems, totalPrice } = useCart();

  const [taxMode, setTaxMode] = useState<TaxMode>("sin_iva");
  const [taxRate, setTaxRate] = useState(IVA_RATE);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("hibrido");
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentMethod>("transferencia");

  const subtotal = Math.round(totalPrice);
  const ivaAmount = taxMode === "con_iva" ? Math.round(subtotal * taxRate) : 0;
  const finalTotal = subtotal + ivaAmount;

  const paymentFee =
    selectedPayment === "wompi"
      ? Math.round(finalTotal * WOMPI_FEE_RATE + WOMPI_FIXED_FEE)
      : 0;

  const totalToPay = finalTotal + paymentFee;

  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Partial<CheckoutFormData>>({});

  useEffect(() => {
    const loadBusinessSettings = async () => {
      const { data, error } = await supabase
        .from("business_settings")
        .select("tax_mode, tax_rate, payment_mode")
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error cargando configuración fiscal:", error.message);
        setTaxMode("sin_iva");
        setTaxRate(IVA_RATE);
        setPaymentMode("hibrido");
        setSelectedPayment("transferencia");
        return;
      }

      const settings = data as BusinessSettings | null;

      const nextTaxMode: TaxMode =
        settings?.tax_mode === "con_iva" ? "con_iva" : "sin_iva";

      const nextTaxRate = Number(settings?.tax_rate ?? 19) / 100;

      const nextPaymentMode: PaymentMode =
        settings?.payment_mode === "solo_transferencia" ||
        settings?.payment_mode === "solo_wompi" ||
        settings?.payment_mode === "hibrido"
          ? settings.payment_mode
          : "hibrido";

      setTaxMode(nextTaxMode);
      setTaxRate(Number.isNaN(nextTaxRate) ? IVA_RATE : nextTaxRate);
      setPaymentMode(nextPaymentMode);

      if (nextPaymentMode === "solo_wompi") {
        setSelectedPayment("wompi");
      } else {
        setSelectedPayment("transferencia");
      }
    };

    loadBusinessSettings();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors: Partial<CheckoutFormData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Debes ingresar tu nombre completo.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Debes ingresar tu celular.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Debes ingresar tu correo.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Ingresa un correo válido.";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Debes ingresar tu dirección.";
    }

    if (!formData.city.trim()) {
      newErrors.city = "Debes ingresar tu ciudad.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const isTransferAvailable =
    paymentMode === "hibrido" || paymentMode === "solo_transferencia";

  const isWompiAvailable =
    paymentMode === "hibrido" || paymentMode === "solo_wompi";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    const checkoutSummary: CheckoutSummary = {
      subtotal,
      iva_amount: ivaAmount,
      total_base: finalTotal,
      payment_method: selectedPayment,
      payment_fee: paymentFee,
      total_final: totalToPay,
      tax_mode: taxMode,
      tax_rate: taxRate,
    };

    localStorage.setItem("checkoutCustomer", JSON.stringify(formData));
    localStorage.setItem("paymentMethod", selectedPayment);
    localStorage.setItem("checkoutSummary", JSON.stringify(checkoutSummary));

    navigate("/confirmacion-pedido");
  };

  if (cart.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-800">
          No hay productos para procesar
        </h1>

        <p className="mt-4 text-slate-600">
          Tu carrito está vacío. Agrega productos antes de continuar al checkout.
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Finalizar pedido
        </h1>
        <p className="mt-2 text-slate-600">
          Completa tus datos para continuar con la confirmación del pedido.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-slate-800">
              Datos del cliente
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nombre completo
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Ej. Luis Eduardo Gaitán"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
                {errors.fullName && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Celular
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Ej. 3001234567"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Ej. correo@dominio.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Dirección
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Ej. Calle 10 # 20 - 30"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
                {errors.address && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.address}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ciudad
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Ej. Bogotá"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
                {errors.city && (
                  <p className="mt-2 text-sm text-red-600">{errors.city}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Observaciones
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Ej. Necesito asesoría para escoger DVR compatible."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-bold text-slate-800">
                Método de pago
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Selecciona cómo deseas continuar con tu pedido.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {isTransferAvailable && (
                  <button
                    type="button"
                    onClick={() => setSelectedPayment("transferencia")}
                    className={`rounded-2xl border p-5 text-left transition ${
                      selectedPayment === "transferencia"
                        ? "border-[#2D5398] bg-[#2D5398]/10 text-[#2D5398]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[#2D5398]/40"
                    }`}
                  >
                    <p className="text-base font-bold">
                      Transferencia bancaria / Nequi
                    </p>
                    <p className="mt-2 text-sm">
                      Recomendado para conservar el mejor precio. La confirmación
                      se realiza enviando el soporte por WhatsApp.
                    </p>
                    <p className="mt-3 text-sm font-semibold">
                      Total por transferencia: {formatPrice(finalTotal)}
                    </p>
                  </button>
                )}

                {isWompiAvailable && (
                  <button
                    type="button"
                    onClick={() => setSelectedPayment("wompi")}
                    className={`rounded-2xl border p-5 text-left transition ${
                      selectedPayment === "wompi"
                        ? "border-[#2D5398] bg-[#2D5398]/10 text-[#2D5398]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[#2D5398]/40"
                    }`}
                  >
                    <p className="text-base font-bold">
                      Pago online seguro
                    </p>
                    <p className="mt-2 text-sm">
                      Opción para pago digital mediante pasarela. Incluye el
                      costo operativo de la transacción online.
                    </p>
                    <p className="mt-3 text-sm font-semibold">
                      Total pago online:{" "}
                      {formatPrice(
                        finalTotal +
                          Math.round(finalTotal * WOMPI_FEE_RATE + WOMPI_FIXED_FEE)
                      )}
                    </p>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Confirmar pedido
              </button>

              <Link
                to="/carrito"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Volver al carrito
              </Link>
            </div>
          </form>
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-2xl font-bold text-slate-800">
              Resumen del pedido
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

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Productos diferentes</span>
                <span className="font-medium text-slate-800">{cart.length}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Unidades</span>
                <span className="font-medium text-slate-800">{totalItems}</span>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>IVA {taxMode === "con_iva" ? "19%" : "0%"}</span>
                  <span className="font-semibold text-slate-800">
                    {formatPrice(ivaAmount)}
                  </span>
                </div>

                {selectedPayment === "wompi" && (
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Comisión pago online</span>
                    <span className="font-semibold text-slate-800">
                      {formatPrice(paymentFee)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <span className="text-lg font-semibold text-slate-800">
                    Total a pagar
                  </span>
                  <span className="text-2xl font-bold text-slate-900">
                    {formatPrice(totalToPay)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-xl bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Nota del pedido
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Este paso prepara la información del pedido, el método de pago
                seleccionado y el resumen financiero para la confirmación.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};