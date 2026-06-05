import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabaseAdmin as supabase } from "../lib/supabase";
import { QuoteItemsTable } from "../modules/quotes/components/QuoteItemsTable.tsx";
import { QuoteTotalsCards } from "../modules/quotes/components/QuoteTotalsCards.tsx";
import { QuotePdfTemplate } from "../modules/quotes/components/QuotePdfTemplate.tsx";
import { useQuoteFinancials } from "../modules/quotes/hooks/useQuoteFinancials.ts";
import {
  createCatalogQuoteItem,
  createManualQuoteItem,
  deleteQuoteItem,
  getQuoteById,
  getQuoteItems,
  searchQuoteCatalogProducts,
  updateQuoteHeader,
  updateQuoteItemSnapshot,
  applyTemplateToQuote,
  type CatalogProduct,
  type QuoteDetail,
  type QuoteItem,
  type QuoteStatus,
} from "../modules/quotes/services/quoteService.ts";

type EditForm = {
  issuer_profile_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_city: string;
  project_address: string;
  technical_scope: string;
  expiration_date: string;
  warranty_text: string;
  conditions_text: string;
  important_notes_text: string;
  exclusions_text: string;
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

type CatalogItemForm = {
  quantity: string;
  discount: string;
  notes: string;
};

type EditItemForm = {
  quantity: string;
  discount: string;
  notes: string;
};

type IssuerProfile = {
  id: string;
  profile_name: string;
  issuer_type: string;
  legal_name: string;
  commercial_name: string | null;
  document_type: string | null;
  document_number: string | null;
  tax_responsibility: string | null;
  city: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  bank_name: string | null;
  bank_account_type: string | null;
  bank_account_number: string | null;
  footer_notes: string | null;
  logo_url: string | null;
  is_default: boolean;
  is_active: boolean;
};

type QuoteTemplate = {
  id: string;
  name: string;
  template_code: string | null;
  description: string | null;
  installation_type: string | null;
  estimated_duration: string | null;
  default_public_scope: string | null;
  default_labor_notes: string | null;
  default_logistics_notes: string | null;
  warranty_text: string | null;
  conditions_text: string | null;
  important_notes_text: string | null;
  exclusions_text: string | null;
  active: boolean;
};

type IssuerSnapshot = Partial<IssuerProfile> & Record<string, unknown>;

const initialItemForm: ItemForm = {
  item_name: "",
  item_description: "",
  quantity: "1",
  unit_cost: "0",
  unit_price: "0",
  discount: "0",
  notes: "",
};

const initialCatalogItemForm: CatalogItemForm = {
  quantity: "1",
  discount: "0",
  notes: "",
};

const initialEditItemForm: EditItemForm = {
  quantity: "1",
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

const defaultWarrantyText =
  "Se otorga una garantía de 2 meses sobre la instalación realizada.";

const defaultConditionsText = `• No aplica garantía sobre equipos suministrados por el cliente.
• No cubre daños ocasionados por:
✓ Fluctuaciones o picos de energía.
✓ Manipulación indebida por terceros.
✓ Cambios posteriores en ubicación o configuración del sistema.`;

const defaultImportantNotesText = `Cotización válida por 7 días calendario.
Sujetos a disponibilidad de inventario y variación de precios.`;

const defaultExclusionsText = `Esta cotización NO incluye:
• Video balunes
• Fuentes de poder
• Caja de paso (10x10)
• Multitomas
• Elementos adicionales no especificados.`;

const parseNumber = (value: string) => {
  const cleanValue = value.replace(/\./g, "").replace(",", ".");
  const numberValue = Number(cleanValue);

  return Number.isFinite(numberValue) ? numberValue : 0;
};

const buildEditFormFromQuote = (quote: QuoteDetail): EditForm => ({
  issuer_profile_id: quote.issuer_profile_id ?? "",
  customer_name: quote.customer_name ?? "",
  customer_phone: quote.customer_phone ?? "",
  customer_email: quote.customer_email ?? "",
  customer_city: quote.customer_city ?? "",
  project_address: quote.project_address ?? "",
  technical_scope: quote.technical_scope ?? "",
  expiration_date: quote.expiration_date ?? "",
  warranty_text: quote.warranty_text ?? defaultWarrantyText,
  conditions_text: quote.conditions_text ?? defaultConditionsText,
  important_notes_text:
    quote.important_notes_text ?? defaultImportantNotesText,
  exclusions_text: quote.exclusions_text ?? defaultExclusionsText,
});

type UnitAwareCatalogProduct = CatalogProduct & {
  sale_unit?: string | null;
  public_sale_unit?: string | null;
  quote_unit?: string | null;
  purchase_unit?: string | null;
  unit_content?: number | string | null;
  quote_by_unit?: boolean | null;
};

type CatalogPricingSnapshot = {
  quantity: number;
  discount: number;
  unitCost: number;
  unitPrice: number;
  subtotal: number;
  totalCost: number;
  profit: number;
  marginPercentage: number;
  isProportional: boolean;
  unitContent: number;
  purchaseUnit: string;
  publicSaleUnit: string;
  quoteUnit: string;
};

const getUnitDisplayName = (unit: string) => {
  const normalizedUnit = unit?.trim() || "unidad";

  const labels: Record<string, string> = {
    unidad: "unidades",
    metro: "metros",
    hora: "horas",
    punto: "puntos",
    tramo: "tramos",
    rollo: "rollos",
    caja: "cajas",
    paquete: "paquetes",
    kit: "kits",
    servicio: "servicios",
  };

  return labels[normalizedUnit] ?? normalizedUnit;
};

const getQuantityLabel = (pricing: CatalogPricingSnapshot | null) => {
  if (!pricing) return "Cantidad";

  return pricing.isProportional
    ? `Cantidad en ${getUnitDisplayName(pricing.quoteUnit)}`
    : `Cantidad en ${getUnitDisplayName(pricing.quoteUnit)}`;
};

const getCatalogPricingSnapshot = (
  product: CatalogProduct,
  quantityValue: string,
  discountValue: string,
): CatalogPricingSnapshot => {
  const unitAwareProduct = product as UnitAwareCatalogProduct;
  const quantity = parseNumber(quantityValue);
  const discount = parseNumber(discountValue);
  const baseCost = Number(unitAwareProduct.cost_price ?? 0);
  const basePrice = Number(unitAwareProduct.price ?? 0);
  const rawUnitContent = Number(unitAwareProduct.unit_content ?? 1);
  const unitContent =
    Number.isFinite(rawUnitContent) && rawUnitContent > 0 ? rawUnitContent : 1;
  const isProportional =
    Boolean(unitAwareProduct.quote_by_unit) && unitContent > 1;

  const unitCost = isProportional
    ? Math.round(baseCost / unitContent)
    : Math.round(baseCost);
  const unitPrice = isProportional
    ? Math.round(basePrice / unitContent)
    : Math.round(basePrice);
  const subtotal = Math.max(Math.round(quantity * unitPrice) - discount, 0);
  const totalCost = Math.round(quantity * unitCost);
  const profit = subtotal - totalCost;
  const marginPercentage = subtotal > 0 ? (profit / subtotal) * 100 : 0;

  return {
    quantity,
    discount,
    unitCost,
    unitPrice,
    subtotal,
    totalCost,
    profit,
    marginPercentage,
    isProportional,
    unitContent,
    purchaseUnit: unitAwareProduct.purchase_unit ?? "unidad",
    publicSaleUnit:
      unitAwareProduct.public_sale_unit ??
      unitAwareProduct.sale_unit ??
      "unidad",
    quoteUnit:
      unitAwareProduct.quote_unit ?? unitAwareProduct.sale_unit ?? "unidad",
  };
};

const getTextValue = (value: unknown, fallback = "No registrado") => {
  if (typeof value !== "string") return fallback;

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : fallback;
};

const getIssuerSnapshot = (quote: QuoteDetail): IssuerSnapshot | null => {
  const snapshot = quote.issuer_snapshot;

  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return null;
  }

  return snapshot as IssuerSnapshot;
};

export const AdminQuoteEditorPage = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [form, setForm] = useState<EditForm | null>(null);
  const [issuerProfiles, setIssuerProfiles] = useState<IssuerProfile[]>([]);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [itemForm, setItemForm] = useState<ItemForm>(initialItemForm);
  const [itemModalMode, setItemModalMode] = useState<"manual" | "catalog">(
    "manual",
  );
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [selectedCatalogProduct, setSelectedCatalogProduct] =
    useState<CatalogProduct | null>(null);
  const [catalogItemForm, setCatalogItemForm] = useState<CatalogItemForm>(
    initialCatalogItemForm,
  );
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);
  const [editItemForm, setEditItemForm] =
    useState<EditItemForm>(initialEditItemForm);

  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [savingEditItem, setSavingEditItem] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [itemError, setItemError] = useState("");
  const [editItemError, setEditItemError] = useState("");

  const canEdit = quote?.status === "draft";

  const handlePrintQuote = () => {
    window.print();
  };

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
      setErrorMessage(
        `No fue posible cargar la cotización: ${currentError.message}`,
      );
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
      setErrorMessage(
        `No fue posible cargar los ítems: ${currentError.message}`,
      );
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const loadIssuerProfiles = async () => {
    const { data, error } = await supabase
      .from("quote_issuer_profiles")
      .select(
        "id, profile_name, issuer_type, legal_name, commercial_name, document_type, document_number, tax_responsibility, city, address, email, phone, bank_name, bank_account_type, bank_account_number, footer_notes, logo_url, is_default, is_active",
      )
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      setErrorMessage(
        `No fue posible cargar los perfiles emisores: ${error.message}`,
      );
      setIssuerProfiles([]);
      return;
    }

    setIssuerProfiles((data ?? []) as IssuerProfile[]);
  };

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from("quote_templates")
      .select(
        "id, name, template_code, description, installation_type, estimated_duration, default_public_scope, default_labor_notes, default_logistics_notes, warranty_text, conditions_text, important_notes_text, exclusions_text, active",
      )
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      setErrorMessage(`No fue posible cargar las plantillas: ${error.message}`);
      setTemplates([]);
      return;
    }

    setTemplates((data ?? []) as QuoteTemplate[]);
  };

  const refreshAll = async () => {
    setLoading(true);
    setErrorMessage("");

    await Promise.all([
      loadQuote(),
      loadItems(),
      loadIssuerProfiles(),
      loadTemplates(),
    ]);

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

  const handleApplyTemplate = async () => {
    if (!quote || !form) return;

    if (!canEdit) {
      setErrorMessage(
        "Solo se pueden aplicar plantillas cuando la cotización está en borrador.",
      );
      return;
    }

    const template = templates.find(
      (current) => current.id === selectedTemplateId,
    );

    if (!template) {
      setErrorMessage("Selecciona una plantilla válida.");
      return;
    }

    const hasExistingContent = Boolean(
      quote.technical_scope ||
        quote.warranty_text ||
        quote.conditions_text ||
        quote.important_notes_text ||
        quote.exclusions_text,
    );

    const replaceTexts =
      !hasExistingContent ||
      window.confirm(
        "Esta acción reemplazará los términos comerciales actuales por los definidos en la plantilla seleccionada. ¿Deseas continuar?",
      );

    if (!replaceTexts) {
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await applyTemplateToQuote(quote.id, template.id, {
        replaceTexts: true,
      });

      setSuccessMessage(
        `Plantilla "${result.appliedTemplateName}" aplicada correctamente. Ítems insertados: ${result.insertedCount}. Duplicados omitidos: ${result.skippedCount}.`,
      );

      await refreshAll();
    } catch (error) {
      const currentError = error as Error;
      setErrorMessage(
        `No fue posible aplicar la plantilla: ${currentError.message}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleItemChange = (field: keyof ItemForm, value: string) => {
    setItemForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCatalogItemChange = (
    field: keyof CatalogItemForm,
    value: string,
  ) => {
    setCatalogItemForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleEditItemChange = (field: keyof EditItemForm, value: string) => {
    setEditItemForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSearchCatalogProducts = async () => {
    const searchTerm = catalogSearch.trim();

    if (searchTerm.length < 2) {
      setItemError(
        "Escribe mínimo 2 caracteres para buscar en el catálogo maestro.",
      );
      setCatalogProducts([]);
      return;
    }

    setCatalogLoading(true);
    setItemError("");

    try {
      const products = await searchQuoteCatalogProducts(searchTerm);
      setCatalogProducts(products);

      if (products.length === 0) {
        setItemError(
          "No se encontraron productos activos con ese criterio de búsqueda.",
        );
      }
    } catch (error) {
      const currentError = error as Error;
      setItemError(`No fue posible buscar productos: ${currentError.message}`);
      setCatalogProducts([]);
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleSelectCatalogProduct = (product: CatalogProduct) => {
    setSelectedCatalogProduct(product);
    setCatalogItemForm(initialCatalogItemForm);
    setItemError("");
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
        "Solo se pueden editar los datos generales cuando la cotización está en borrador.",
      );
      return;
    }

    if (!form.customer_name.trim()) {
      setErrorMessage("El nombre del cliente es obligatorio.");
      return;
    }

    const selectedIssuerProfile = issuerProfiles.find(
      (profile) => profile.id === form.issuer_profile_id,
    );

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await updateQuoteHeader(quote.id, {
        issuer_profile_id: form.issuer_profile_id || null,
        issuer_profile_name: selectedIssuerProfile?.profile_name ?? null,
        issuer_snapshot: selectedIssuerProfile ?? null,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim() || null,
        customer_email: form.customer_email.trim() || null,
        customer_city: form.customer_city.trim() || null,
        project_address: form.project_address.trim() || null,
        technical_scope: form.technical_scope.trim() || null,
        expiration_date: form.expiration_date || null,
        warranty_text: form.warranty_text.trim() || null,
        conditions_text: form.conditions_text.trim() || null,
        important_notes_text: form.important_notes_text.trim() || null,
        exclusions_text: form.exclusions_text.trim() || null,
      });

      setSuccessMessage("Datos de la cotización actualizados correctamente.");
      setIsEditing(false);
      await loadQuote();
    } catch (error) {
      const currentError = error as Error;
      setErrorMessage(
        `No fue posible actualizar la cotización: ${currentError.message}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOpenItemModal = () => {
    setItemModalMode("manual");
    setItemForm(initialItemForm);
    setCatalogSearch("");
    setCatalogProducts([]);
    setSelectedCatalogProduct(null);
    setCatalogItemForm(initialCatalogItemForm);
    setItemError("");
    setIsItemModalOpen(true);
  };

  const handleCloseItemModal = () => {
    if (!savingItem) {
      setIsItemModalOpen(false);
      setItemModalMode("manual");
      setItemForm(initialItemForm);
      setCatalogSearch("");
      setCatalogProducts([]);
      setSelectedCatalogProduct(null);
      setCatalogItemForm(initialCatalogItemForm);
      setItemError("");
    }
  };

  const handleCreateManualItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!quote) return;

    if (!canEdit) {
      setItemError(
        "Solo se pueden agregar ítems cuando la cotización está en borrador.",
      );
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

  const handleCreateCatalogItem = async () => {
    if (!quote) return;

    if (!canEdit) {
      setItemError(
        "Solo se pueden agregar productos cuando la cotización está en borrador.",
      );
      return;
    }

    if (!selectedCatalogProduct) {
      setItemError("Selecciona un producto del catálogo maestro.");
      return;
    }

    const pricingSnapshot = getCatalogPricingSnapshot(
      selectedCatalogProduct,
      catalogItemForm.quantity,
      catalogItemForm.discount,
    );

    if (pricingSnapshot.quantity <= 0) {
      setItemError("La cantidad debe ser mayor a cero.");
      return;
    }

    setSavingItem(true);
    setItemError("");
    setErrorMessage("");
    setSuccessMessage("");

    const proportionalNote = pricingSnapshot.isProportional
      ? `Consumo proporcional: compra por ${pricingSnapshot.purchaseUnit} x ${pricingSnapshot.unitContent}, venta pública por ${pricingSnapshot.publicSaleUnit}, cotización por ${pricingSnapshot.quoteUnit}.`
      : `Unidad de cotización: ${pricingSnapshot.quoteUnit}.`;

    const itemNotes =
      [catalogItemForm.notes.trim(), proportionalNote]
        .filter(Boolean)
        .join(" | ") || null;

    try {
      await createCatalogQuoteItem({
        quote_id: quote.id,
        item_type: "product",
        item_name: selectedCatalogProduct.name,
        item_description: selectedCatalogProduct.description ?? null,
        sku: selectedCatalogProduct.sku ?? null,
        quantity: pricingSnapshot.quantity,
        unit_cost: pricingSnapshot.unitCost,
        unit_price: pricingSnapshot.unitPrice,
        unit_type: pricingSnapshot.quoteUnit,
        quote_unit: pricingSnapshot.quoteUnit,
        purchase_unit: pricingSnapshot.purchaseUnit,
        unit_content: pricingSnapshot.unitContent,
        proportional_enabled: pricingSnapshot.isProportional,
        discount: pricingSnapshot.discount,
        subtotal: pricingSnapshot.subtotal,
        total_cost: pricingSnapshot.totalCost,
        profit: pricingSnapshot.profit,
        margin_percentage: pricingSnapshot.marginPercentage,
        notes: itemNotes,
      });

      setSuccessMessage("Producto del catálogo agregado correctamente.");
      setIsItemModalOpen(false);
      setItemModalMode("manual");
      setCatalogSearch("");
      setCatalogProducts([]);
      setSelectedCatalogProduct(null);
      setCatalogItemForm(initialCatalogItemForm);
      await refreshAll();
    } catch (error) {
      const currentError = error as Error;
      setItemError(
        `No fue posible agregar el producto: ${currentError.message}`,
      );
    } finally {
      setSavingItem(false);
    }
  };

  const selectedCatalogPricing = selectedCatalogProduct
    ? getCatalogPricingSnapshot(
        selectedCatalogProduct,
        catalogItemForm.quantity,
        catalogItemForm.discount,
      )
    : null;

  const handleOpenEditItemModal = (item: QuoteItem) => {
    if (!canEdit) {
      setErrorMessage(
        "Solo se pueden editar ítems cuando la cotización está en borrador.",
      );
      return;
    }

    setEditingItem(item);
    setEditItemForm({
      quantity: String(item.quantity ?? 1),
      discount: String(item.discount ?? 0),
      notes: item.notes ?? "",
    });
    setEditItemError("");
    setErrorMessage("");
    setSuccessMessage("");
    setIsEditItemModalOpen(true);
  };

  const handleCloseEditItemModal = () => {
    if (savingEditItem) return;

    setIsEditItemModalOpen(false);
    setEditingItem(null);
    setEditItemForm(initialEditItemForm);
    setEditItemError("");
  };

  const handleSaveEditedItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!quote || !editingItem) return;

    if (!canEdit) {
      setEditItemError(
        "Solo se pueden editar ítems cuando la cotización está en borrador.",
      );
      return;
    }

    const quantity = parseNumber(editItemForm.quantity);
    const discount = parseNumber(editItemForm.discount);
    const unitCost = Number(editingItem.unit_cost ?? 0);
    const unitPrice = Number(editingItem.unit_price ?? 0);

    if (quantity <= 0) {
      setEditItemError("La cantidad debe ser mayor a cero.");
      return;
    }

    if (discount < 0) {
      setEditItemError("El descuento no puede ser negativo.");
      return;
    }

    const subtotal = Math.max(Math.round(quantity * unitPrice) - discount, 0);
    const totalCost = Math.round(quantity * unitCost);
    const profit = subtotal - totalCost;
    const marginPercentage = subtotal > 0 ? (profit / subtotal) * 100 : 0;

    setSavingEditItem(true);
    setEditItemError("");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await updateQuoteItemSnapshot(quote.id, editingItem.id, {
        quantity,
        discount,
        subtotal,
        total_cost: totalCost,
        profit,
        margin_percentage: marginPercentage,
        notes: editItemForm.notes.trim() || null,
      });

      setSuccessMessage(
        "Ítem actualizado correctamente sin modificar su snapshot de precio/costo.",
      );
      setIsEditItemModalOpen(false);
      setEditingItem(null);
      setEditItemForm(initialEditItemForm);
      await refreshAll();
    } catch (error) {
      const currentError = error as Error;
      setEditItemError(
        `No fue posible actualizar el ítem: ${currentError.message}`,
      );
    } finally {
      setSavingEditItem(false);
    }
  };

  const handleDeleteItem = async (item: QuoteItem) => {
    if (!quote || !canEdit) {
      setErrorMessage(
        "Solo se pueden eliminar ítems cuando la cotización está en borrador.",
      );
      return;
    }

    const confirmDelete = window.confirm(
      `¿Eliminar el ítem "${item.item_name}"?`,
    );
    if (!confirmDelete) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteQuoteItem(quote.id, item.id);
      setSuccessMessage("Ítem eliminado correctamente.");
      await refreshAll();
    } catch (error) {
      const currentError = error as Error;
      setErrorMessage(
        `No fue posible eliminar el ítem: ${currentError.message}`,
      );
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

  const issuerSnapshot = getIssuerSnapshot(quote);

  return (
    <>
      <style>{`
        @media screen {
          .quote-print-area {
            display: none;
          }
        }

        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          .quote-print-area,
          .quote-print-area * {
            visibility: visible;
          }

          .quote-print-area {
            display: block !important;
            position: absolute;
            inset: 0;
            width: 100%;
            min-height: 100vh;
            background: white;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <section className="no-print min-h-screen bg-slate-100 px-4 py-6">
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

            <button
              type="button"
              onClick={handlePrintQuote}
              className="rounded-2xl border border-[#2D5398]/20 bg-white px-5 py-3 text-sm font-semibold text-[#2D5398] transition hover:bg-[#2D5398]/10"
            >
              Generar PDF
            </button>

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
          <form
            onSubmit={handleSaveChanges}
            className="rounded-3xl bg-white p-6 shadow-sm"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                Editar datos generales
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Actualiza la información principal de la cotización.
              </p>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2D5398]">
                      Plantillas comerciales ADDA
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-slate-800">
                      Aplicar plantilla base
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Precarga automáticamente alcance, condiciones y notas comerciales.
                    </p>

                    <select
                      value={selectedTemplateId}
                      onChange={(event) =>
                        setSelectedTemplateId(event.target.value)
                      }
                      className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2D5398]"
                    >
                      <option value="">Seleccionar plantilla</option>

                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>

                    {selectedTemplateId && (
                      <div className="mt-3 rounded-2xl bg-white p-4 text-sm text-slate-600">
                        <p className="font-semibold text-slate-800">
                          {templates.find(
                            (template) => template.id === selectedTemplateId,
                          )?.description ?? "Sin descripción"}
                        </p>
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          Duración estimada: {templates.find(
                            (template) => template.id === selectedTemplateId,
                          )?.estimated_duration ?? "No definida"}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyTemplate}
                    className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684]"
                  >
                    Aplicar plantilla
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Perfil emisor
                </label>

                <select
                  value={form.issuer_profile_id}
                  onChange={(event) =>
                    handleChange("issuer_profile_id", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                >
                  <option value="">Seleccionar perfil emisor</option>

                  {issuerProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.profile_name}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs font-medium text-slate-500">
                  Este perfil define la razón social, datos fiscales y datos
                  bancarios que quedarán asociados a la cotización.
                </p>
              </div>

              <input
                value={form.customer_name}
                onChange={(event) =>
                  handleChange("customer_name", event.target.value)
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Cliente"
              />

              <input
                value={form.customer_phone}
                onChange={(event) =>
                  handleChange("customer_phone", event.target.value)
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Teléfono"
              />

              <input
                value={form.customer_email}
                onChange={(event) =>
                  handleChange("customer_email", event.target.value)
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Correo"
              />

              <input
                value={form.customer_city}
                onChange={(event) =>
                  handleChange("customer_city", event.target.value)
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Ciudad"
              />

              <input
                value={form.project_address}
                onChange={(event) =>
                  handleChange("project_address", event.target.value)
                }
                className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Dirección del proyecto"
              />

              <textarea
                value={form.technical_scope}
                onChange={(event) =>
                  handleChange("technical_scope", event.target.value)
                }
                rows={4}
                className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                placeholder="Alcance del proyecto"
              />

              <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2D5398]">
                    Términos comerciales
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-800">
                    Garantía, condiciones, notas y exclusiones
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Estos textos quedan guardados en esta cotización y serán usados
                    para el PDF comercial. Puedes ajustarlos según el proyecto.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Garantía
                    </label>
                    <textarea
                      value={form.warranty_text}
                      onChange={(event) =>
                        handleChange("warranty_text", event.target.value)
                      }
                      rows={5}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#2D5398] focus:bg-white"
                      placeholder="Texto de garantía"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Condiciones
                    </label>
                    <textarea
                      value={form.conditions_text}
                      onChange={(event) =>
                        handleChange("conditions_text", event.target.value)
                      }
                      rows={5}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#2D5398] focus:bg-white"
                      placeholder="Condiciones comerciales"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Notas importantes
                    </label>
                    <textarea
                      value={form.important_notes_text}
                      onChange={(event) =>
                        handleChange("important_notes_text", event.target.value)
                      }
                      rows={5}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#2D5398] focus:bg-white"
                      placeholder="Notas importantes"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Exclusiones importantes
                    </label>
                    <textarea
                      value={form.exclusions_text}
                      onChange={(event) =>
                        handleChange("exclusions_text", event.target.value)
                      }
                      rows={5}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#2D5398] focus:bg-white"
                      placeholder="Exclusiones importantes"
                    />
                  </div>
                </div>
              </div>

              <input
                type="date"
                value={form.expiration_date}
                onChange={(event) =>
                  handleChange("expiration_date", event.target.value)
                }
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
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
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

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Perfil emisor
                  </p>

                  <h2 className="mt-2 text-lg font-bold text-slate-800">
                    {quote.issuer_profile_name ?? "Sin perfil asignado"}
                  </h2>
                </div>

                {issuerSnapshot && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    Snapshot
                  </span>
                )}
              </div>

              {issuerSnapshot ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Razón social
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {getTextValue(issuerSnapshot.legal_name)}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {getTextValue(issuerSnapshot.document_type, "Doc.")} ·{" "}
                      {getTextValue(issuerSnapshot.document_number)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Responsabilidad fiscal
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {getTextValue(issuerSnapshot.tax_responsibility)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Datos bancarios
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {getTextValue(issuerSnapshot.bank_name)}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {getTextValue(issuerSnapshot.bank_account_type, "Cuenta")} ·{" "}
                      {getTextValue(issuerSnapshot.bank_account_number)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Contacto comercial
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {getTextValue(issuerSnapshot.phone)}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {getTextValue(issuerSnapshot.email)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  Edita los datos para seleccionar Adela, Luis Darío o futura
                  S.A.S. Esta información quedará congelada al guardar la
                  cotización.
                </p>
              )}
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
          onEditItem={handleOpenEditItemModal}
          onDeleteItem={handleDeleteItem}
        />
      </div>

      {isEditItemModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Editar ítem de la cotización
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Solo se actualizan cantidad, descuento y notas. El precio y
                  costo unitario quedan congelados para proteger el snapshot.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseEditItemModal}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {editItemError && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {editItemError}
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Snapshot protegido
              </p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">
                {editingItem.item_name}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Precio unitario:{" "}
                {moneyFormatter.format(Number(editingItem.unit_price ?? 0))} ·
                Costo unitario:{" "}
                {moneyFormatter.format(Number(editingItem.unit_cost ?? 0))}
              </p>
            </div>

            <form
              onSubmit={handleSaveEditedItem}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Cantidad
                </label>
                <input
                  value={editItemForm.quantity}
                  onChange={(event) =>
                    handleEditItemChange("quantity", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Descuento
                </label>
                <input
                  value={editItemForm.discount}
                  onChange={(event) =>
                    handleEditItemChange("discount", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Notas internas
                </label>
                <textarea
                  value={editItemForm.notes}
                  onChange={(event) =>
                    handleEditItemChange("notes", event.target.value)
                  }
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={handleCloseEditItemModal}
                  disabled={savingEditItem}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingEditItem}
                  className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:opacity-60"
                >
                  {savingEditItem ? "Actualizando..." : "Actualizar ítem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Agregar ítem a la cotización
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Agrega un ítem manual o selecciona un producto real desde el
                  catálogo maestro.
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

            <div className="mt-6 grid gap-3 rounded-2xl bg-slate-100 p-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setItemModalMode("manual");
                  setItemError("");
                }}
                className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                  itemModalMode === "manual"
                    ? "bg-white text-[#2D5398] shadow-sm"
                    : "text-slate-500 hover:bg-white/70"
                }`}
              >
                Ítem manual
              </button>

              <button
                type="button"
                onClick={() => {
                  setItemModalMode("catalog");
                  setItemError("");
                }}
                className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                  itemModalMode === "catalog"
                    ? "bg-white text-[#2D5398] shadow-sm"
                    : "text-slate-500 hover:bg-white/70"
                }`}
              >
                Catálogo maestro
              </button>
            </div>

            {itemError && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {itemError}
              </div>
            )}

            {itemModalMode === "manual" ? (
              <form
                onSubmit={handleCreateManualItem}
                className="mt-6 grid gap-4 md:grid-cols-2"
              >
                <input
                  value={itemForm.item_name}
                  onChange={(event) =>
                    handleItemChange("item_name", event.target.value)
                  }
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
                  onChange={(event) =>
                    handleItemChange("quantity", event.target.value)
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Cantidad"
                />

                <input
                  value={itemForm.unit_cost}
                  onChange={(event) =>
                    handleItemChange("unit_cost", event.target.value)
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Costo unitario"
                />

                <input
                  value={itemForm.unit_price}
                  onChange={(event) =>
                    handleItemChange("unit_price", event.target.value)
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Precio unitario"
                />

                <input
                  value={itemForm.discount}
                  onChange={(event) =>
                    handleItemChange("discount", event.target.value)
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Descuento"
                />

                <textarea
                  value={itemForm.notes}
                  onChange={(event) =>
                    handleItemChange("notes", event.target.value)
                  }
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
            ) : (
              <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-lg font-bold text-slate-800">
                    Buscar en catálogo maestro
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Busca por nombre, SKU o categoría. No se filtra por
                    visibilidad pública.
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      value={catalogSearch}
                      onChange={(event) => setCatalogSearch(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleSearchCatalogProducts();
                        }
                      }}
                      className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2D5398]"
                      placeholder="Ejemplo: cámara, DVR, mano de obra, SKU..."
                    />

                    <button
                      type="button"
                      onClick={handleSearchCatalogProducts}
                      disabled={catalogLoading}
                      className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:opacity-60"
                    >
                      {catalogLoading ? "Buscando..." : "Buscar"}
                    </button>
                  </div>

                  <div className="mt-4 flex max-h-80 flex-col gap-3 overflow-y-auto pr-1">
                    {catalogProducts.map((product) => {
                      const isSelected =
                        selectedCatalogProduct?.id === product.id;

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleSelectCatalogProduct(product)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            isSelected
                              ? "border-[#2D5398] bg-white shadow-sm"
                              : "border-slate-200 bg-white hover:border-[#2D5398]/60"
                          }`}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-bold text-slate-800">
                                {product.name}
                              </p>
                              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                {product.sku ?? "Sin SKU"} ·{" "}
                                {product.category ?? "Sin categoría"}
                              </p>
                            </div>

                            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                              Stock: {product.stock ?? 0}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                            <span>
                              Costo:{" "}
                              {moneyFormatter.format(
                                Number(product.cost_price ?? 0),
                              )}
                            </span>
                            <span>
                              Precio:{" "}
                              {moneyFormatter.format(
                                Number(product.price ?? 0),
                              )}
                            </span>
                          </div>

                          {Boolean(
                            (product as UnitAwareCatalogProduct).quote_by_unit,
                          ) ? (
                            <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                              Proporcional: compra por{" "}
                              {(product as UnitAwareCatalogProduct)
                                .purchase_unit ?? "unidad"}{" "}
                              x{" "}
                              {(product as UnitAwareCatalogProduct)
                                .unit_content ?? 1}
                              ; cotiza por{" "}
                              {(product as UnitAwareCatalogProduct)
                                .quote_unit ??
                                (product as UnitAwareCatalogProduct)
                                  .sale_unit ??
                                "unidad"}
                            </div>
                          ) : (
                            <div className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                              Producto unitario: la cantidad se toma como{" "}
                              {(product as UnitAwareCatalogProduct)
                                .quote_unit ??
                                (product as UnitAwareCatalogProduct)
                                  .public_sale_unit ??
                                (product as UnitAwareCatalogProduct)
                                  .sale_unit ??
                                "unidad"}
                              .
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <h3 className="text-lg font-bold text-slate-800">
                    Producto seleccionado
                  </h3>

                  {selectedCatalogProduct ? (
                    <div className="mt-4">
                      <p className="text-xl font-bold text-slate-800">
                        {selectedCatalogProduct.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {selectedCatalogProduct.description ??
                          "Sin descripción registrada."}
                      </p>

                      <div className="mt-4 grid gap-3 text-sm">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <span className="font-semibold text-slate-500">
                            SKU
                          </span>
                          <p className="font-bold text-slate-800">
                            {selectedCatalogProduct.sku ?? "No registrado"}
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <span className="font-semibold text-slate-500">
                              Costo base
                            </span>
                            <p className="font-bold text-slate-800">
                              {moneyFormatter.format(
                                Number(selectedCatalogProduct.cost_price ?? 0),
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-3">
                            <span className="font-semibold text-slate-500">
                              Precio base
                            </span>
                            <p className="font-bold text-slate-800">
                              {moneyFormatter.format(
                                Number(selectedCatalogProduct.price ?? 0),
                              )}
                            </p>
                          </div>
                        </div>

                        {selectedCatalogPricing && (
                          <div
                            className={`mt-3 rounded-2xl border p-4 ${
                              selectedCatalogPricing.isProportional
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className={`text-xs font-bold uppercase tracking-wide ${
                                  selectedCatalogPricing.isProportional
                                    ? "text-emerald-700"
                                    : "text-slate-600"
                                }`}
                              >
                                {selectedCatalogPricing.isProportional
                                  ? "Consumo proporcional activo"
                                  : "Producto unitario"}
                              </span>

                              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
                                Cantidad en{" "}
                                {getUnitDisplayName(
                                  selectedCatalogPricing.quoteUnit,
                                )}
                              </span>
                            </div>

                            <div className="mt-3 rounded-2xl bg-white p-3 text-sm font-semibold text-slate-700">
                              {selectedCatalogPricing.isProportional ? (
                                <p>
                                  Vas a cotizar{" "}
                                  {selectedCatalogPricing.quantity}{" "}
                                  {getUnitDisplayName(
                                    selectedCatalogPricing.quoteUnit,
                                  )}
                                  , no{" "}
                                  {getUnitDisplayName(
                                    selectedCatalogPricing.purchaseUnit,
                                  )}{" "}
                                  completos.
                                </p>
                              ) : (
                                <p>
                                  Este producto está configurado como unitario.
                                  La cantidad representa{" "}
                                  {getUnitDisplayName(
                                    selectedCatalogPricing.quoteUnit,
                                  )}
                                  .
                                </p>
                              )}
                            </div>

                            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                              <span>
                                Costo por {selectedCatalogPricing.quoteUnit}:{" "}
                                {moneyFormatter.format(
                                  selectedCatalogPricing.unitCost,
                                )}
                              </span>
                              <span>
                                Precio por {selectedCatalogPricing.quoteUnit}:{" "}
                                {moneyFormatter.format(
                                  selectedCatalogPricing.unitPrice,
                                )}
                              </span>
                              <span>
                                Subtotal: {selectedCatalogPricing.quantity}{" "}
                                {selectedCatalogPricing.quoteUnit} ×{" "}
                                {moneyFormatter.format(
                                  selectedCatalogPricing.unitPrice,
                                )}{" "}
                                ={" "}
                                {moneyFormatter.format(
                                  selectedCatalogPricing.subtotal,
                                )}
                              </span>
                              <span>
                                Utilidad:{" "}
                                {moneyFormatter.format(
                                  selectedCatalogPricing.profit,
                                )}
                              </span>
                            </div>

                            {selectedCatalogPricing.isProportional ? (
                              <p className="mt-2 text-xs font-medium text-slate-600">
                                Compra por {selectedCatalogPricing.purchaseUnit}{" "}
                                x {selectedCatalogPricing.unitContent};
                                ecommerce por{" "}
                                {selectedCatalogPricing.publicSaleUnit};
                                cotización por{" "}
                                {selectedCatalogPricing.quoteUnit}.
                              </p>
                            ) : (
                              <p className="mt-2 text-xs font-medium text-slate-600">
                                Si este material debe cotizarse por metro,
                                unidad suelta o tramo, primero actívale
                                "Cotización proporcional" en Productos.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                            {getQuantityLabel(selectedCatalogPricing)}
                          </label>
                          <input
                            value={catalogItemForm.quantity}
                            onChange={(event) =>
                              handleCatalogItemChange(
                                "quantity",
                                event.target.value,
                              )
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                            placeholder={
                              selectedCatalogPricing
                                ? `Ej: 20 ${getUnitDisplayName(selectedCatalogPricing.quoteUnit)}`
                                : "Cantidad"
                            }
                          />
                          {selectedCatalogPricing?.isProportional && (
                            <p className="mt-1 text-xs font-medium text-emerald-700">
                              Esta cantidad se tomará como{" "}
                              {selectedCatalogPricing.quoteUnit}, no como{" "}
                              {selectedCatalogPricing.purchaseUnit} completo.
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                            Descuento
                          </label>
                          <input
                            value={catalogItemForm.discount}
                            onChange={(event) =>
                              handleCatalogItemChange(
                                "discount",
                                event.target.value,
                              )
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                            placeholder="Descuento"
                          />
                        </div>
                      </div>

                      <textarea
                        value={catalogItemForm.notes}
                        onChange={(event) =>
                          handleCatalogItemChange("notes", event.target.value)
                        }
                        rows={3}
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                        placeholder="Notas internas"
                      />

                      <div className="mt-5 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={handleCloseItemModal}
                          disabled={savingItem}
                          className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-60"
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          onClick={handleCreateCatalogItem}
                          disabled={savingItem}
                          className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:opacity-60"
                        >
                          {savingItem ? "Agregando..." : "Agregar producto"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                      Selecciona un producto del listado para agregarlo a la
                      cotización.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </section>

      <div className="quote-print-area">
        <QuotePdfTemplate
          quote={quote}
          items={items}
          quoteTotals={quoteTotals}
          moneyFormatter={moneyFormatter}
        />
      </div>
    </>
  );
};
