import { supabase } from "../../../lib/supabase";
import type { QuoteTotals } from "../helpers/calculateQuoteTotals.ts";

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
  created_at: string;
};

export type BusinessSettings = {
  tax_mode: "sin_iva" | "con_iva" | string | null;
  tax_rate: number | string | null;
};

export type QuoteHeaderUpdatePayload = {
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_city: string | null;
  project_address: string | null;
  technical_scope: string | null;
  expiration_date: string | null;
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
      "id, quote_number, customer_name, customer_phone, customer_email, customer_city, project_address, technical_scope, status, subtotal, tax_amount, total, issue_date, expiration_date, commercial_terms, warranty_terms, exclusions"
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
      "id, quote_id, item_type, item_name, item_description, sku, quantity, unit_cost, unit_price, discount, subtotal, total_cost, profit, margin_percentage, notes, created_at"
    )
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []) as QuoteItem[];
};

export const updateQuoteHeader = async (
  quoteId: string,
  payload: QuoteHeaderUpdatePayload
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
  totals: QuoteTotals
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

export const createManualQuoteItem = async (payload: ManualQuoteItemPayload) => {
  const { error } = await supabase.from("quote_items").insert(payload);

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
