import { supabaseAdmin as supabase } from "../../../lib/supabase";
import type { QuoteTotals } from "../helpers/calculateQuoteTotals";

export type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "approved"
  | "rejected"
  | "expired";

export type ProductClassification =
  | "equipment"
  | "supplied_material"
  | "installation_consumable"
  | "internal_cost";

const INSTALLATION_SERVICES_GROUP = "installation_services_consumables";

const productClassifications: ProductClassification[] = [
  "equipment",
  "supplied_material",
  "installation_consumable",
  "internal_cost",
];

const normalizeProductClassification = (
  value?: string | null,
): ProductClassification => {
  return productClassifications.includes(value as ProductClassification)
    ? (value as ProductClassification)
    : "equipment";
};

const getProductClassificationFromPublicGroup = (
  publicGroup?: string | null,
): ProductClassification => {
  return publicGroup === INSTALLATION_SERVICES_GROUP
    ? "installation_consumable"
    : "equipment";
};

export type QuoteDetail = {
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
  parent_quote_id?: string | null;
  version_number?: number | null;
  version_label?: string | null;
  version_notes?: string | null;
  issuer_profile_id?: string | null;
  issuer_profile_name?: string | null;
  issuer_snapshot?: Record<string, unknown> | null;
  warranty_text?: string | null;
  conditions_text?: string | null;
  important_notes_text?: string | null;
  exclusions_text?: string | null;
  summary_group_title?: string | null;
  summary_group_description?: string | null;
};

export type QuoteItem = {
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
  visible_to_customer?: boolean | null;
  public_group?: string | null;
  product_classification?: ProductClassification | string | null;
  name_internal?: string | null;
  name_public?: string | null;
  description?: string | null;
  unit_type?: string | null;
  quote_unit?: string | null;
  purchase_unit?: string | null;
  unit_content?: number | string | null;
  proportional_enabled?: boolean | null;
  created_at: string;
};

export type BusinessSettings = {
  tax_mode: "sin_iva" | "con_iva" | string | null;
  tax_rate: number | string | null;
};

export type CatalogProduct = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  image_url?: string | null;
  cost_price: number | string | null;
  price: number | string | null;
  stock: number | string | null;
  active: boolean | null;
  sale_unit?: string | null;
  public_sale_unit?: string | null;
  quote_unit?: string | null;
  purchase_unit?: string | null;
  unit_content?: number | string | null;
  quote_by_unit?: boolean | null;
  visible_to_customer?: boolean | null;
  public_name?: string | null;
  public_group?: string | null;
  product_classification?: ProductClassification | string | null;
  item_type?: string | null;
};

export type QuoteTemplateItemType =
  | "product"
  | "technical_catalog"
  | "labor"
  | "logistics"
  | "manual";

export type QuoteTemplateItem = {
  id: string;
  template_id: string;
  item_type: QuoteTemplateItemType;
  product_id: string | null;
  catalog_item_id: string | null;

  /**
   * Campos normalizados para que la UI y el motor de cotizaciones trabajen
   * con el mismo contrato, aunque la tabla enterprise use nombres de dominio:
   * name_internal, name_public y default_quantity.
   */
  item_name: string;
  item_description: string | null;
  public_description: string | null;
  sku: string | null;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  total_cost: number;
  profit: number;
  margin_percentage: number;

  unit_type: string | null;
  quote_unit?: string | null;
  purchase_unit?: string | null;
  unit_content?: number | string | null;
  proportional_enabled?: boolean | null;

  notes: string | null;
  internal_notes: string | null;
  customer_section: string | null;
  cost_category: string | null;
  sort_order: number | null;
  created_at: string;

  /** Campos reales de la tabla quote_template_items. */
  name_internal: string;
  name_public: string | null;
  description: string | null;
  default_quantity: number;
  visible_to_customer: boolean | null;
  public_group: string | null;
  required: boolean | null;
  editable: boolean | null;
};

type QuoteTemplateItemRow = {
  id: string;
  template_id: string;
  catalog_item_id: string | null;
  product_id: string | null;
  item_type: QuoteTemplateItemType;
  name_internal: string;
  name_public: string | null;
  description: string | null;
  default_quantity: number | string | null;
  unit_type: string | null;
  unit_cost: number | string | null;
  unit_price: number | string | null;
  visible_to_customer: boolean | null;
  public_group: string | null;
  required: boolean | null;
  editable: boolean | null;
  sort_order: number | null;
  created_at: string;
  updated_at?: string | null;
  public_description: string | null;
  internal_notes: string | null;
  customer_section: string | null;
  cost_category: string | null;
};

export type TemplateItemPayload = {
  template_id: string;
  item_type: QuoteTemplateItemType;
  product_id?: string | null;
  catalog_item_id?: string | null;
  item_name: string;
  item_description?: string | null;
  public_description?: string | null;
  sku?: string | null;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  discount?: number;
  subtotal?: number;
  total_cost?: number;
  profit?: number;
  margin_percentage?: number;
  unit_type?: string | null;
  quote_unit?: string | null;
  purchase_unit?: string | null;
  unit_content?: number | string | null;
  proportional_enabled?: boolean | null;
  notes?: string | null;
  internal_notes?: string | null;
  customer_section?: string | null;
  cost_category?: string | null;
  sort_order?: number | null;
};

export type ApplyTemplateResult = {
  insertedCount: number;
  skippedCount: number;
  appliedTemplateName: string;
};

export type QuoteHeaderUpdatePayload = {
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_city: string | null;
  project_address: string | null;
  technical_scope: string | null;
  expiration_date: string | null;
  issuer_profile_id?: string | null;
  issuer_profile_name?: string | null;
  issuer_snapshot?: Record<string, unknown> | null;
  warranty_text?: string | null;
  conditions_text?: string | null;
  important_notes_text?: string | null;
  exclusions_text?: string | null;
  summary_group_title?: string | null;
  summary_group_description?: string | null;
};

export type ManualQuoteItemPayload = {
  quote_id: string;
  item_type: "manual";
  item_name: string;
  item_description: string | null;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  total_cost: number;
  profit: number;
  margin_percentage: number;
  notes: string | null;
  unit_type?: string | null;
  visible_to_customer?: boolean | null;
  public_group?: string | null;
  product_classification?: ProductClassification | string | null;
  name_public?: string | null;
};

export type CatalogQuoteItemPayload = {
  quote_id: string;
  item_type: "product";
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
  unit_type?: string | null;
  quote_unit?: string | null;
  purchase_unit?: string | null;
  unit_content?: number | null;
  proportional_enabled?: boolean;
  visible_to_customer?: boolean | null;
  public_group?: string | null;
  product_classification?: ProductClassification | string | null;
  name_public?: string | null;
  product_id?: string | null;
};

export type QuoteItemSnapshotUpdatePayload = {
  quantity: number;
  discount: number;
  subtotal: number;
  total_cost: number;
  profit: number;
  margin_percentage: number;
  notes: string | null;
};

export const getBusinessSettings = async () => {
  const { data, error } = await supabase
    .from("business_settings")
    .select("tax_mode, tax_rate")
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data as BusinessSettings | null;
};

export const getQuoteById = async (quoteId: string) => {
  const { data, error } = await supabase
    .from("quotes")
    .select(
      "id, quote_number, customer_name, customer_phone, customer_email, customer_city, project_address, technical_scope, status, subtotal, tax_amount, total, issue_date, expiration_date, commercial_terms, warranty_terms, exclusions, parent_quote_id, version_number, version_label, version_notes, issuer_profile_id, issuer_profile_name, issuer_snapshot, warranty_text, conditions_text, important_notes_text, exclusions_text, summary_group_title, summary_group_description",
    )
    .eq("id", quoteId)
    .single();

  if (error) throw error;

  return data as QuoteDetail;
};

export const getQuoteItems = async (quoteId: string) => {
  const { data, error } = await supabase
    .from("quote_items")
    .select(
      "id, quote_id, item_type, item_name, item_description, sku, quantity, unit_type, unit_cost, unit_price, discount, subtotal, total_cost, profit, margin_percentage, notes, visible_to_customer, public_group, product_classification, name_internal, name_public, description, quote_unit, purchase_unit, unit_content, proportional_enabled, created_at",
    )
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []) as QuoteItem[];
};

export const updateQuoteHeader = async (
  quoteId: string,
  payload: QuoteHeaderUpdatePayload,
) => {
  const { error } = await supabase
    .from("quotes")
    .update(payload)
    .eq("id", quoteId)
    .eq("status", "draft");

  if (error) throw error;
};

export const updateQuoteFinancialTotals = async (
  quoteId: string,
  totals: QuoteTotals,
) => {
  const { error } = await supabase
    .from("quotes")
    .update({
      subtotal: totals.subtotal,
      tax_amount: totals.taxAmount,
      total: totals.total,
      internal_cost_total: totals.totalCost,
      gross_profit: totals.profit,
      margin_percentage: totals.margin,
    })
    .eq("id", quoteId);

  if (error) throw error;
};

export const searchQuoteCatalogProducts = async (
  searchTerm: string,
  productClassification: ProductClassification | "all" = "all",
) => {
  const normalizedSearch = searchTerm.trim();

  let query = supabase
    .from("products")
    .select(
      `
  id,
  name,
  sku,
  category,
  subcategory,
  description,
  image_url,
  cost_price,
  price,
  stock,
  active,
  sale_unit,
  public_sale_unit,
  quote_unit,
  purchase_unit,
  unit_content,
  quote_by_unit,
  visible_to_customer,
  public_name,
  public_group,
  product_classification,
  item_type
`,
    )
    .eq("active", true);

  if (productClassification !== "all") {
    query = query.eq("product_classification", productClassification);
  }

  if (normalizedSearch.length >= 2) {
    query = query.or(
      `name.ilike.%${normalizedSearch}%,sku.ilike.%${normalizedSearch}%,category.ilike.%${normalizedSearch}%,subcategory.ilike.%${normalizedSearch}%`,
    );
  }

  const { data, error } = await query.order("name", { ascending: true }).limit(40);

  if (error) throw error;

  return (data ?? []) as CatalogProduct[];
};

export const createCatalogQuoteItem = async (
  payload: CatalogQuoteItemPayload,
) => {
  const { error } = await supabase.from("quote_items").insert({
    ...payload,
    product_id: payload.product_id ?? null,
    name_internal: payload.item_name,
    name_public: payload.name_public ?? payload.item_name,
    description: payload.item_description ?? null,
    visible_to_customer: payload.visible_to_customer ?? true,
    public_group: payload.public_group ?? null,
    product_classification: normalizeProductClassification(
      payload.product_classification,
    ),
    unit_type: payload.unit_type ?? payload.quote_unit ?? "unidad",
    quote_unit: payload.quote_unit ?? "unidad",
    purchase_unit: payload.purchase_unit ?? null,
    unit_content: payload.unit_content ?? null,
    proportional_enabled: payload.proportional_enabled ?? false,
  });

  if (error) throw error;
};

export const createManualQuoteItem = async (
  payload: ManualQuoteItemPayload,
) => {
  const { error } = await supabase.from("quote_items").insert({
    ...payload,
    name_internal: payload.item_name,
    name_public: payload.name_public ?? payload.item_name,
    description: payload.item_description ?? null,
    visible_to_customer: payload.visible_to_customer ?? true,
    public_group: payload.public_group ?? null,
    product_classification: normalizeProductClassification(
      payload.product_classification,
    ),
    unit_type: payload.unit_type ?? "unidad",
    quote_unit: payload.unit_type ?? "unidad",
    proportional_enabled: false,
  });

  if (error) throw error;
};

export const updateQuoteItemSnapshot = async (
  quoteId: string,
  itemId: string,
  payload: QuoteItemSnapshotUpdatePayload,
) => {
  const { error } = await supabase
    .from("quote_items")
    .update(payload)
    .eq("id", itemId)
    .eq("quote_id", quoteId);

  if (error) throw error;
};

export const deleteQuoteItem = async (quoteId: string, itemId: string) => {
  const { error } = await supabase
    .from("quote_items")
    .delete()
    .eq("id", itemId)
    .eq("quote_id", quoteId);

  if (error) throw error;
};


const normalizeTemplateItemRow = (row: QuoteTemplateItemRow): QuoteTemplateItem => {
  const quantity = Number(row.default_quantity ?? 1);
  const unitCost = Number(row.unit_cost ?? 0);
  const unitPrice = Number(row.unit_price ?? 0);
  const discount = 0;
  const subtotal = Math.max(Math.round(quantity * unitPrice) - discount, 0);
  const totalCost = Math.round(quantity * unitCost);
  const profit = subtotal - totalCost;
  const marginPercentage = subtotal > 0 ? (profit / subtotal) * 100 : 0;
  const publicName = row.name_public?.trim();
  const internalName = row.name_internal?.trim() || "Ítem sin nombre";

  return {
    id: row.id,
    template_id: row.template_id,
    item_type: row.item_type,
    product_id: row.product_id,
    catalog_item_id: row.catalog_item_id,
    item_name: publicName || internalName,
    item_description: row.description,
    public_description: row.public_description,
    sku: null,
    quantity,
    unit_cost: unitCost,
    unit_price: unitPrice,
    discount,
    subtotal,
    total_cost: totalCost,
    profit,
    margin_percentage: marginPercentage,
    unit_type: row.unit_type,
    quote_unit: row.unit_type,
    purchase_unit: null,
    unit_content: null,
    proportional_enabled: false,
    notes: row.internal_notes,
    internal_notes: row.internal_notes,
    customer_section: row.customer_section,
    cost_category: row.cost_category,
    sort_order: row.sort_order,
    created_at: row.created_at,
    name_internal: internalName,
    name_public: row.name_public,
    description: row.description,
    default_quantity: quantity,
    visible_to_customer: row.visible_to_customer,
    public_group: row.public_group,
    required: row.required,
    editable: row.editable,
  };
};

export const getQuoteTemplateItems = async (templateId: string) => {
  const { data, error } = await supabase
    .from("quote_template_items")
    .select(
      "id, template_id, catalog_item_id, product_id, item_type, name_internal, name_public, description, default_quantity, unit_type, unit_cost, unit_price, visible_to_customer, public_group, required, editable, sort_order, created_at, updated_at, public_description, internal_notes, customer_section, cost_category",
    )
    .eq("template_id", templateId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as QuoteTemplateItemRow[]).map(normalizeTemplateItemRow);
};

export const createQuoteTemplateItem = async (payload: TemplateItemPayload) => {
  const quantity = Number(payload.quantity ?? 1);
  const unitCost = Number(payload.unit_cost ?? 0);
  const unitPrice = Number(payload.unit_price ?? 0);

  if (!payload.template_id) {
    throw new Error("No se encontró la plantilla asociada al ítem.");
  }

  if (!payload.item_name.trim()) {
    throw new Error("El nombre interno del ítem es obligatorio.");
  }

  if (quantity <= 0) {
    throw new Error("La cantidad del ítem debe ser mayor a cero.");
  }

  /**
   * Decisión enterprise:
   * - product_id apunta a products.id.
   * - catalog_item_id apunta a catalog_items.id.
   * No copiamos automáticamente product_id en catalog_item_id porque son FKs
   * diferentes y eso puede romper integridad referencial.
   */
  const safeCatalogItemId =
    payload.catalog_item_id && payload.catalog_item_id !== payload.product_id
      ? payload.catalog_item_id
      : null;

  const { error } = await supabase.from("quote_template_items").insert({
    template_id: payload.template_id,
    item_type: payload.item_type,
    product_id: payload.product_id ?? null,
    catalog_item_id: safeCatalogItemId,
    name_internal: payload.item_name.trim(),
    name_public: payload.item_name.trim(),
    description: payload.item_description ?? null,
    default_quantity: quantity,
    unit_type: payload.unit_type ?? payload.quote_unit ?? "unidad",
    unit_cost: unitCost,
    unit_price: unitPrice,
    visible_to_customer: true,
    public_group: payload.customer_section ?? null,
    required: true,
    editable: true,
    sort_order: payload.sort_order ?? null,
    public_description: payload.public_description ?? null,
    internal_notes: payload.internal_notes ?? payload.notes ?? null,
    customer_section: payload.customer_section ?? null,
    cost_category: payload.cost_category ?? null,
  });

  if (error) throw error;
};

export const deleteQuoteTemplateItem = async (
  templateId: string,
  itemId: string,
) => {
  const { error } = await supabase
    .from("quote_template_items")
    .delete()
    .eq("template_id", templateId)
    .eq("id", itemId);

  if (error) throw error;
};

export const applyTemplateToQuote = async (
  quoteId: string,
  templateId: string,
  options?: { replaceTexts?: boolean },
): Promise<ApplyTemplateResult> => {
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, status, technical_scope, warranty_text, conditions_text, important_notes_text, exclusions_text, summary_group_title, summary_group_description")
    .eq("id", quoteId)
    .single();

  if (quoteError) throw quoteError;

  if (quote.status !== "draft") {
    throw new Error("Solo se pueden aplicar plantillas a cotizaciones en borrador.");
  }

  const { data: template, error: templateError } = await supabase
    .from("quote_templates")
    .select(
      "id, name, default_public_scope, default_labor_notes, default_logistics_notes, warranty_text, conditions_text, important_notes_text, exclusions_text",
    )
    .eq("id", templateId)
    .single();

  if (templateError) throw templateError;

  const templateItems = await getQuoteTemplateItems(templateId);

  const { data: existingItems, error: existingItemsError } = await supabase
    .from("quote_items")
    .select("item_type, item_name, sku")
    .eq("quote_id", quoteId);

  if (existingItemsError) throw existingItemsError;

  const buildKey = (item: { item_type?: string | null; item_name?: string | null; sku?: string | null }) =>
    [
      item.item_type ?? "",
      item.sku ?? "",
      String(item.item_name ?? "").trim().toLowerCase(),
    ].join("|");

  const existingKeys = new Set((existingItems ?? []).map(buildKey));

  const itemsToInsert = templateItems
    .filter((item) => !existingKeys.has(buildKey(item)))
    .map((item) => ({
      quote_id: quoteId,
      item_type: item.item_type,
      item_name: item.item_name,
      item_description: item.public_description ?? item.item_description,
      sku: item.sku,
      quantity: Number(item.quantity ?? 1),
      unit_cost: Number(item.unit_cost ?? 0),
      unit_price: Number(item.unit_price ?? 0),
      discount: 0,
      subtotal: Number(item.subtotal ?? 0),
      total_cost: Number(item.total_cost ?? 0),
      profit: Number(item.profit ?? 0),
      margin_percentage: Number(item.margin_percentage ?? 0),
      notes: item.internal_notes ?? item.notes ?? null,
      unit_type: item.unit_type ?? "unidad",
      quote_unit: item.unit_type ?? "unidad",
      purchase_unit: null,
      unit_content: null,
      proportional_enabled: false,
      name_internal: item.name_internal,
      name_public: item.name_public ?? item.item_name,
      description: item.description ?? item.item_description ?? null,
      visible_to_customer: item.visible_to_customer ?? true,
      public_group: item.public_group ?? null,
      product_classification: getProductClassificationFromPublicGroup(
        item.public_group,
      ),
    }));

  if (itemsToInsert.length > 0) {
    const { error: insertItemsError } = await supabase
      .from("quote_items")
      .insert(itemsToInsert);

    if (insertItemsError) throw insertItemsError;
  }

  const shouldReplaceTexts = options?.replaceTexts ?? true;
  const headerPayload: Partial<QuoteHeaderUpdatePayload> = {};

  const cleanText = (value: string | null | undefined) => {
    const normalizedValue = value?.trim();
    return normalizedValue && normalizedValue.length > 0 ? normalizedValue : null;
  };

  const templateTechnicalScope = cleanText(template.default_public_scope);
  const templateWarrantyText = cleanText(template.warranty_text);
  const templateConditionsText =
    cleanText(template.conditions_text) ?? cleanText(template.default_labor_notes);
  const templateImportantNotesText =
    cleanText(template.important_notes_text) ??
    cleanText(template.default_logistics_notes);
  const templateExclusionsText = cleanText(template.exclusions_text);

  if (shouldReplaceTexts) {
    /**
     * Regla enterprise:
     * Al aplicar una plantilla y aceptar reemplazo, los términos comerciales
     * deben quedar gobernados por la plantilla elegida, no por los textos
     * genéricos del editor.
     */
    headerPayload.technical_scope = templateTechnicalScope ?? null;
    headerPayload.warranty_text = templateWarrantyText ?? null;
    headerPayload.conditions_text = templateConditionsText ?? null;
    headerPayload.important_notes_text = templateImportantNotesText ?? null;
    headerPayload.exclusions_text = templateExclusionsText ?? null;
  } else {
    headerPayload.technical_scope =
      cleanText(quote.technical_scope) ?? templateTechnicalScope ?? null;
    headerPayload.warranty_text =
      cleanText(quote.warranty_text) ?? templateWarrantyText ?? null;
    headerPayload.conditions_text =
      cleanText(quote.conditions_text) ?? templateConditionsText ?? null;
    headerPayload.important_notes_text =
      cleanText(quote.important_notes_text) ?? templateImportantNotesText ?? null;
    headerPayload.exclusions_text =
      cleanText(quote.exclusions_text) ?? templateExclusionsText ?? null;
  }

  const { error: updateHeaderError } = await supabase
    .from("quotes")
    .update(headerPayload)
    .eq("id", quoteId)
    .eq("status", "draft");

  if (updateHeaderError) throw updateHeaderError;

  return {
    insertedCount: itemsToInsert.length,
    skippedCount: templateItems.length - itemsToInsert.length,
    appliedTemplateName: template.name,
  };
};

const duplicateQuote = async (quoteId: string) => {
  const { data: originalQuote, error: quoteError } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (quoteError) throw quoteError;

  const { data: originalItems, error: itemsError } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: true });

  if (itemsError) throw itemsError;

  const today = new Date();
  const expirationDate = new Date();
  expirationDate.setDate(today.getDate() + 7);

  const { data: newQuote, error: createQuoteError } = await supabase
    .from("quotes")
    .insert({
      customer_name: originalQuote.customer_name,
      customer_phone: originalQuote.customer_phone,
      customer_email: originalQuote.customer_email,
      customer_city: originalQuote.customer_city,
      project_address: originalQuote.project_address,
      technical_scope: originalQuote.technical_scope,
      commercial_terms: originalQuote.commercial_terms,
      warranty_terms: originalQuote.warranty_terms,
      exclusions: originalQuote.exclusions,
      subtotal: originalQuote.subtotal ?? 0,
      tax_amount: originalQuote.tax_amount ?? 0,
      total: originalQuote.total ?? 0,
      internal_cost_total: originalQuote.internal_cost_total ?? 0,
      gross_profit: originalQuote.gross_profit ?? 0,
      margin_percentage: originalQuote.margin_percentage ?? 0,
      validity_days: 7,
      status: "draft",
      parent_quote_id: null,
      version_number: 1,
      version_label: null,
      version_notes: null,
      issue_date: today.toISOString().split("T")[0],
      expiration_date: expirationDate.toISOString().split("T")[0],
      issuer_profile_id: originalQuote.issuer_profile_id ?? null,
      issuer_profile_name: originalQuote.issuer_profile_name ?? null,
      issuer_snapshot: originalQuote.issuer_snapshot ?? null,
      warranty_text: originalQuote.warranty_text ?? null,
      conditions_text: originalQuote.conditions_text ?? null,
      important_notes_text: originalQuote.important_notes_text ?? null,
      exclusions_text: originalQuote.exclusions_text ?? null,
      summary_group_title: originalQuote.summary_group_title ?? null,
      summary_group_description: originalQuote.summary_group_description ?? null,
    })
    .select("id, quote_number")
    .single();

  if (createQuoteError) throw createQuoteError;

  if (originalItems && originalItems.length > 0) {
    const clonedItems = originalItems.map((item) => ({
      quote_id: newQuote.id,
      item_type: item.item_type,
      item_name: item.item_name,
      item_description: item.item_description,
      sku: item.sku,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      unit_price: item.unit_price,
      discount: item.discount,
      subtotal: item.subtotal,
      total_cost: item.total_cost,
      profit: item.profit,
      margin_percentage: item.margin_percentage,
      notes: item.notes,
      unit_type: item.unit_type,
      quote_unit: item.quote_unit,
      purchase_unit: item.purchase_unit,
      unit_content: item.unit_content,
      proportional_enabled: item.proportional_enabled,
      name_internal: item.name_internal ?? item.item_name,
      name_public: item.name_public ?? item.item_name,
      description: item.description ?? item.item_description ?? null,
      visible_to_customer: item.visible_to_customer ?? true,
      public_group: item.public_group ?? null,
      product_classification: normalizeProductClassification(
        item.product_classification ??
          getProductClassificationFromPublicGroup(item.public_group),
      ),
    }));

    const { error: cloneItemsError } = await supabase
      .from("quote_items")
      .insert(clonedItems);

    if (cloneItemsError) throw cloneItemsError;
  }

  return newQuote as { id: string; quote_number: string };
};

const getNextQuoteVersionNumber = async (quoteId: string) => {
  const { data: originalQuote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, parent_quote_id, version_number")
    .eq("id", quoteId)
    .single();

  if (quoteError) throw quoteError;

  const rootQuoteId = originalQuote.parent_quote_id ?? originalQuote.id;

  const { data: versions, error: versionsError } = await supabase
    .from("quotes")
    .select("version_number")
    .or(`id.eq.${rootQuoteId},parent_quote_id.eq.${rootQuoteId}`);

  if (versionsError) throw versionsError;

  const maxVersion = (versions ?? []).reduce((max, version) => {
    const currentVersion = Number(version.version_number ?? 1);
    return currentVersion > max ? currentVersion : max;
  }, 1);

  return {
    rootQuoteId,
    nextVersionNumber: maxVersion + 1,
  };
};

const createQuoteVersion = async (quoteId: string) => {
  const { rootQuoteId, nextVersionNumber } =
    await getNextQuoteVersionNumber(quoteId);

  const { data: originalQuote, error: quoteError } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (quoteError) throw quoteError;

  const { data: originalItems, error: itemsError } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: true });

  if (itemsError) throw itemsError;

  const today = new Date();
  const expirationDate = new Date();
  expirationDate.setDate(today.getDate() + 7);

  const { data: newQuote, error: createQuoteError } = await supabase
    .from("quotes")
    .insert({
      customer_name: originalQuote.customer_name,
      customer_phone: originalQuote.customer_phone,
      customer_email: originalQuote.customer_email,
      customer_city: originalQuote.customer_city,
      project_address: originalQuote.project_address,
      technical_scope: originalQuote.technical_scope,
      commercial_terms: originalQuote.commercial_terms,
      warranty_terms: originalQuote.warranty_terms,
      exclusions: originalQuote.exclusions,
      subtotal: originalQuote.subtotal ?? 0,
      tax_amount: originalQuote.tax_amount ?? 0,
      total: originalQuote.total ?? 0,
      internal_cost_total: originalQuote.internal_cost_total ?? 0,
      gross_profit: originalQuote.gross_profit ?? 0,
      margin_percentage: originalQuote.margin_percentage ?? 0,
      validity_days: 7,
      status: "draft",
      parent_quote_id: rootQuoteId,
      version_number: nextVersionNumber,
      version_label: `V${nextVersionNumber}`,
      version_notes: `Versión creada a partir de ${originalQuote.quote_number}.`,
      issue_date: today.toISOString().split("T")[0],
      expiration_date: expirationDate.toISOString().split("T")[0],
      issuer_profile_id: originalQuote.issuer_profile_id ?? null,
      issuer_profile_name: originalQuote.issuer_profile_name ?? null,
      issuer_snapshot: originalQuote.issuer_snapshot ?? null,
      warranty_text: originalQuote.warranty_text ?? null,
      conditions_text: originalQuote.conditions_text ?? null,
      important_notes_text: originalQuote.important_notes_text ?? null,
      exclusions_text: originalQuote.exclusions_text ?? null,
      summary_group_title: originalQuote.summary_group_title ?? null,
      summary_group_description: originalQuote.summary_group_description ?? null,
    })
    .select("id, quote_number, version_number, version_label")
    .single();

  if (createQuoteError) throw createQuoteError;

  if (originalItems && originalItems.length > 0) {
    const clonedItems = originalItems.map((item) => ({
      quote_id: newQuote.id,
      item_type: item.item_type,
      item_name: item.item_name,
      item_description: item.item_description,
      sku: item.sku,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      unit_price: item.unit_price,
      discount: item.discount,
      subtotal: item.subtotal,
      total_cost: item.total_cost,
      profit: item.profit,
      margin_percentage: item.margin_percentage,
      notes: item.notes,
      unit_type: item.unit_type,
      quote_unit: item.quote_unit,
      purchase_unit: item.purchase_unit,
      unit_content: item.unit_content,
      proportional_enabled: item.proportional_enabled,
      name_internal: item.name_internal ?? item.item_name,
      name_public: item.name_public ?? item.item_name,
      description: item.description ?? item.item_description ?? null,
      visible_to_customer: item.visible_to_customer ?? true,
      public_group: item.public_group ?? null,
      product_classification: normalizeProductClassification(
        item.product_classification ??
          getProductClassificationFromPublicGroup(item.public_group),
      ),
    }));

    const { error: cloneItemsError } = await supabase
      .from("quote_items")
      .insert(clonedItems);

    if (cloneItemsError) throw cloneItemsError;
  }

  return newQuote as {
    id: string;
    quote_number: string;
    version_number: number;
    version_label: string | null;
  };
};

export { duplicateQuote, createQuoteVersion };
