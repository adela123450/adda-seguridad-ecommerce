import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type TaxMode = "sin_iva" | "con_iva";
type PaymentMode = "solo_transferencia" | "solo_wompi" | "hibrido";

type BusinessSettings = {
  id: string;
  company_name: string | null;
  tax_mode: TaxMode;
  tax_rate: number | string | null;
  payment_mode: PaymentMode | null;
};

export const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [taxMode, setTaxMode] = useState<TaxMode>("sin_iva");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("hibrido");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadSettings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("business_settings")
      .select("id, company_name, tax_mode, tax_rate, payment_mode")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error cargando configuración:", error.message);
      setMessage("No fue posible cargar la configuración.");
      setLoading(false);
      return;
    }

    if (data) {
      const current = data as BusinessSettings;
      setSettings(current);
      setTaxMode(current.tax_mode === "con_iva" ? "con_iva" : "sin_iva");

      const currentPaymentMode: PaymentMode =
        current.payment_mode === "solo_transferencia" ||
        current.payment_mode === "solo_wompi" ||
        current.payment_mode === "hibrido"
          ? current.payment_mode
          : "hibrido";

      setPaymentMode(currentPaymentMode);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    if (settings?.id) {
      const { error } = await supabase
        .from("business_settings")
        .update({
          tax_mode: taxMode,
          tax_rate: 19,
          payment_mode: paymentMode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);

      if (error) {
        console.error("Error guardando configuración:", error.message);
        setMessage("No fue posible guardar la configuración.");
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("business_settings").insert({
        company_name: "ADDA Seguridad",
        tax_mode: taxMode,
        tax_rate: 19,
        payment_mode: paymentMode,
      });

      if (error) {
        console.error("Error creando configuración:", error.message);
        setMessage("No fue posible crear la configuración.");
        setSaving(false);
        return;
      }
    }

    await loadSettings();
    setMessage("Configuración empresarial actualizada correctamente.");
    setSaving(false);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] p-6 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
          Configuración
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Configuración empresarial ADDA
        </h1>

        <p className="mt-2 max-w-3xl text-blue-100">
          Define parámetros internos del negocio.
        </p>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-8 text-center text-slate-600 shadow-sm ring-1 ring-slate-200">
          Cargando configuración...
        </div>
      ) : (
        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            Configuración fiscal
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setTaxMode("sin_iva")}
              className={`rounded-3xl border p-5 text-left transition ${
                taxMode === "sin_iva"
                  ? "border-[#2D5398] bg-[#2D5398]/10 text-[#2D5398]"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              <p className="text-lg font-bold">Vender sin IVA</p>
              <p className="mt-2 text-sm">IVA $0 en pedidos.</p>
            </button>

            <button
              type="button"
              onClick={() => setTaxMode("con_iva")}
              className={`rounded-3xl border p-5 text-left transition ${
                taxMode === "con_iva"
                  ? "border-[#2D5398] bg-[#2D5398]/10 text-[#2D5398]"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              <p className="text-lg font-bold">Vender con IVA 19%</p>
              <p className="mt-2 text-sm">Suma IVA al subtotal del pedido.</p>
            </button>
          </div>

          <div className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-900">
              Métodos de pago
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Define cómo podrán pagar los clientes en el checkout.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <button
                type="button"
                onClick={() => setPaymentMode("solo_transferencia")}
                className={`rounded-3xl border p-5 text-left transition ${
                  paymentMode === "solo_transferencia"
                    ? "border-[#2D5398] bg-[#2D5398]/10 text-[#2D5398]"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                <p className="text-lg font-bold">Solo transferencia</p>
                <p className="mt-2 text-sm">
                  El cliente solo verá transferencia bancaria / Nequi.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("solo_wompi")}
                className={`rounded-3xl border p-5 text-left transition ${
                  paymentMode === "solo_wompi"
                    ? "border-[#2D5398] bg-[#2D5398]/10 text-[#2D5398]"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                <p className="text-lg font-bold">Solo Wompi</p>
                <p className="mt-2 text-sm">
                  El cliente solo verá pago online seguro.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("hibrido")}
                className={`rounded-3xl border p-5 text-left transition ${
                  paymentMode === "hibrido"
                    ? "border-[#2D5398] bg-[#2D5398]/10 text-[#2D5398]"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                <p className="text-lg font-bold">Modo híbrido</p>
                <p className="mt-2 text-sm">
                  El cliente podrá elegir transferencia o Wompi.
                </p>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-8 rounded-xl bg-[#2D5398] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>

          {message && (
            <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-[#2D5398]">
              {message}
            </p>
          )}
        </article>
      )}
    </section>
  );
};