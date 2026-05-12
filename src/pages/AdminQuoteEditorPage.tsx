import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "approved"
  | "rejected"
  | "expired";

type QuoteDetail = {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_city: string | null;
  project_address: string | null;
  technical_scope: string | null;
  status: QuoteStatus;
  subtotal: number;
  tax_amount: number;
  total: number;
  issue_date: string | null;
  expiration_date: string | null;
  commercial_terms: string | null;
  warranty_terms: string | null;
  exclusions: string | null;
};

type QuoteItem = {
  id: string;
  quote_id: string;
  item_type: "product" | "technical_catalog" | "labor" | "logistics" | "manual";
  item_name: string;
  item_description: string | null;
  sku: string | null;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  total_cost: number;
  profit: number;
  margin_percentage: number;
  notes: string | null;
  created_at: string;
};

type EditForm = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_city: string;
  project_address: string;
  technical_scope: string;
  expiration_date: string;
};

type ItemForm = {
  item_name: string;
  item_description: string;
  quantity: string;
  unit_cost: string;
  unit_price: string;
  discount: string;
  notes: string;
};

const initialItemForm: ItemForm = {
  item_name: "",
  item_description: "",
  quantity: "1",
  unit_cost: "0",
  unit_price: "0",
  discount: "0",
  notes: "",
};

const moneyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const statusLabels: Record<QuoteStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  viewed: "Vista",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Vencida",
};

const parseNumber = (value: string) => {
  const cleanValue = value.replace(/\./g, "").replace(",", ".");
  const numberValue = Number(cleanValue);

  return Number.isFinite(numberValue) ? numberValue : 0;
};

export const AdminQuoteEditorPage = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [form, setForm] = useState<EditForm | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(initialItemForm);

  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [itemError, setItemError] = useState("");

  const loadQuote = async () => {
    if (!quoteId) {
      setErrorMessage("No se encontró el identificador de la cotización.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("quotes")
      .select(
        "id, quote_number, customer_name, customer_phone, customer_email, customer_city, project_address, technical_scope, status, subtotal, tax_amount, total, issue_date, expiration_date, commercial_terms, warranty_terms, exclusions"
      )
      .eq("id", quoteId)
      .single();

    if (error) {
      setErrorMessage(`No fue posible cargar la cotización: ${error.message}`);
      setQuote(null);
      setForm(null);
    } else {
      const quoteData = data as QuoteDetail;

      setQuote(quoteData);
      setForm({
        customer_name: quoteData.customer_name ?? "",
        customer_phone: quoteData.customer_phone ?? "",
        customer_email: quoteData.customer_email ?? "",
        customer_city: quoteData.customer_city ?? "",
        project_address: quoteData.project_address ?? "",
        technical_scope: quoteData.technical_scope ?? "",
        expiration_date: quoteData.expiration_date ?? "",
      });
    }

    setLoading(false);
  };

  const loadItems = async () => {
    if (!quoteId) return;

    setItemsLoading(true);

    const { data, error } = await supabase
      .from("quote_items")
      .select(
        "id, quote_id, item_type, item_name, item_description, sku, quantity, unit_cost, unit_price, discount, subtotal, total_cost, profit, margin_percentage, notes, created_at"
      )
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: true });

    if (error) {
      setErrorMessage(`No fue posible cargar los ítems: ${error.message}`);
      setItems([]);
    } else {
      setItems((data ?? []) as QuoteItem[]);
    }

    setItemsLoading(false);
  };

  const refreshAll = async () => {
    await loadQuote();
    await loadItems();
  };

  useEffect(() => {
    refreshAll();
  }, [quoteId]);

  const canEdit = quote?.status === "draft";

  const itemTotals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal ?? 0), 0);
    const totalCost = items.reduce((sum, item) => sum + Number(item.total_cost ?? 0), 0);
    const profit = subtotal - totalCost;
    const taxAmount = subtotal * 0.19;
    const total = subtotal + taxAmount;
    const margin = subtotal > 0 ? (profit / subtotal) * 100 : 0;

    return {
      subtotal,
      totalCost,
      profit,
      taxAmount,
      total,
      margin,
    };
  }, [items]);

  const updateQuoteTotals = async () => {
    if (!quote) return;

    const { error } = await supabase
      .from("quotes")
      .update({
        subtotal: itemTotals.subtotal,
        tax_amount: itemTotals.taxAmount,
        total: itemTotals.total,
        internal_cost_total: itemTotals.totalCost,
        gross_profit: itemTotals.profit,
        margin_percentage: itemTotals.margin,
      })
      .eq("id", quote.id);

    if (error) {
      setErrorMessage(`No fue posible actualizar los totales: ${error.message}`);
      return;
    }

    await loadQuote();
  };

  useEffect(() => {
    if (items.length > 0) {
      updateQuoteTotals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleChange = (field: keyof EditForm, value: string) => {
    setForm((current) => {
      if (!current) return current;

      return {
        ...current,
        [field]: value,
      };
    });
  };

  const handleItemChange = (field: keyof ItemForm, value: string) => {
    setItemForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCancelEdit = () => {
    if (!quote) return;

    setForm({
      customer_name: quote.customer_name ?? "",
      customer_phone: quote.customer_phone ?? "",
      customer_email: quote.customer_email ?? "",
      customer_city: quote.customer_city ?? "",
      project_address: quote.project_address ?? "",
      technical_scope: quote.technical_scope ?? "",
      expiration_date: quote.expiration_date ?? "",
    });

    setErrorMessage("");
    setSuccessMessage("");
    setIsEditing(false);
  };

  const handleSaveChanges = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!quote || !form) return;

    if (quote.status !== "draft") {
      setErrorMessage(
        "Solo se pueden editar los datos generales cuando la cotización está en borrador."
      );
      return;
    }

    if (!form.customer_name.trim()) {
      setErrorMessage("El nombre del cliente es obligatorio.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("quotes")
      .update({
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim() || null,
        customer_email: form.customer_email.trim() || null,
        customer_city: form.customer_city.trim() || null,
        project_address: form.project_address.trim() || null,
        technical_scope: form.technical_scope.trim() || null,
        expiration_date: form.expiration_date || null,
      })
      .eq("id", quote.id)
      .eq("status", "draft");

    if (error) {
      setErrorMessage(`No fue posible actualizar la cotización: ${error.message}`);
      setSaving(false);
      return;
    }

    setSuccessMessage("Datos de la cotización actualizados correctamente.");
    setSaving(false);
    setIsEditing(false);
    await loadQuote();
  };

  const handleOpenItemModal = () => {
    setItemForm(initialItemForm);
    setItemError("");
    setIsItemModalOpen(true);
  };

  const handleCloseItemModal = () => {
    if (!savingItem) {
      setIsItemModalOpen(false);
      setItemForm(initialItemForm);
      setItemError("");
    }
  };

  const handleCreateManualItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!quote) return;

    if (!canEdit) {
      setItemError("Solo se pueden agregar ítems cuando la cotización está en borrador.");
      return;
    }

    if (!itemForm.item_name.trim()) {
      setItemError("El nombre del ítem es obligatorio.");
      return;
    }

    const quantity = parseNumber(itemForm.quantity);
    const unitCost = parseNumber(itemForm.unit_cost);
    const unitPrice = parseNumber(itemForm.unit_price);
    const discount = parseNumber(itemForm.discount);

    if (quantity <= 0) {
      setItemError("La cantidad debe ser mayor a cero.");
      return;
    }

    const subtotal = Math.max(quantity * unitPrice - discount, 0);
    const totalCost = quantity * unitCost;
    const profit = subtotal - totalCost;
    const marginPercentage = subtotal > 0 ? (profit / subtotal) * 100 : 0;

    setSavingItem(true);
    setItemError("");
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase.from("quote_items").insert({
      quote_id: quote.id,
      item_type: "manual",
      item_name: itemForm.item_name.trim(),
      item_description: itemForm.item_description.trim() || null,
      quantity,
      unit_cost: unitCost,
      unit_price: unitPrice,
      discount,
      subtotal,
      total_cost: totalCost,
      profit,
      margin_percentage: marginPercentage,
      notes: itemForm.notes.trim() || null,
    });

    if (error) {
      setItemError(`No fue posible agregar el ítem: ${error.message}`);
      setSavingItem(false);
      return;
    }

    setSuccessMessage("Ítem agregado correctamente.");
    setSavingItem(false);
    setIsItemModalOpen(false);
    setItemForm(initialItemForm);

    await refreshAll();
  };

  const handleDeleteItem = async (item: QuoteItem) => {
    if (!quote || !canEdit) {
      setErrorMessage("Solo se pueden eliminar ítems cuando la cotización está en borrador.");
      return;
    }

    const confirmDelete = window.confirm(`¿Eliminar el ítem "${item.item_name}"?`);
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("quote_items")
      .delete()
      .eq("id", item.id)
      .eq("quote_id", quote.id);

    if (error) {
      setErrorMessage(`No fue posible eliminar el ítem: ${error.message}`);
      return;
    }

    setSuccessMessage("Ítem eliminado correctamente.");
    await refreshAll();
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-slate-100 px-4 py-6">
        <div className="mx-auto max-w-7xl rounded-3xl bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Cargando cotización...
        </div>
      </section>
    );
  }

  if (errorMessage && !quote) {
    return (
      <section className="min-h-screen bg-slate-100 px-4 py-6">
        <div className="mx-auto max-w-7xl rounded-3xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      </section>
    );
  }

  if (!quote || !form) {
    return (
      <section className="min-h-screen bg-slate-100 px-4 py-6">
        <div className="mx-auto max-w-7xl rounded-3xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">
          No se encontró la cotización solicitada.
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate("/admin/quotes")}
              className="mb-4 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              ← Volver a cotizaciones
            </button>

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2D5398]">
              Editor de cotización
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-800">
              {quote.quote_number}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Construcción técnica y comercial de la propuesta.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="w-fit rounded-full bg-[#2D5398]/10 px-4 py-2 text-sm font-bold text-[#2D5398]">
              {statusLabels[quote.status]}
            </span>

            {canEdit && !isEditing && (
              <button
                type="button"
                onClick={() => {
                  setErrorMessage("");
                  setSuccessMessage("");
                  setIsEditing(true);
                }}
                className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684]"
              >
                Editar datos
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {successMessage}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSaveChanges} className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                Editar datos generales
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Actualiza la información principal de la cotización.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={form.customer_name}
                onChange={(event) => handleChange("customer_name", event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Cliente"
              />

              <input
                value={form.customer_phone}
                onChange={(event) => handleChange("customer_phone", event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Teléfono"
              />

              <input
                value={form.customer_email}
                onChange={(event) => handleChange("customer_email", event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Correo"
              />

              <input
                value={form.customer_city}
                onChange={(event) => handleChange("customer_city", event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Ciudad"
              />

              <input
                value={form.project_address}
                onChange={(event) => handleChange("project_address", event.target.value)}
                className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Dirección del proyecto"
              />

              <textarea
                value={form.technical_scope}
                onChange={(event) => handleChange("technical_scope", event.target.value)}
                rows={4}
                className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Alcance del proyecto"
              />

              <input
                type="date"
                value={form.expiration_date}
                onChange={(event) => handleChange("expiration_date", event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Cliente</p>
              <h2 className="mt-2 text-xl font-bold text-slate-800">
                {quote.customer_name}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {quote.customer_phone ?? "Sin teléfono"}
              </p>
              <p className="text-sm text-slate-500">
                {quote.customer_email ?? "Sin correo"}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Alcance del proyecto
              </p>
              <h2 className="mt-2 text-lg font-bold text-slate-800">
                {quote.technical_scope ?? "Sin alcance definido"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {quote.project_address ?? "Sin dirección"}
              </p>
              <p className="text-sm text-slate-500">
                {quote.customer_city ?? "Sin ciudad"}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Vigencia</p>
              <h2 className="mt-2 text-lg font-bold text-slate-800">
                {quote.expiration_date ?? "Sin vencimiento"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Fecha de emisión: {quote.issue_date ?? "No registrada"}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Subtotal</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-800">
              {moneyFormatter.format(Number(quote.subtotal ?? 0))}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">IVA</p>
            <h2 className="mt-3 text-2xl font-bold text-amber-500">
              {moneyFormatter.format(Number(quote.tax_amount ?? 0))}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total</p>
            <h2 className="mt-3 text-2xl font-bold text-[#2D5398]">
              {moneyFormatter.format(Number(quote.total ?? 0))}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Costo</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-800">
              {moneyFormatter.format(itemTotals.totalCost)}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Utilidad</p>
            <h2 className="mt-3 text-2xl font-bold text-emerald-600">
              {moneyFormatter.format(itemTotals.profit)}
            </h2>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Ítems de la cotización
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Agrega productos, servicios, mano de obra, logística o costos manuales.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenItemModal}
              disabled={!canEdit}
              className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Agregar ítem manual
            </button>
          </div>

          {itemsLoading ? (
            <p className="py-10 text-center text-sm font-semibold text-slate-500">
              Cargando ítems...
            </p>
          ) : items.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <div className="text-4xl">🧾</div>
              <h3 className="mt-4 text-xl font-bold text-slate-800">
                Todavía no hay contenido en esta cotización
              </h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">
                Agrega el primer ítem manual para iniciar la construcción comercial.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Ítem</th>
                    <th className="px-4 py-3">Cant.</th>
                    <th className="px-4 py-3">Costo unit.</th>
                    <th className="px-4 py-3">Precio unit.</th>
                    <th className="px-4 py-3">Subtotal</th>
                    <th className="px-4 py-3">Utilidad</th>
                    <th className="px-4 py-3">Margen</th>
                    <th className="px-4 py-3">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-800">{item.item_name}</p>
                        <p className="text-xs text-slate-500">
                          {item.item_description ?? "Sin descripción"}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-slate-600">{item.quantity}</td>

                      <td className="px-4 py-4 text-slate-600">
                        {moneyFormatter.format(Number(item.unit_cost ?? 0))}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {moneyFormatter.format(Number(item.unit_price ?? 0))}
                      </td>

                      <td className="px-4 py-4 font-bold text-slate-800">
                        {moneyFormatter.format(Number(item.subtotal ?? 0))}
                      </td>

                      <td className="px-4 py-4 font-bold text-emerald-600">
                        {moneyFormatter.format(Number(item.profit ?? 0))}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {Number(item.margin_percentage ?? 0).toFixed(1)}%
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          disabled={!canEdit}
                          className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Agregar ítem manual
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Registra un producto, servicio, mano de obra o costo adicional.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseItemModal}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {itemError && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {itemError}
              </div>
            )}

            <form onSubmit={handleCreateManualItem} className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={itemForm.item_name}
                onChange={(event) => handleItemChange("item_name", event.target.value)}
                className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Nombre del ítem"
              />

              <textarea
                value={itemForm.item_description}
                onChange={(event) =>
                  handleItemChange("item_description", event.target.value)
                }
                rows={3}
                className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Descripción"
              />

              <input
                value={itemForm.quantity}
                onChange={(event) => handleItemChange("quantity", event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Cantidad"
              />

              <input
                value={itemForm.unit_cost}
                onChange={(event) => handleItemChange("unit_cost", event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Costo unitario"
              />

              <input
                value={itemForm.unit_price}
                onChange={(event) => handleItemChange("unit_price", event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Precio unitario"
              />

              <input
                value={itemForm.discount}
                onChange={(event) => handleItemChange("discount", event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Descuento"
              />

              <textarea
                value={itemForm.notes}
                onChange={(event) => handleItemChange("notes", event.target.value)}
                rows={2}
                className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Notas internas"
              />

              <div className="flex justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={handleCloseItemModal}
                  disabled={savingItem}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingItem}
                  className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:opacity-60"
                >
                  {savingItem ? "Guardando..." : "Guardar ítem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};