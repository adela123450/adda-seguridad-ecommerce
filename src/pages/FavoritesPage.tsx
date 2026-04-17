import { Link } from "react-router-dom";
import { useFavorites } from "../hooks/useFavorites";

export const FavoritesPage = () => {
  const { favorites, removeFromFavorites, clearFavorites } = useFavorites();

  if (favorites.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-800">
          No tienes favoritos guardados
        </h1>

        <p className="mt-4 text-slate-600">
          Agrega productos a favoritos para consultarlos más rápido después.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Volver a la tienda
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Mis favoritos</h1>

        <button
          onClick={clearFavorites}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Vaciar favoritos
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {favorites.map((item) => (
          <article
            key={item.slug}
            className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <Link to={`/product/${item.slug}`} className="block">
              <div className="flex h-[220px] w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={item.img}
                  alt={item.name}
                  className="h-full w-full object-contain"
                />
              </div>
            </Link>

            <div className="mt-4 flex flex-1 flex-col">
              <p className="text-sm font-medium text-slate-500">{item.brand}</p>

              <h3 className="mt-1 min-h-[48px] text-base font-semibold text-slate-800">
                {item.name}
              </h3>

              <p className="mt-3 text-xl font-bold text-slate-900">
                {item.formattedPrice}
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <Link
                  to={`/product/${item.slug}`}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Ver detalle
                </Link>

                <button
                  onClick={() => removeFromFavorites(item.slug)}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  Quitar de favoritos
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};