import { type FormEvent, useEffect, useMemo, useState } from "react";
import { supabaseAdmin } from "../lib/supabase";
import {
  createQuoteTemplateItem,
  deleteQuoteTemplateItem,
  getQuoteTemplateItems,
  searchQuoteCatalogProducts,
  type CatalogProduct,
  type QuoteTemplateItem,
  type QuoteTemplateItemType,
} from "../modules/quotes/services/quoteService.ts";

type QuoteTemplate = {
  id: string;
  name: string;
  template_code: string | null;
  description: string | null;
  service_type: string;
  installation_type: string | null;
  estimated_duration: string | null;
  default_public_scope: string | null;
  compatible_analog: boolean;
  compatible_ip: boolean;
  compatible_wifi: boolean;
  compatible_solar: boolean;
  compatible_ajax: boolean;
  default_labor_notes: string | null;
  default_logistics_notes: string | null;
  warranty_text: string | null;
  conditions_text: string | null;
  important_notes_text: string | null;
  exclusions_text: string | null;
  active: boolean;
  created_at: string;
  updated_at?: string;
};

type FormState = {
  name: string;
  template_code: string;
  description: string;
  service_type: string;
  installation_type: string;
  estimated_duration: string;
  default_public_scope: string;
  default_labor_notes: string;
  default_logistics_notes: string;
  warranty_text: string;
  conditions_text: string;
  important_notes_text: string;
  exclusions_text: string;
  compatible_analog: boolean;
  compatible_ip: boolean;
  compatible_wifi: boolean;
  compatible_solar: boolean;
  compatible_ajax: boolean;
  active: boolean;
};

type ManualItemForm = {
  item_type: QuoteTemplateItemType;
  item_name: string;
  item_description: string;
  public_description: string;
  quantity: string;
  unit_cost: string;
  unit_price: string;
  discount: string;
  unit_type: string;
  notes: string;
  internal_notes: string;
  customer_section: string;
  cost_category: string;
};

type CatalogItemForm = {
  quantity: string;
  discount: string;
  public_description: string;
  notes: string;
  internal_notes: string;
  customer_section: string;
  cost_category: string;
};

type UnitAwareCatalogProduct = CatalogProduct & {
  sale_unit?: string | null;
  public_sale_unit?: string | null;
  quote_unit?: string | null;
  purchase_unit?: string | null;
  unit_content?: number | string | null;
  quote_by_unit?: boolean | null;
};

const initialForm: FormState = {
  name: "",
  template_code: "",
  description: "",
  service_type: "installation",
  installation_type: "analog",
  estimated_duration: "",
  default_public_scope: "",
  default_labor_notes: "",
  default_logistics_notes: "",
  warranty_text: "",
  conditions_text: "",
  important_notes_text: "",
  exclusions_text: "",
  compatible_analog: false,
  compatible_ip: false,
  compatible_wifi: false,
  compatible_solar: false,
  compatible_ajax: false,
  active: true,
};

const initialManualItemForm: ManualItemForm = {
  item_type: "labor",
  item_name: "",
  item_description: "",
  public_description: "",
  quantity: "1",
  unit_cost: "0",
  unit_price: "0",
  discount: "0",
  unit_type: "servicio",
  notes: "",
  internal_notes: "",
  customer_section: "Mano de obra",
  cost_category: "mano_obra",
};

const initialCatalogItemForm: CatalogItemForm = {
  quantity: "1",
  discount: "0",
  public_description: "",
  notes: "",
  internal_notes: "",
  customer_section: "Equipos y materiales",
  cost_category: "producto",
};

const serviceTypes = [
  { value: "installation", label: "Instalación" },
  { value: "maintenance", label: "Mantenimiento" },
  { value: "diagnostic", label: "Diagnóstico" },
  { value: "support", label: "Soporte técnico" },
];

const installationTypes = [
  { value: "analog", label: "CCTV análogo" },
  { value: "ip", label: "CCTV IP" },
  { value: "wifi", label: "CCTV WiFi" },
  { value: "solar", label: "CCTV solar" },
  { value: "ajax", label: "Alarmas AJAX" },
  { value: "maintenance", label: "Mantenimiento" },
  { value: "diagnostic", label: "Diagnóstico" },
  { value: "support", label: "Soporte técnico" },
];

const templateItemTypes: Array<{ value: QuoteTemplateItemType; label: string }> = [
  { value: "labor", label: "Mano de obra" },
  { value: "logistics", label: "Logística / viáticos" },
  { value: "manual", label: "Ítem operativo" },
  { value: "technical_catalog", label: "Servicio técnico" },
];

const moneyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const getServiceTypeLabel = (value: string) => {
  return serviceTypes.find((type) => type.value === value)?.label ?? value;
};

const getInstallationTypeLabel = (value: string | null) => {
  if (!value) return "Sin tecnología";
  return installationTypes.find((type) => type.value === value)?.label ?? value;
};

const getTemplateItemTypeLabel = (value: QuoteTemplateItemType) => {
  if (value === "product") return "Producto";
  return templateItemTypes.find((type) => type.value === value)?.label ?? value;
};

const normalizeCode = (value: string) => {
  return value
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 30);
};

const generateTemplateCode = (name: string) => {
  const normalized = normalizeCode(name);
  return normalized ? `TPL-${normalized}` : "TPL-NUEVA-PLANTILLA";
};

const parseNumber = (value: string) => {
  const cleanValue = value.replace(/\./g, "").replace(",", ".");
  const numberValue = Number(cleanValue);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const getCatalogPricingSnapshot = (
  product: CatalogProduct,
  quantityValue: string,
  discountValue: string,
) => {
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
    quoteUnit:
      unitAwareProduct.quote_unit ?? unitAwareProduct.sale_unit ?? "unidad",
  };
};

const buildManualPricingSnapshot = (form: ManualItemForm) => {
  const quantity = parseNumber(form.quantity);
  const unitCost = parseNumber(form.unit_cost);
  const unitPrice = parseNumber(form.unit_price);
  const discount = parseNumber(form.discount);
  const subtotal = Math.max(Math.round(quantity * unitPrice) - discount, 0);
  const totalCost = Math.round(quantity * unitCost);
  const profit = subtotal - totalCost;
  const marginPercentage = subtotal > 0 ? (profit / subtotal) * 100 : 0;

  return {
    quantity,
    unitCost,
    unitPrice,
    discount,
    subtotal,
    totalCost,
    profit,
    marginPercentage,
  };
};

export const AdminTemplatesPage = () => {
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [templateItems, setTemplateItems] = useState<QuoteTemplateItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemMode, setItemMode] = useState<"catalog" | "manual">("catalog");
  const [manualItemForm, setManualItemForm] =
    useState<ManualItemForm>(initialManualItemForm);
  const [catalogItemForm, setCatalogItemForm] =
    useState<CatalogItemForm>(initialCatalogItemForm);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [selectedCatalogProduct, setSelectedCatalogProduct] =
    useState<CatalogProduct | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [itemError, setItemError] = useState("");

  const activeTemplate = useMemo(
    () => templates.find((template) => template.id === editingId) ?? null,
    [templates, editingId],
  );

  const selectedCatalogPricing = selectedCatalogProduct
    ? getCatalogPricingSnapshot(
        selectedCatalogProduct,
        catalogItemForm.quantity,
        catalogItemForm.discount,
      )
    : null;

  const templateEstimatedSubtotal = templateItems.reduce(
    (total, item) => total + Number(item.subtotal ?? 0),
    0,
  );

  const templateEstimatedCost = templateItems.reduce(
    (total, item) => total + Number(item.total_cost ?? 0),
    0,
  );

  const templateEstimatedProfit =
    templateEstimatedSubtotal - templateEstimatedCost;

  const loadTemplates = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabaseAdmin
      .from("quote_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("No fue posible cargar las plantillas de cotización.");
      setTemplates([]);
    } else {
      setTemplates((data ?? []) as QuoteTemplate[]);
    }

    setLoading(false);
  };

  const loadTemplateItems = async (templateId: string) => {
    setItemsLoading(true);
    setItemError("");

    try {
      const data = await getQuoteTemplateItems(templateId);
      setTemplateItems(data);
    } catch (error) {
      const currentError = error as Error;
      setItemError(
        `No fue posible cargar los ítems operativos: ${currentError.message}`,
      );
      setTemplateItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (!editingId) {
      setTemplateItems([]);
      return;
    }

    loadTemplateItems(editingId);
  }, [editingId]);

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesSearch =
        !term ||
        template.name.toLowerCase().includes(term) ||
        template.template_code?.toLowerCase().includes(term) ||
        template.description?.toLowerCase().includes(term) ||
        template.service_type.toLowerCase().includes(term) ||
        template.installation_type?.toLowerCase().includes(term);

      const matchesService =
        serviceFilter === "all" || template.service_type === serviceFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && template.active) ||
        (statusFilter === "inactive" && !template.active);

      return matchesSearch && matchesService && matchesStatus;
    });
  }, [templates, search, serviceFilter, statusFilter]);

  const resetItemBuilder = () => {
    setItemMode("catalog");
    setManualItemForm(initialManualItemForm);
    setCatalogItemForm(initialCatalogItemForm);
    setCatalogSearch("");
    setCatalogProducts([]);
    setSelectedCatalogProduct(null);
    setItemError("");
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setMessage("");
    setError("");
    setTemplateItems([]);
    resetItemBuilder();
  };

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "name" && !editingId && !current.template_code.trim()) {
        next.template_code = generateTemplateCode(String(value));
      }

      return next;
    });
  };

  const handleManualItemChange = (
    field: keyof ManualItemForm,
    value: string,
  ) => {
    setManualItemForm((current) => ({
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    if (!form.name.trim()) {
      setError("El nombre de la plantilla es obligatorio.");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      template_code:
        form.template_code.trim() || generateTemplateCode(form.name),
      description: form.description.trim() || null,
      service_type: form.service_type,
      installation_type: form.installation_type,
      estimated_duration: form.estimated_duration.trim() || null,
      default_public_scope: form.default_public_scope.trim() || null,
      default_labor_notes: form.default_labor_notes.trim() || null,
      default_logistics_notes: form.default_logistics_notes.trim() || null,
      warranty_text: form.warranty_text.trim() || null,
      conditions_text: form.conditions_text.trim() || null,
      important_notes_text: form.important_notes_text.trim() || null,
      exclusions_text: form.exclusions_text.trim() || null,
      compatible_analog: form.compatible_analog,
      compatible_ip: form.compatible_ip,
      compatible_wifi: form.compatible_wifi,
      compatible_solar: form.compatible_solar,
      compatible_ajax: form.compatible_ajax,
      active: form.active,
      updated_at: new Date().toISOString(),
    };

    const response = editingId
      ? await supabaseAdmin
          .from("quote_templates")
          .update(payload)
          .eq("id", editingId)
      : await supabaseAdmin.from("quote_templates").insert(payload).select("id").single();

    if (response.error) {
      setError(
        response.error.message || "No fue posible guardar la plantilla.",
      );
    } else {
      const createdId =
        !editingId && "data" in response && response.data
          ? (response.data as { id: string }).id
          : editingId;

      setMessage(
        editingId
          ? "Plantilla actualizada correctamente."
          : "Plantilla creada correctamente. Ahora puedes agregar ítems operativos.",
      );

      await loadTemplates();

      if (createdId) {
        setEditingId(createdId);
      }
    }

    setSaving(false);
  };

  const handleEdit = (template: QuoteTemplate) => {
    setEditingId(template.id);

    setForm({
      name: template.name,
      template_code: template.template_code ?? "",
      description: template.description ?? "",
      service_type: template.service_type,
      installation_type: template.installation_type ?? "analog",
      estimated_duration: template.estimated_duration ?? "",
      default_public_scope: template.default_public_scope ?? "",
      default_labor_notes: template.default_labor_notes ?? "",
      default_logistics_notes: template.default_logistics_notes ?? "",
      warranty_text: template.warranty_text ?? "",
      conditions_text: template.conditions_text ?? "",
      important_notes_text: template.important_notes_text ?? "",
      exclusions_text: template.exclusions_text ?? "",
      compatible_analog: template.compatible_analog,
      compatible_ip: template.compatible_ip,
      compatible_wifi: template.compatible_wifi,
      compatible_solar: template.compatible_solar,
      compatible_ajax: template.compatible_ajax,
      active: template.active,
    });

    resetItemBuilder();
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleStatus = async (template: QuoteTemplate) => {
    setMessage("");
    setError("");

    const { error } = await supabaseAdmin
      .from("quote_templates")
      .update({
        active: !template.active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", template.id);

    if (error) {
      setError("No fue posible actualizar el estado de la plantilla.");
    } else {
      setMessage(
        !template.active
          ? "Plantilla activada correctamente."
          : "Plantilla desactivada correctamente.",
      );
      await loadTemplates();
    }
  };

  const handleDelete = async (template: QuoteTemplate) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar la plantilla "${template.name}"? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    setDeletingId(template.id);
    setMessage("");
    setError("");

    const { error } = await supabaseAdmin
      .from("quote_templates")
      .delete()
      .eq("id", template.id);

    if (error) {
      setError(
        "No fue posible eliminar la plantilla. Verifica si tiene ítems asociados o dependencias.",
      );
    } else {
      setMessage("Plantilla eliminada correctamente.");

      if (editingId === template.id) {
        resetForm();
      }

      await loadTemplates();
    }

    setDeletingId(null);
  };

  const handleSearchCatalogProducts = async () => {
    const searchTerm = catalogSearch.trim();

    if (searchTerm.length < 2) {
      setItemError("Escribe mínimo 2 caracteres para buscar productos.");
      setCatalogProducts([]);
      return;
    }

    setCatalogLoading(true);
    setItemError("");

    try {
      const products = await searchQuoteCatalogProducts(searchTerm);
      setCatalogProducts(products);

      if (products.length === 0) {
        setItemError("No se encontraron productos activos con ese criterio.");
      }
    } catch (error) {
      const currentError = error as Error;
      setItemError(`No fue posible buscar productos: ${currentError.message}`);
      setCatalogProducts([]);
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleCreateCatalogTemplateItem = async () => {
    if (!editingId || !selectedCatalogProduct || !selectedCatalogPricing) {
      setItemError("Selecciona primero una plantilla y un producto.");
      return;
    }

    if (selectedCatalogPricing.quantity <= 0) {
      setItemError("La cantidad debe ser mayor a cero.");
      return;
    }

    setSavingItem(true);
    setItemError("");
    setMessage("");
    setError("");

    try {
      await createQuoteTemplateItem({
        template_id: editingId,
        item_type: "product",
        product_id: selectedCatalogProduct.id,
        catalog_item_id: selectedCatalogProduct.id,
        item_name: selectedCatalogProduct.name,
        item_description: selectedCatalogProduct.description ?? null,
        public_description:
          catalogItemForm.public_description.trim() ||
          selectedCatalogProduct.description ||
          null,
        sku: selectedCatalogProduct.sku ?? null,
        quantity: selectedCatalogPricing.quantity,
        unit_cost: selectedCatalogPricing.unitCost,
        unit_price: selectedCatalogPricing.unitPrice,
        discount: selectedCatalogPricing.discount,
        subtotal: selectedCatalogPricing.subtotal,
        total_cost: selectedCatalogPricing.totalCost,
        profit: selectedCatalogPricing.profit,
        margin_percentage: selectedCatalogPricing.marginPercentage,
        unit_type: selectedCatalogPricing.quoteUnit,
        quote_unit: selectedCatalogPricing.quoteUnit,
        purchase_unit: selectedCatalogPricing.purchaseUnit,
        unit_content: selectedCatalogPricing.unitContent,
        proportional_enabled: selectedCatalogPricing.isProportional,
        notes: catalogItemForm.notes.trim() || null,
        internal_notes: catalogItemForm.internal_notes.trim() || null,
        customer_section: catalogItemForm.customer_section.trim() || null,
        cost_category: catalogItemForm.cost_category.trim() || null,
        sort_order: templateItems.length + 1,
      });

      setMessage("Producto agregado a la plantilla inteligente.");
      setCatalogItemForm(initialCatalogItemForm);
      setSelectedCatalogProduct(null);
      setCatalogProducts([]);
      setCatalogSearch("");
      await loadTemplateItems(editingId);
    } catch (error) {
      const currentError = error as Error;
      setItemError(`No fue posible agregar el producto: ${currentError.message}`);
    } finally {
      setSavingItem(false);
    }
  };

  const handleCreateManualTemplateItem = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!editingId) {
      setItemError("Primero guarda o selecciona una plantilla.");
      return;
    }

    if (!manualItemForm.item_name.trim()) {
      setItemError("El nombre del ítem es obligatorio.");
      return;
    }

    const pricing = buildManualPricingSnapshot(manualItemForm);

    if (pricing.quantity <= 0) {
      setItemError("La cantidad debe ser mayor a cero.");
      return;
    }

    setSavingItem(true);
    setItemError("");
    setMessage("");
    setError("");

    try {
      await createQuoteTemplateItem({
        template_id: editingId,
        item_type: manualItemForm.item_type,
        item_name: manualItemForm.item_name.trim(),
        item_description: manualItemForm.item_description.trim() || null,
        public_description:
          manualItemForm.public_description.trim() ||
          manualItemForm.item_description.trim() ||
          null,
        quantity: pricing.quantity,
        unit_cost: pricing.unitCost,
        unit_price: pricing.unitPrice,
        discount: pricing.discount,
        subtotal: pricing.subtotal,
        total_cost: pricing.totalCost,
        profit: pricing.profit,
        margin_percentage: pricing.marginPercentage,
        unit_type: manualItemForm.unit_type.trim() || "unidad",
        quote_unit: manualItemForm.unit_type.trim() || "unidad",
        notes: manualItemForm.notes.trim() || null,
        internal_notes: manualItemForm.internal_notes.trim() || null,
        customer_section: manualItemForm.customer_section.trim() || null,
        cost_category: manualItemForm.cost_category.trim() || null,
        sort_order: templateItems.length + 1,
      });

      setMessage("Ítem operativo agregado a la plantilla inteligente.");
      setManualItemForm(initialManualItemForm);
      await loadTemplateItems(editingId);
    } catch (error) {
      const currentError = error as Error;
      setItemError(`No fue posible agregar el ítem: ${currentError.message}`);
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteTemplateItem = async (item: QuoteTemplateItem) => {
    if (!editingId) return;

    const confirmed = window.confirm(
      `¿Eliminar el ítem "${item.item_name}" de esta plantilla?`,
    );

    if (!confirmed) return;

    setDeletingItemId(item.id);
    setItemError("");

    try {
      await deleteQuoteTemplateItem(editingId, item.id);
      setMessage("Ítem eliminado de la plantilla.");
      await loadTemplateItems(editingId);
    } catch (error) {
      const currentError = error as Error;
      setItemError(`No fue posible eliminar el ítem: ${currentError.message}`);
    } finally {
      setDeletingItemId(null);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] p-6 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
          Centro de plantillas
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          Plantillas inteligentes operativas
        </h2>

        <p className="mt-2 max-w-3xl text-blue-100">
          Crea plantillas reutilizables con textos, productos, mano de obra,
          servicios y logística para generar cotizaciones técnicas con mayor
          velocidad y menor margen de error.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid min-w-0 gap-8 lg:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <form
            onSubmit={handleSubmit}
            className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1E293B]">
                  {editingId ? "Editar plantilla" : "Nueva plantilla"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Configura el encabezado técnico y comercial de la plantilla.
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
                >
                  Cancelar
                </button>
              )}
            </div>

            <div className="grid min-w-0 gap-4">
              <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
                Nombre plantilla
                <input
                  value={form.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  placeholder="Ej: Instalación IP 4 cámaras"
                  className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                />
              </label>

              <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
                Código plantilla
                <input
                  value={form.template_code}
                  onChange={(event) =>
                    handleChange(
                      "template_code",
                      normalizeCode(event.target.value),
                    )
                  }
                  placeholder="TPL-IP-001"
                  className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                />
              </label>

              <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
                Descripción técnica
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    handleChange("description", event.target.value)
                  }
                  placeholder="Describe el uso interno de la plantilla"
                  className="min-h-24 w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                />
              </label>

              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
                  Tipo de servicio
                  <select
                    value={form.service_type}
                    onChange={(event) =>
                      handleChange("service_type", event.target.value)
                    }
                    className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                  >
                    {serviceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
                  Tecnología
                  <select
                    value={form.installation_type}
                    onChange={(event) =>
                      handleChange("installation_type", event.target.value)
                    }
                    className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                  >
                    {installationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
                Duración estimada
                <input
                  value={form.estimated_duration}
                  onChange={(event) =>
                    handleChange("estimated_duration", event.target.value)
                  }
                  placeholder="Ej: 1 jornada"
                  className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                />
              </label>

              <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
                Alcance comercial
                <textarea
                  value={form.default_public_scope}
                  onChange={(event) =>
                    handleChange("default_public_scope", event.target.value)
                  }
                  placeholder="Texto visible para el cliente"
                  className="min-h-24 w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                />
              </label>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="mb-3 text-sm font-bold text-slate-700">
                  Compatibilidades
                </p>

                <div className="grid gap-2 md:grid-cols-2">
                  {[
                    ["compatible_analog", "Análogo"],
                    ["compatible_ip", "IP"],
                    ["compatible_wifi", "WiFi"],
                    ["compatible_solar", "Solar"],
                    ["compatible_ajax", "AJAX"],
                  ].map(([field, label]) => (
                    <label
                      key={field}
                      className="flex items-center gap-2 text-sm font-medium text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(form[field as keyof FormState])}
                        onChange={(event) =>
                          handleChange(
                            field as keyof FormState,
                            event.target.checked,
                          )
                        }
                        className="h-4 w-4 accent-[#2D5398]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
                Notas de mano de obra
                <textarea
                  value={form.default_labor_notes}
                  onChange={(event) =>
                    handleChange("default_labor_notes", event.target.value)
                  }
                  placeholder="Ej: Incluye instalación, configuración y pruebas"
                  className="min-h-24 w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                />
              </label>

              <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
                Notas logísticas
                <textarea
                  value={form.default_logistics_notes}
                  onChange={(event) =>
                    handleChange("default_logistics_notes", event.target.value)
                  }
                  placeholder="Ej: Transporte urbano básico incluido"
                  className="min-h-24 w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                />
              </label>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2D5398]">
                    Términos comerciales por plantilla
                  </p>
                  <h3 className="mt-1 text-lg font-black text-slate-900">
                    Garantía, condiciones, notas y exclusiones
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Estos textos se aplicarán automáticamente cuando uses esta plantilla en una cotización.
                  </p>
                </div>

                <div className="grid gap-4">
                  <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
                    Garantía
                    <textarea
                      value={form.warranty_text}
                      onChange={(event) =>
                        handleChange("warranty_text", event.target.value)
                      }
                      placeholder="Ej: Garantía de 2 meses sobre instalación realizada."
                      className="min-h-24 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                    />
                  </label>

                  <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
                    Condiciones
                    <textarea
                      value={form.conditions_text}
                      onChange={(event) =>
                        handleChange("conditions_text", event.target.value)
                      }
                      placeholder="Ej: Condiciones técnicas y comerciales específicas del servicio."
                      className="min-h-24 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                    />
                  </label>

                  <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
                    Notas importantes
                    <textarea
                      value={form.important_notes_text}
                      onChange={(event) =>
                        handleChange("important_notes_text", event.target.value)
                      }
                      placeholder="Ej: Vigencia, disponibilidad, logística o aclaraciones del servicio."
                      className="min-h-24 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                    />
                  </label>

                  <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
                    Exclusiones
                    <textarea
                      value={form.exclusions_text}
                      onChange={(event) =>
                        handleChange("exclusions_text", event.target.value)
                      }
                      placeholder="Ej: Esta cotización no incluye elementos adicionales no especificados."
                      className="min-h-28 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                    />
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    handleChange("active", event.target.checked)
                  }
                  className="h-4 w-4 accent-[#2D5398]"
                />
                Plantilla activa
              </label>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#2D5398]/20 transition hover:bg-[#234684] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Actualizar plantilla"
                    : "Crear plantilla"}
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2D5398]">
                Constructor operativo
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Ítems de la plantilla
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Guarda productos, servicios, mano de obra y logística como base
                reutilizable.
              </p>
            </div>

            {!editingId ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                Guarda o selecciona una plantilla para habilitar el constructor
                de ítems.
              </div>
            ) : (
              <>
                <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setItemMode("catalog");
                      setItemError("");
                    }}
                    className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                      itemMode === "catalog"
                        ? "bg-white text-[#2D5398] shadow-sm"
                        : "text-slate-500 hover:bg-white/70"
                    }`}
                  >
                    Catálogo
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setItemMode("manual");
                      setItemError("");
                    }}
                    className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                      itemMode === "manual"
                        ? "bg-white text-[#2D5398] shadow-sm"
                        : "text-slate-500 hover:bg-white/70"
                    }`}
                  >
                    Operativo
                  </button>
                </div>

                {itemError && (
                  <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {itemError}
                  </div>
                )}

                {itemMode === "catalog" ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        value={catalogSearch}
                        onChange={(event) => setCatalogSearch(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleSearchCatalogProducts();
                          }
                        }}
                        placeholder="Buscar producto, SKU o categoría"
                        className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                      />
                      <button
                        type="button"
                        onClick={handleSearchCatalogProducts}
                        disabled={catalogLoading}
                        className="rounded-2xl bg-[#2D5398] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#234684] disabled:opacity-60"
                      >
                        {catalogLoading ? "..." : "Buscar"}
                      </button>
                    </div>

                    {catalogProducts.length > 0 && (
                      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                        {catalogProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => {
                              setSelectedCatalogProduct(product);
                              setCatalogItemForm((current) => ({
                                ...current,
                                public_description:
                                  product.description ?? current.public_description,
                              }));
                            }}
                            className={`w-full rounded-2xl border p-3 text-left text-sm transition ${
                              selectedCatalogProduct?.id === product.id
                                ? "border-[#2D5398] bg-[#2D5398]/5"
                                : "border-slate-200 bg-white hover:border-[#2D5398]/40"
                            }`}
                          >
                            <p className="font-bold text-slate-800">
                              {product.name}
                            </p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {product.sku ?? "Sin SKU"} ·{" "}
                              {product.category ?? "Sin categoría"}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                              Precio base:{" "}
                              {moneyFormatter.format(Number(product.price ?? 0))}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedCatalogProduct && selectedCatalogPricing && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="font-bold text-slate-900">
                          {selectedCatalogProduct.name}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Subtotal estimado:{" "}
                          {moneyFormatter.format(selectedCatalogPricing.subtotal)} ·
                          Utilidad:{" "}
                          {moneyFormatter.format(selectedCatalogPricing.profit)}
                        </p>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <input
                            value={catalogItemForm.quantity}
                            onChange={(event) =>
                              handleCatalogItemChange("quantity", event.target.value)
                            }
                            placeholder="Cantidad"
                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                          />
                          <input
                            value={catalogItemForm.discount}
                            onChange={(event) =>
                              handleCatalogItemChange("discount", event.target.value)
                            }
                            placeholder="Descuento"
                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                          />
                        </div>

                        <textarea
                          value={catalogItemForm.public_description}
                          onChange={(event) =>
                            handleCatalogItemChange(
                              "public_description",
                              event.target.value,
                            )
                          }
                          rows={2}
                          placeholder="Descripción pública para el cliente"
                          className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                        />

                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <input
                            value={catalogItemForm.customer_section}
                            onChange={(event) =>
                              handleCatalogItemChange(
                                "customer_section",
                                event.target.value,
                              )
                            }
                            placeholder="Sección cliente"
                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                          />
                          <input
                            value={catalogItemForm.cost_category}
                            onChange={(event) =>
                              handleCatalogItemChange(
                                "cost_category",
                                event.target.value,
                              )
                            }
                            placeholder="Categoría de costo"
                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                          />
                        </div>

                        <textarea
                          value={catalogItemForm.internal_notes}
                          onChange={(event) =>
                            handleCatalogItemChange(
                              "internal_notes",
                              event.target.value,
                            )
                          }
                          rows={2}
                          placeholder="Notas internas"
                          className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                        />

                        <button
                          type="button"
                          onClick={handleCreateCatalogTemplateItem}
                          disabled={savingItem}
                          className="mt-4 w-full rounded-2xl bg-[#2D5398] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#234684] disabled:opacity-60"
                        >
                          {savingItem ? "Agregando..." : "Agregar producto"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <form
                    onSubmit={handleCreateManualTemplateItem}
                    className="grid gap-3"
                  >
                    <select
                      value={manualItemForm.item_type}
                      onChange={(event) =>
                        handleManualItemChange(
                          "item_type",
                          event.target.value as QuoteTemplateItemType,
                        )
                      }
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                    >
                      {templateItemTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>

                    <input
                      value={manualItemForm.item_name}
                      onChange={(event) =>
                        handleManualItemChange("item_name", event.target.value)
                      }
                      placeholder="Nombre del ítem"
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                    />

                    <textarea
                      value={manualItemForm.item_description}
                      onChange={(event) =>
                        handleManualItemChange(
                          "item_description",
                          event.target.value,
                        )
                      }
                      rows={2}
                      placeholder="Descripción técnica"
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                    />

                    <textarea
                      value={manualItemForm.public_description}
                      onChange={(event) =>
                        handleManualItemChange(
                          "public_description",
                          event.target.value,
                        )
                      }
                      rows={2}
                      placeholder="Descripción pública"
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        value={manualItemForm.quantity}
                        onChange={(event) =>
                          handleManualItemChange("quantity", event.target.value)
                        }
                        placeholder="Cantidad"
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                      />
                      <input
                        value={manualItemForm.unit_type}
                        onChange={(event) =>
                          handleManualItemChange("unit_type", event.target.value)
                        }
                        placeholder="Unidad"
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                      />
                      <input
                        value={manualItemForm.unit_cost}
                        onChange={(event) =>
                          handleManualItemChange("unit_cost", event.target.value)
                        }
                        placeholder="Costo unitario"
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                      />
                      <input
                        value={manualItemForm.unit_price}
                        onChange={(event) =>
                          handleManualItemChange("unit_price", event.target.value)
                        }
                        placeholder="Precio unitario"
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                      />
                      <input
                        value={manualItemForm.discount}
                        onChange={(event) =>
                          handleManualItemChange("discount", event.target.value)
                        }
                        placeholder="Descuento"
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                      />
                      <input
                        value={manualItemForm.customer_section}
                        onChange={(event) =>
                          handleManualItemChange(
                            "customer_section",
                            event.target.value,
                          )
                        }
                        placeholder="Sección cliente"
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                      />
                    </div>

                    <input
                      value={manualItemForm.cost_category}
                      onChange={(event) =>
                        handleManualItemChange("cost_category", event.target.value)
                      }
                      placeholder="Categoría de costo"
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                    />

                    <textarea
                      value={manualItemForm.internal_notes}
                      onChange={(event) =>
                        handleManualItemChange("internal_notes", event.target.value)
                      }
                      rows={2}
                      placeholder="Notas internas"
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2D5398]"
                    />

                    <button
                      type="submit"
                      disabled={savingItem}
                      className="rounded-2xl bg-[#2D5398] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#234684] disabled:opacity-60"
                    >
                      {savingItem ? "Agregando..." : "Agregar ítem operativo"}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          {editingId && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2D5398]">
                    Plantilla seleccionada
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {activeTemplate?.name ?? "Plantilla"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Estos ítems se insertarán automáticamente cuando apliques la
                    plantilla en una cotización.
                  </p>
                </div>

                <div className="grid gap-2 text-sm sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Ítems
                    </p>
                    <p className="text-lg font-black text-slate-900">
                      {templateItems.length}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Subtotal
                    </p>
                    <p className="text-lg font-black text-slate-900">
                      {moneyFormatter.format(templateEstimatedSubtotal)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Utilidad
                    </p>
                    <p className="text-lg font-black text-slate-900">
                      {moneyFormatter.format(templateEstimatedProfit)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                {itemsLoading ? (
                  <div className="bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                    Cargando ítems...
                  </div>
                ) : templateItems.length === 0 ? (
                  <div className="bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                    Esta plantilla todavía no tiene ítems operativos.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3">Ítem</th>
                          <th className="px-4 py-3 text-right">Cantidad</th>
                          <th className="px-4 py-3 text-right">Precio</th>
                          <th className="px-4 py-3 text-right">Subtotal</th>
                          <th className="px-4 py-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {templateItems.map((item) => (
                          <tr key={item.id} className="bg-white">
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-[#2D5398]/10 px-3 py-1 text-xs font-bold text-[#2D5398]">
                                {getTemplateItemTypeLabel(item.item_type)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-900">
                                {item.item_name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {item.sku ?? item.customer_section ?? "Sin sección"}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-600">
                              {Number(item.quantity ?? 0)}{" "}
                              {item.unit_type ?? "und"}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-600">
                              {moneyFormatter.format(Number(item.unit_price ?? 0))}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-slate-900">
                              {moneyFormatter.format(Number(item.subtotal ?? 0))}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                disabled={deletingItemId === item.id}
                                onClick={() => handleDeleteTemplateItem(item)}
                                className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                              >
                                {deletingItemId === item.id
                                  ? "..."
                                  : "Eliminar"}
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
          )}

          <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-[#1E293B]">
                Plantillas registradas
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Administra las estructuras reutilizables del negocio.
              </p>
            </div>

            <div className="mb-6 grid min-w-0 gap-3 md:grid-cols-4">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, código, descripción..."
                className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20 md:col-span-2"
              />

              <select
                value={serviceFilter}
                onChange={(event) => setServiceFilter(event.target.value)}
                className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
              >
                <option value="all">Todos los servicios</option>
                {serviceTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
              >
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
                <option value="all">Todas</option>
              </select>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
                Cargando plantillas...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
                No hay plantillas que coincidan con los filtros.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTemplates.map((template) => (
                  <article
                    key={template.id}
                    className={`rounded-3xl border bg-white p-6 shadow-sm transition hover:border-[#2D5398]/30 hover:shadow-md ${
                      editingId === template.id
                        ? "border-[#2D5398]/50"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_120px]">
                      <div className="min-w-0">
                        <h3 className="text-xl font-bold leading-tight text-slate-900">
                          {template.name}
                        </h3>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#2D5398]/10 px-3 py-1 text-xs font-bold text-[#2D5398]">
                            {template.template_code ?? "Sin código"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              template.active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {template.active ? "Activa" : "Inactiva"}
                          </span>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-500">
                          {template.description ||
                            "Plantilla sin descripción técnica registrada."}
                        </p>

                        {template.default_public_scope && (
                          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              Alcance comercial
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {template.default_public_scope}
                            </p>
                          </div>
                        )}

                        {(template.warranty_text ||
                          template.conditions_text ||
                          template.important_notes_text ||
                          template.exclusions_text) && (
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-[#2D5398]">
                              Términos comerciales configurados
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {template.warranty_text && (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                  Garantía
                                </span>
                              )}
                              {template.conditions_text && (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                  Condiciones
                                </span>
                              )}
                              {template.important_notes_text && (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                  Notas
                                </span>
                              )}
                              {template.exclusions_text && (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                  Exclusiones
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            {getServiceTypeLabel(template.service_type)}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            {getInstallationTypeLabel(template.installation_type)}
                          </span>

                          {template.estimated_duration && (
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                              {template.estimated_duration}
                            </span>
                          )}

                          {template.compatible_analog && (
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                              Análogo
                            </span>
                          )}

                          {template.compatible_ip && (
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                              IP
                            </span>
                          )}

                          {template.compatible_wifi && (
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                              WiFi
                            </span>
                          )}

                          {template.compatible_solar && (
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                              Solar
                            </span>
                          )}

                          {template.compatible_ajax && (
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                              AJAX
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row gap-2 lg:flex-col">
                        <button
                          type="button"
                          onClick={() => handleEdit(template)}
                          className="flex-1 rounded-xl border border-[#2D5398]/20 bg-[#2D5398]/10 px-3 py-2 text-xs font-bold text-[#2D5398] transition hover:bg-[#2D5398]/20"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleStatus(template)}
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                        >
                          {template.active ? "Desactivar" : "Activar"}
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === template.id}
                          onClick={() => handleDelete(template)}
                          className="flex-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === template.id
                            ? "Eliminando..."
                            : "Eliminar"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
