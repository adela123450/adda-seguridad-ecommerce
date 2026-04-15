import { Link } from "react-router-dom";

interface Props {
  img: string;
  name: string;
  brand: string;
  formattedPrice: string;
  slug: string;
  stockLabel: string;
}

export const CardProduct = ({
  img,
  name,
  brand,
  formattedPrice,
  slug,
  stockLabel,
}: Props) => {
  return (
    <article className="group flex w-full max-w-[270px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <Link to={`/product/${slug}`} className="block">
        <div className="flex h-[220px] w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100">
          <img
            src={img}
            alt={name}
            className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-sm font-medium text-slate-500">{brand}</p>

        <h3 className="mt-1 min-h-[48px] text-base font-semibold text-slate-800">
          {name}
        </h3>

        <p className="mt-3 text-xl font-bold text-slate-900">
          {formattedPrice}
        </p>

        <p
          className={`mt-2 text-sm font-medium ${
            stockLabel === "Agotado"
              ? "text-red-600"
              : stockLabel === "Pocas unidades"
              ? "text-amber-600"
              : "text-emerald-600"
          }`}
        >
          {stockLabel}
        </p>

        <div className="mt-4">
          <Link
            to={`/product/${slug}`}
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  );
};