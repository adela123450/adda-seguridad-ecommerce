import type { QuoteTotals } from "../helpers/calculateQuoteTotals.ts";

type QuoteTotalsCardsProps = {
  quoteTotals: QuoteTotals;
  moneyFormatter: Intl.NumberFormat;
};

export const QuoteTotalsCards = ({
  quoteTotals,
  moneyFormatter,
}: QuoteTotalsCardsProps) => {
  return (
    <div
      className={`grid gap-4 ${
        quoteTotals.shouldApplyTax ? "md:grid-cols-5" : "md:grid-cols-4"
      }`}
    >
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Subtotal</p>
        <h2 className="mt-3 text-2xl font-bold text-slate-800">
          {moneyFormatter.format(quoteTotals.subtotal)}
        </h2>
      </div>

      {quoteTotals.shouldApplyTax && (
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            IVA {(quoteTotals.normalizedTaxRate * 100).toFixed(0)}%
          </p>
          <h2 className="mt-3 text-2xl font-bold text-amber-500">
            {moneyFormatter.format(quoteTotals.taxAmount)}
          </h2>
        </div>
      )}

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Total</p>
        <h2 className="mt-3 text-2xl font-bold text-[#2D5398]">
          {moneyFormatter.format(quoteTotals.total)}
        </h2>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Costo</p>
        <h2 className="mt-3 text-2xl font-bold text-slate-800">
          {moneyFormatter.format(quoteTotals.totalCost)}
        </h2>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Utilidad</p>
        <h2 className="mt-3 text-2xl font-bold text-emerald-600">
          {moneyFormatter.format(quoteTotals.profit)}
        </h2>
      </div>
    </div>
  );
};
