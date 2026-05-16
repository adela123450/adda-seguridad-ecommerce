import type { QuoteItem } from "../services/quoteService.ts";

type QuoteItemsTableProps = {
  items: QuoteItem[];
  itemsLoading: boolean;
  canEdit: boolean;
  moneyFormatter: Intl.NumberFormat;
  onOpenItemModal: () => void;
  onEditItem: (item: QuoteItem) => void;
  onDeleteItem: (item: QuoteItem) => void;
};

const getItemTypeLabel = (itemType: QuoteItem["item_type"]) => {
  const labels: Record<QuoteItem["item_type"], string> = {
    product: "Catálogo maestro",
    technical_catalog: "Catálogo técnico",
    labor: "Mano de obra",
    logistics: "Logística",
    manual: "Manual",
  };

  return labels[itemType] ?? "Manual";
};

const getItemTypeBadgeClass = (itemType: QuoteItem["item_type"]) => {
  if (itemType === "product" || itemType === "technical_catalog") {
    return "bg-[#2D5398]/10 text-[#2D5398]";
  }

  if (itemType === "labor") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (itemType === "logistics") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
};

const getUnitDisplayName = (unit?: string | null) => {
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

const getUnit = (item: QuoteItem) => item.quote_unit ?? item.unit_type ?? "unidad";

export const QuoteItemsTable = ({
  items,
  itemsLoading,
  canEdit,
  moneyFormatter,
  onOpenItemModal,
  onEditItem,
  onDeleteItem,
}: QuoteItemsTableProps) => {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Ítems de la cotización
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Agrega productos del catálogo maestro, servicios, mano de obra, logística o costos manuales.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenItemModal}
          disabled={!canEdit}
          className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Agregar ítem
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
            Agrega el primer ítem manual o selecciona productos desde el catálogo maestro.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {items.map((item) => {
            const unit = getUnit(item);
            const isProportional = Boolean(item.proportional_enabled);
            const profit = Number(item.profit ?? 0);
            const margin = Number(item.margin_percentage ?? 0);

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
              >
                <div className="grid gap-4 xl:grid-cols-[1.25fr_2fr_auto] xl:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getItemTypeBadgeClass(
                          item.item_type,
                        )}`}
                      >
                        {getItemTypeLabel(item.item_type)}
                      </span>

                      {isProportional && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                          Proporcional
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 text-base font-bold text-slate-900">
                      {item.item_name}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                      {item.item_description ?? "Sin descripción"}
                    </p>

                    {item.sku && (
                      <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                        SKU: {item.sku}
                      </p>
                    )}

                    {item.notes && (
                      <div className="mt-2 rounded-xl bg-white px-3 py-2 text-[11px] leading-4 text-slate-500">
                        <span className="font-bold text-slate-600">Notas: </span>
                        {item.notes}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Cantidad
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {Number(item.quantity ?? 0)} {getUnitDisplayName(unit)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Costo unitario
                      </p>
                      <p className="mt-1 text-base font-bold text-slate-900">
                        {moneyFormatter.format(Number(item.unit_cost ?? 0))}
                      </p>
                      <p className="text-xs text-slate-400">/ {unit}</p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Precio unitario
                      </p>
                      <p className="mt-1 text-base font-bold text-[#2D5398]">
                        {moneyFormatter.format(Number(item.unit_price ?? 0))}
                      </p>
                      <p className="text-xs text-slate-400">/ {unit}</p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Subtotal
                      </p>
                      <p className="mt-1 text-base font-bold text-slate-900">
                        {moneyFormatter.format(Number(item.subtotal ?? 0))}
                      </p>
                      {Number(item.discount ?? 0) > 0 && (
                        <p className="mt-1 text-xs font-semibold text-amber-700">
                          Desc: {moneyFormatter.format(Number(item.discount ?? 0))}
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Utilidad
                      </p>
                      <p
                        className={`mt-1 text-base font-bold ${
                          profit < 0 ? "text-red-700" : "text-emerald-700"
                        }`}
                      >
                        {moneyFormatter.format(profit)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Margen
                      </p>
                      <p
                        className={`mt-1 text-base font-bold ${
                          margin < 15
                            ? "text-red-700"
                            : margin < 30
                              ? "text-amber-700"
                              : "text-emerald-700"
                        }`}
                      >
                        {margin.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row gap-2 xl:flex-col">
                    <button
                      type="button"
                      onClick={() => onEditItem(item)}
                      disabled={!canEdit}
                      className="flex-1 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 xl:flex-none"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteItem(item)}
                      disabled={!canEdit}
                      className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-[11px] font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 xl:flex-none"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {isProportional && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                    {item.purchase_unit && (
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        Compra: {item.purchase_unit}
                      </span>
                    )}

                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2D5398]">
                      Cotiza: {unit}
                    </span>

                    {item.unit_content && (
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        Contenido: {item.unit_content}
                      </span>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
