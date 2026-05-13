import type { QuoteItem } from "../services/quoteService.ts";

type QuoteItemsTableProps = {
  items: QuoteItem[];
  itemsLoading: boolean;
  canEdit: boolean;
  moneyFormatter: Intl.NumberFormat;
  onOpenItemModal: () => void;
  onDeleteItem: (item: QuoteItem) => void;
};

export const QuoteItemsTable = ({
  items,
  itemsLoading,
  canEdit,
  moneyFormatter,
  onOpenItemModal,
  onDeleteItem,
}: QuoteItemsTableProps) => {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Ítems de la cotización
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Agrega productos, servicios, mano de obra, logística o costos manuales.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenItemModal}
          disabled={!canEdit}
          className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Agregar ítem manual
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
            Agrega el primer ítem manual para iniciar la construcción comercial.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Ítem</th>
                <th className="px-4 py-3">Cant.</th>
                <th className="px-4 py-3">Costo unit.</th>
                <th className="px-4 py-3">Precio unit.</th>
                <th className="px-4 py-3">Subtotal</th>
                <th className="px-4 py-3">Utilidad</th>
                <th className="px-4 py-3">Margen</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-800">{item.item_name}</p>
                    <p className="text-xs text-slate-500">
                      {item.item_description ?? "Sin descripción"}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-slate-600">{item.quantity}</td>

                  <td className="px-4 py-4 text-slate-600">
                    {moneyFormatter.format(Number(item.unit_cost ?? 0))}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {moneyFormatter.format(Number(item.unit_price ?? 0))}
                  </td>

                  <td className="px-4 py-4 font-bold text-slate-800">
                    {moneyFormatter.format(Number(item.subtotal ?? 0))}
                  </td>

                  <td className="px-4 py-4 font-bold text-emerald-600">
                    {moneyFormatter.format(Number(item.profit ?? 0))}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {Number(item.margin_percentage ?? 0).toFixed(1)}%
                  </td>

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item)}
                      disabled={!canEdit}
                      className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
