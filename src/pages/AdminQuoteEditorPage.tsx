import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QuoteItemsTable } from "../modules/quotes/components/QuoteItemsTable.tsx";
import { QuoteTotalsCards } from "../modules/quotes/components/QuoteTotalsCards.tsx";
import { useQuoteFinancials } from "../modules/quotes/hooks/useQuoteFinancials.ts";
import {
  createManualQuoteItem,
  deleteQuoteItem,
  getQuoteById,
  getQuoteItems,
  updateQuoteHeader,
  type QuoteDetail,
  type QuoteItem,
  type QuoteStatus,
} from "../modules/quotes/services/quoteService.ts";

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

const buildEditFormFromQuote = (quote: QuoteDetail): EditForm => ({
  customer_name: quote.customer_name ?? "",
  customer_phone: quote.customer_phone ?? "",
  customer_email: quote.customer_email ?? "",
  customer_city: quote.customer_city ?? "",
  project_address: quote.project_address ?? "",
  technical_scope: quote.technical_scope ?? "",
  expiration_date: quote.expiration_date ?? "",
});

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

  const canEdit = quote?.status === "draft";

  const { quoteTotals, settingsLoading } = useQuoteFinancials({
    quote,
    items,
    loading,
    itemsLoading,
    onQuoteTotalsSynced: (totals) => {
      setQuote((current) => {
        if (!current) return current;

        return {
          ...current,
          subtotal: totals.subtotal,
          tax_amount: totals.tax_amount,
          total: totals.total,
        };
      });
    },
    onError: setErrorMessage,
  });

  const loadQuote = async () => {
    if (!quoteId) {
      setErrorMessage("No se encontró el identificador de la cotización.");
      setQuote(null);
      setForm(null);
      return;
    }

    try {
      const quoteData = await getQuoteById(quoteId);
      setQuote(quoteData);
      setForm(buildEditFormFromQuote(quoteData));
    } catch (error) {
      const currentError = error as Error;
      setErrorMessage(`No fue posible cargar la cotización: ${currentError.message}`);
      setQuote(null);
      setForm(null);
    }
  };

  const loadItems = async () => {
    if (!quoteId) return;

    setItemsLoading(true);

    try {
      const quoteItems = await getQuoteItems(quoteId);
      setItems(quoteItems);
    } catch (error) {
      const currentError = error as Error;
      setErrorMessage(`No fue posible cargar los ítems: ${currentError.message}`);
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    setErrorMessage("");

    await Promise.all([loadQuote(), loadItems()]);

    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

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

    setForm(buildEditFormFromQuote(quote));
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

    try {
      await updateQuoteHeader(quote.id, {
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim() || null,
        customer_email: form.customer_email.trim() || null,
        customer_city: form.customer_city.trim() || null,
        project_address: form.project_address.trim() || null,
        technical_scope: form.technical_scope.trim() || null,
        expiration_date: form.expiration_date || null,
      });

      setSuccessMessage("Datos de la cotización actualizados correctamente.");
      setIsEditing(false);
      await loadQuote();
    } catch (error) {
      const currentError = error as Error;
      setErrorMessage(`No fue posible actualizar la cotización: ${currentError.message}`);
    } finally {
      setSaving(false);
    }
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

    try {
      await createManualQuoteItem({
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

      setSuccessMessage("Ítem agregado correctamente.");
      setIsItemModalOpen(false);
      setItemForm(initialItemForm);
      await refreshAll();
    } catch (error) {
      const currentError = error as Error;
      setItemError(`No fue posible agregar el ítem: ${currentError.message}`);
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (item: QuoteItem) => {
    if (!quote || !canEdit) {
      setErrorMessage("Solo se pueden eliminar ítems cuando la cotización está en borrador.");
      return;
    }

    const confirmDelete = window.confirm(`¿Eliminar el ítem "${item.item_name}"?`);
    if (!confirmDelete) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteQuoteItem(quote.id, item.id);
      setSuccessMessage("Ítem eliminado correctamente.");
      await refreshAll();
    } catch (error) {
      const currentError = error as Error;
      setErrorMessage(`No fue posible eliminar el ítem: ${currentError.message}`);
    }
  };

  if (loading || settingsLoading) {
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

            <p className="mt-3 w-fit rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
              Configuración fiscal activa:{" "}
              {quoteTotals.shouldApplyTax
                ? `Con IVA ${(quoteTotals.normalizedTaxRate * 100).toFixed(0)}%`
                : "Sin IVA"}
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

        <QuoteTotalsCards
          quoteTotals={quoteTotals}
          moneyFormatter={moneyFormatter}
        />

        <QuoteItemsTable
          items={items}
          itemsLoading={itemsLoading}
          canEdit={canEdit}
          moneyFormatter={moneyFormatter}
          onOpenItemModal={handleOpenItemModal}
          onDeleteItem={handleDeleteItem}
        />
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
