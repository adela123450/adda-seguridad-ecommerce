import { useEffect, useMemo, useState } from "react";
import {
  calculateQuoteTotals,
  type QuoteTaxMode,
} from "../helpers/calculateQuoteTotals.ts";
import {
  getBusinessSettings,
  updateQuoteFinancialTotals,
  type QuoteDetail,
  type QuoteItem,
} from "../services/quoteService.ts";

export const useQuoteFinancials = ({
  quote,
  items,
  loading,
  itemsLoading,
  onQuoteTotalsSynced,
  onError,
}: {
  quote: QuoteDetail | null;
  items: QuoteItem[];
  loading: boolean;
  itemsLoading: boolean;
  onQuoteTotalsSynced: (totals: {
    subtotal: number;
    tax_amount: number;
    total: number;
  }) => void;
  onError: (message: string) => void;
}) => {
  const [taxMode, setTaxMode] = useState<QuoteTaxMode>("sin_iva");
  const [taxRate, setTaxRate] = useState<number>(19);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const quoteTotals = useMemo(() => {
    return calculateQuoteTotals({
      items,
      taxMode,
      taxRate,
    });
  }, [items, taxMode, taxRate]);

  const loadBusinessSettings = async () => {
    setSettingsLoading(true);

    try {
      const settings = await getBusinessSettings();

      const currentTaxMode: QuoteTaxMode =
        settings?.tax_mode === "con_iva" ? "con_iva" : "sin_iva";

      const currentTaxRate = Number(settings?.tax_rate ?? 19);

      setTaxMode(currentTaxMode);
      setTaxRate(Number.isFinite(currentTaxRate) ? currentTaxRate : 19);
    } catch (error) {
      const currentError = error as Error;

      setTaxMode("sin_iva");
      setTaxRate(19);

      onError(
        `No fue posible cargar la configuración fiscal: ${currentError.message}`
      );
    } finally {
      setSettingsLoading(false);
    }
  };

  const syncQuoteFinancialTotals = async () => {
    if (!quote) return;

    try {
      await updateQuoteFinancialTotals(quote.id, quoteTotals);

      onQuoteTotalsSynced({
        subtotal: quoteTotals.subtotal,
        tax_amount: quoteTotals.taxAmount,
        total: quoteTotals.total,
      });
    } catch (error) {
      const currentError = error as Error;
      onError(`No fue posible actualizar los totales: ${currentError.message}`);
    }
  };

  useEffect(() => {
    loadBusinessSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!quote || loading || itemsLoading || settingsLoading) return;

    syncQuoteFinancialTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote?.id, items, taxMode, taxRate, loading, itemsLoading, settingsLoading]);

  return {
    quoteTotals,
    taxMode,
    taxRate,
    settingsLoading,
    reloadBusinessSettings: loadBusinessSettings,
  };
};
