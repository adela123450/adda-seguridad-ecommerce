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

type WompiFunctionResponse = {
  publicKey: string;
  reference: string;
  amountInCents: number;
  currency: string;
  integritySignature: string;
  redirectUrl: string;
  customerEmail: string;
  customerName: string;
};

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

const isValidUuid = (value: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
    value,
  );
};

const safeJsonParse = <T,>(value: string | null): T | null => {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

type CheckoutCustomer = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
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

type CartItem = {
  id: string;
  name: string;
  slug: string;
  img: string;
  price: number;
  stock: number;
  quantity: number;
};

type ProductLookup = {
  id: string;
  name: string;
  slug: string;
  stock: number | null;
};

type ProductCost = {
  id: string;
  cost_price: number | string | null;
};

type BusinessSettings = {
  tax_mode: TaxMode;
  tax_rate: number | string | null;
  payment_mode?: PaymentMode | null;
};

export const OrderConfirmationPage = () => {
  const navigate = useNavigate();
  const { cart, totalItems, totalPrice, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [taxMode, setTaxMode] = useState<TaxMode>("sin_iva");
  const [taxRate, setTaxRate] = useState(IVA_RATE);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("hibrido");

  const storedCustomer = localStorage.getItem("checkoutCustomer");
  const storedPaymentMethod = localStorage.getItem("paymentMethod");
  const storedCheckoutSummary = localStorage.getItem("checkoutSummary");

  const customer = safeJsonParse<CheckoutCustomer>(storedCustomer);
  const checkoutSummary = safeJsonParse<CheckoutSummary>(storedCheckoutSummary);

  const fallbackSubtotal = Math.round(totalPrice);
  const fallbackIvaAmount =
    taxMode === "con_iva" ? Math.round(fallbackSubtotal * taxRate) : 0;
  const fallbackFinalTotal = fallbackSubtotal + fallbackIvaAmount;

  const fallbackPaymentMethod: PaymentMethod =
    storedPaymentMethod === "wompi" ? "wompi" : "transferencia";

  const fallbackPaymentFee =
    fallbackPaymentMethod === "wompi"
      ? Math.round(fallbackFinalTotal * WOMPI_FEE_RATE + WOMPI_FIXED_FEE)
      : 0;

  const paymentMethod: PaymentMethod =
    checkoutSummary?.payment_method ?? fallbackPaymentMethod;

  const subtotal = checkoutSummary?.subtotal ?? fallbackSubtotal;
  const ivaAmount = checkoutSummary?.iva_amount ?? fallbackIvaAmount;
  const finalTotal = checkoutSummary?.total_base ?? fallbackFinalTotal;
  const paymentFee = checkoutSummary?.payment_fee ?? fallbackPaymentFee;
  const totalToPay = checkoutSummary?.total_final ?? finalTotal + paymentFee;
  const snapshotTaxMode = checkoutSummary?.tax_mode ?? taxMode;
  const snapshotTaxRate = checkoutSummary?.tax_rate ?? taxRate;

  useEffect(() => {
    const loadBusinessSettings = async () => {
      setLoadingSettings(true);

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
        setLoadingSettings(false);
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
      setLoadingSettings(false);
    };

    loadBusinessSettings();
  }, []);

  const generateOrderNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const time = now.getTime().toString().slice(-6);

    return `ADDA-${year}-${time}`;
  };

  const resolveProductFromSupabase = async (item: CartItem) => {
    if (isValidUuid(item.id)) {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, stock")
        .eq("id", item.id)
        .maybeSingle();

      if (error) {
        throw new Error(
          `No fue posible validar el producto "${item.name}" en Supabase.`,
        );
      }

      if (data) {
        return data as ProductLookup;
      }
    }

    if (item.slug) {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, stock")
        .eq("slug", item.slug)
        .maybeSingle();

      if (error) {
        throw new Error(
          `No fue posible buscar el producto "${item.name}" por slug.`,
        );
      }

      if (data) {
        return data as ProductLookup;
      }
    }

    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, stock")
      .eq("name", item.name)
      .maybeSingle();

    if (error) {
      throw new Error(
        `No fue posible buscar el producto "${item.name}" por nombre.`,
      );
    }

    if (!data) {
      throw new Error(
        `El producto "${item.name}" no existe en Supabase. Elimínalo del carrito y agrégalo nuevamente desde el catálogo real.`,
      );
    }

    return data as ProductLookup;
  };

  const getCartWithRealProductIds = async () => {
    const migratedCart: CartItem[] = [];

    for (const item of cart) {
      const product = await resolveProductFromSupabase(item);
      const currentStock = Number(product.stock ?? 0);

      if (currentStock < item.quantity) {
        throw new Error(
          `Stock insuficiente para "${product.name}". Stock actual: ${currentStock}, solicitado: ${item.quantity}.`,
        );
      }

      migratedCart.push({
        ...item,
        id: product.id,
        name: product.name,
        slug: product.slug,
        stock: currentStock,
      });
    }

    localStorage.setItem("cart", JSON.stringify(migratedCart));

    return migratedCart;
  };

  const isPaymentMethodAllowed = () => {
    if (paymentMode === "hibrido") return true;

    if (paymentMode === "solo_transferencia") {
      return paymentMethod === "transferencia";
    }

    if (paymentMode === "solo_wompi") {
      return paymentMethod === "wompi";
    }

    return true;
  };

  const clearCheckoutStorage = () => {
    localStorage.removeItem("checkoutCustomer");
    localStorage.removeItem("paymentMethod");
    localStorage.removeItem("checkoutSummary");
  };

  const handleConfirmOrder = async () => {
    if (!customer || cart.length === 0) return;

    if (!isPaymentMethodAllowed()) {
      alert(
        "El método de pago seleccionado ya no está disponible. Regresa al checkout y selecciona un método válido.",
      );
      return;
    }

    try {
      setLoading(true);

      const cartWithRealProductIds = await getCartWithRealProductIds();
      const orderNumber = generateOrderNumber();

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      let customerId: string | null = null;

      if (user) {
        const { data: existingCustomer, error: customerSearchError } =
          await supabase
            .from("customers")
            .select("id")
            .eq("auth_user_id", user.id)
            .maybeSingle();

        if (customerSearchError) {
          throw customerSearchError;
        }

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const { data: newCustomer, error: createCustomerError } =
            await supabase
              .from("customers")
              .insert([
                {
                  auth_user_id: user.id,
                  full_name: customer.fullName,
                  email: customer.email,
                  phone: customer.phone || null,
                  city: customer.city || null,
                  address: customer.address || null,
                  is_active: true,
                },
              ])
              .select("id")
              .single();

          if (createCustomerError) {
            throw createCustomerError;
          }

          customerId = newCustomer.id;
        }
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            order_number: orderNumber,
            customer_id: customerId,
            customer_name: customer.fullName,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            city: customer.city,
            notes: customer.notes,
            total_items: totalItems,
            subtotal,
            iva_amount: ivaAmount,
            total_price: totalToPay,
            tax_mode: snapshotTaxMode,
            payment_method: paymentMethod,
            payment_fee: paymentFee,
            payment_status: "pending",
            payment_provider: paymentMethod === "wompi" ? "wompi" : null,
            status: paymentMethod === "wompi" ? "payment_pending" : "pendiente",
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      const productIds = cartWithRealProductIds.map((item) => item.id);

      const { data: productsCostData, error: costError } = await supabase
        .from("products")
        .select("id, cost_price")
        .in("id", productIds);

      if (costError) throw costError;

      const costMap = new Map(
        ((productsCostData ?? []) as ProductCost[]).map((product) => [
          product.id,
          Number(product.cost_price ?? 0),
        ]),
      );

      const itemsToInsert = cartWithRealProductIds.map((item) => {
        const itemSubtotal = item.price * item.quantity;

        const basePrice =
          snapshotTaxMode === "con_iva"
            ? itemSubtotal / (1 + snapshotTaxRate)
            : itemSubtotal;

        const taxAmount =
          snapshotTaxMode === "con_iva" ? itemSubtotal - basePrice : 0;

        const unitCost = costMap.get(item.id) ?? 0;
        const totalCost = unitCost * item.quantity;
        const grossProfit = basePrice - totalCost;

        const profitMargin =
          basePrice > 0 ? (grossProfit / basePrice) * 100 : 0;

        return {
          order_id: orderData.id,
          product_id: item.id,
          product_name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: itemSubtotal,
          unit_cost: unitCost,
          base_price: Math.round(basePrice),
          tax_amount: Math.round(taxAmount),
          gross_profit: Math.round(grossProfit),
          profit_margin: Number(profitMargin.toFixed(2)),
        };
      });

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      localStorage.setItem(
        "lastOrder",
        JSON.stringify({
          orderNumber,
          customer,
          cart: cartWithRealProductIds,
          totalItems,
          subtotal,
          ivaAmount,
          totalPrice: totalToPay,
          totalBase: finalTotal,
          paymentMethod,
          paymentFee,
          taxMode: snapshotTaxMode,
          taxRate: snapshotTaxRate,
          createdAt: new Date().toISOString(),
        }),
      );

      if (paymentMethod === "transferencia") {
        clearCart();
        clearCheckoutStorage();
        navigate("/pedido-finalizado");
        return;
      }

      const { data, error } =
        await supabase.functions.invoke<WompiFunctionResponse>(
          "create-wompi-transaction",
          {
            body: {
              order_id: orderData.id,
            },
          },
        );

      if (error) {
        throw new Error(
          error.message || "No fue posible inicializar el pago con Wompi.",
        );
      }

      if (!data) {
        throw new Error("La Edge Function de Wompi no devolvió información.");
      }

      const checkoutUrl =
        `https://checkout.wompi.co/p/?` +
        `public-key=${encodeURIComponent(data.publicKey)}` +
        `&currency=${encodeURIComponent(data.currency)}` +
        `&amount-in-cents=${encodeURIComponent(String(data.amountInCents))}` +
        `&reference=${encodeURIComponent(data.reference)}` +
        `&signature:integrity=${encodeURIComponent(data.integritySignature)}` +
        `&redirect-url=${encodeURIComponent(data.redirectUrl)}` +
        `&customer-data:email=${encodeURIComponent(data.customerEmail)}`;

      clearCart();
      clearCheckoutStorage();

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Error creando pedido:", error);

      alert(
        error instanceof Error
          ? error.message
          : "No fue posible registrar el pedido. Intenta nuevamente.",
      );
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

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800">
              Método de pago seleccionado
            </h2>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-800">
                {paymentMethod === "transferencia"
                  ? "Transferencia bancaria / Nequi"
                  : "Pago online seguro con Wompi"}
              </p>

              <p className="mt-2 text-sm text-slate-600">
                {paymentMethod === "transferencia"
                  ? "Al finalizar, recibirás instrucciones para enviar el soporte de pago por WhatsApp."
                  : "Al confirmar, serás redirigido al checkout seguro de Wompi para completar el pago online."}
              </p>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-2xl font-bold text-slate-800">Resumen final</h2>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Productos diferentes</span>
                <span className="font-medium text-slate-800">
                  {cart.length}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Unidades</span>
                <span className="font-medium text-slate-800">{totalItems}</span>
              </div>

              <div className="space-y-3 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Subtotal productos</span>
                  <span className="font-semibold text-slate-800">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>
                    IVA {snapshotTaxMode === "con_iva" ? "19%" : "0%"}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formatPrice(ivaAmount)}
                  </span>
                </div>

                {paymentMethod === "wompi" && (
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

            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={loading || loadingSettings}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? paymentMethod === "wompi"
                    ? "Preparando pago seguro..."
                    : "Registrando pedido..."
                  : loadingSettings
                    ? "Cargando configuración..."
                    : paymentMethod === "wompi"
                      ? "Pagar con Wompi"
                      : "Confirmar pedido"}
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
                Al confirmar, el pedido quedará registrado con snapshot
                financiero: costo unitario, base sin IVA, IVA por producto,
                utilidad bruta, margen, método de pago y comisión de pago si
                aplica.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};
