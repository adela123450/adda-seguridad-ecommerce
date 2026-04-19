import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useFavorites } from "../../hooks/useFavorites";

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
  const { toggleFavorite, isFavorite } = useFavorites();

  const favoriteActive = isFavorite(slug);

  const handleToggleFavorite = () => {
    toggleFavorite({
      slug,
      name,
      brand,
      img,
      formattedPrice,
    });
  };

  const stockBadgeClass =
    stockLabel === "Agotado"
      ? "border-red-100 bg-red-50 text-red-600"
      : stockLabel === "Pocas unidades"
      ? "border-amber-100 bg-amber-50 text-amber-600"
      : "border-emerald-100 bg-emerald-50 text-emerald-600";

  return (
    <article className="group relative flex w-full max-w-[285px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <button
        onClick={handleToggleFavorite}
        aria-label={
          favoriteActive ? "Quitar de favoritos" : "Agregar a favoritos"
        }
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/95 shadow-md transition duration-300 hover:scale-105 hover:shadow-lg"
      >
        {favoriteActive ? (
          <FaHeart className="text-red-500" size={18} />
        ) : (
          <FaRegHeart className="text-slate-600" size={18} />
        )}
      </button>

      <Link to={`/product/${slug}`} className="block">
        <div className="relative flex h-[230px] w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <div className="absolute inset-0 bg-gradient-to-t from-[#2D5398]/5 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

          <img
            src={img}
            alt={name}
            className="relative z-[1] h-full w-full object-contain p-3 transition duration-300 group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2D5398]">
            {brand}
          </span>

          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stockBadgeClass}`}
          >
            {stockLabel}
          </span>
        </div>

        <h3 className="mt-3 min-h-[56px] text-lg font-semibold leading-8 text-slate-800 transition group-hover:text-[#2D5398]">
          {name}
        </h3>

        <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
          {formattedPrice}
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Precio referencial sujeto a disponibilidad
        </p>

        <div className="mt-5">
          <Link
            to={`/product/${slug}`}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-[#2D5398]"
          >
            Ver producto
          </Link>
        </div>
      </div>
    </article>
  );
};