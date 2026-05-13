export type QuoteTaxMode = "sin_iva" | "con_iva";

export type QuoteTotalsInputItem = {
  subtotal: number | string | null;
  total_cost: number | string | null;
};

export type CalculateQuoteTotalsInput = {
  items: QuoteTotalsInputItem[];
  taxMode: QuoteTaxMode;
  taxRate: number | string | null;
};

export type QuoteTotals = {
  subtotal: number;
  totalCost: number;
  profit: number;
  taxAmount: number;
  total: number;
  margin: number;
  shouldApplyTax: boolean;
  normalizedTaxRate: number;
};

const toSafeNumber = (value: number | string | null | undefined) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const normalizeTaxRate = (taxRate: number | string | null | undefined) => {
  const rate = toSafeNumber(taxRate);
  if (rate <= 0) return 0;
  return rate > 1 ? rate / 100 : rate;
};

export const calculateQuoteTotals = ({
  items,
  taxMode,
  taxRate,
}: CalculateQuoteTotalsInput): QuoteTotals => {
  const subtotal = items.reduce((sum, item) => sum + toSafeNumber(item.subtotal), 0);
  const totalCost = items.reduce((sum, item) => sum + toSafeNumber(item.total_cost), 0);
  const profit = subtotal - totalCost;
  const shouldApplyTax = taxMode === "con_iva";
  const normalizedTaxRate = normalizeTaxRate(taxRate);
  const taxAmount = shouldApplyTax ? subtotal * normalizedTaxRate : 0;
  const total = subtotal + taxAmount;
  const margin = subtotal > 0 ? (profit / subtotal) * 100 : 0;

  return {
    subtotal,
    totalCost,
    profit,
    taxAmount,
    total,
    margin,
    shouldApplyTax,
    normalizedTaxRate,
  };
};
