import { supabase } from "../../../lib/supabase";
import type { QuoteTotals } from "../helpers/calculateQuoteTotals";

export type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "approved"
  | "rejected"
  | "expired";

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
  cost_price: number | string | null;
  price: number | string | null;
  stock: number | string | null;
  active: boolean | null;
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
      "id, quote_number, customer_name, customer_phone, customer_email, customer_city, project_address, technical_scope, status, subtotal, tax_amount, total, issue_date, expiration_date, commercial_terms, warranty_terms, exclusions, parent_quote_id, version_number, version_label, version_notes, issuer_profile_id, issuer_profile_name, issuer_snapshot",
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
      "id, quote_id, item_type, item_name, item_description, sku, quantity, unit_type, unit_cost, unit_price, discount, subtotal, total_cost, profit, margin_percentage, notes, quote_unit, purchase_unit, unit_content, proportional_enabled, created_at",
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

export const searchQuoteCatalogProducts = async (searchTerm: string) => {
  const normalizedSearch = searchTerm.trim();

  if (normalizedSearch.length < 2) return [];

  const { data, error } = await supabase
    .from("products")
    .select(
      `
  id,
  name,
  sku,
  category,
  subcategory,
  description,
  cost_price,
  price,
  stock,
  active,
  sale_unit,
  public_sale_unit,
  quote_unit,
  purchase_unit,
  unit_content,
  quote_by_unit
`,
    )
    .eq("active", true)
    .or(
      `name.ilike.%${normalizedSearch}%,sku.ilike.%${normalizedSearch}%,category.ilike.%${normalizedSearch}%,subcategory.ilike.%${normalizedSearch}%`,
    )
    .order("name", { ascending: true })
    .limit(20);

  if (error) throw error;

  return (data ?? []) as CatalogProduct[];
};

export const createCatalogQuoteItem = async (
  payload: CatalogQuoteItemPayload,
) => {
  const { error } = await supabase.from("quote_items").insert({
    ...payload,
    name_internal: payload.item_name,
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
