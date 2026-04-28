import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CardProduct } from "../components/Products/CardProduct";
import { supabase } from "../lib/supabase";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  price: number | string;
  description: string | null;
  image_url: string | null;
  stock: number | string | null;
  is_new: boolean | null;
  is_featured: boolean | null;
  has_offer: boolean | null;
  offer_price: number | string | null;
  offer_label: string | null;
  created_at: string | null;
};

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

const getStockLabel = (stock: number) => {
  if (stock === 0) return "Agotado";
  if (stock <= 5) return "Pocas unidades";
  return "Disponible";
};

const hasValidOffer = (product: ProductRow) => {
  const basePrice = Number(product.price ?? 0);
  const offerPrice = Number(product.offer_price ?? 0);

  return Boolean(product.has_offer) && offerPrice > 0 && offerPrice < basePrice;
};

export const EquiposPage = () => {
  const [searchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") ?? "";

  const [searchTerm, setSearchTerm] = useState(queryFromUrl);
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [selectedSubcategory, setSelectedSubcategory] = useState("todas");
  const [selectedBrand, setSelectedBrand] = useState("todas");
  const [sortOrder, setSortOrder] = useState("default");

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setSearchTerm(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setLoadError(null);

      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, slug, brand, category, subcategory, price, description, image_url, stock, is_new, is_featured, has_offer, offer_price, offer_label, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase products error:", error);
        setLoadError(error.message || "Error desconocido al cargar productos.");
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setProducts((data as ProductRow[]) ?? []);
      setIsLoading(false);
    };

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    return [
      "todas",
      ...Array.from(
        new Set(
          products
            .map((product) => product.category?.trim())
            .filter((category): category is string => Boolean(category))
        )
      ).sort((a, b) => a.localeCompare(b)),
    ];
  }, [products]);

  const availableSubcategories = useMemo(() => {
    const filteredByCategory =
      selectedCategory === "todas"
        ? products
        : products.filter((product) => product.category === selectedCategory);

    return [
      "todas",
      ...Array.from(
        new Set(
          filteredByCategory
            .map((product) => product.subcategory?.trim())
            .filter((subcategory): subcategory is string => Boolean(subcategory))
        )
      ).sort((a, b) => a.localeCompare(b)),
    ];
  }, [products, selectedCategory]);

  const brands = useMemo(() => {
    return [
      "todas",
      ...Array.from(
        new Set(
          products
            .map((product) => product.brand?.trim())
            .filter((brand): brand is string => Boolean(brand))
        )
      ).sort((a, b) => a.localeCompare(b)),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== "todas") {
      result = result.filter((product) => product.category === selectedCategory);
    }

    if (selectedSubcategory !== "todas") {
      result = result.filter(
        (product) => product.subcategory === selectedSubcategory
      );
    }

    if (selectedBrand !== "todas") {
      result = result.filter((product) => product.brand === selectedBrand);
    }

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.toLowerCase().trim();

      result = result.filter((product) => {
        const searchableText = [
          product.name,
          product.brand,
          product.category,
          product.subcategory,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      });
    }

    if (sortOrder === "price-asc") {
      result.sort((a, b) => {
        const aPrice = hasValidOffer(a) ? Number(a.offer_price) : Number(a.price);
        const bPrice = hasValidOffer(b) ? Number(b.offer_price) : Number(b.price);
        return aPrice - bPrice;
      });
    }

    if (sortOrder === "price-desc") {
      result.sort((a, b) => {
        const aPrice = hasValidOffer(a) ? Number(a.offer_price) : Number(a.price);
        const bPrice = hasValidOffer(b) ? Number(b.offer_price) : Number(b.price);
        return bPrice - aPrice;
      });
    }

    if (sortOrder === "name-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortOrder === "name-desc") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [
    products,
    selectedCategory,
    selectedSubcategory,
    selectedBrand,
    searchTerm,
    sortOrder,
  ]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedSubcategory("todas");

    const normalizedSearch = searchTerm.toLowerCase().trim();

    if (!normalizedSearch || value === "todas") return;

    const hasMatchesInNewCategory = products.some((product) => {
      if (product.category !== value) return false;

      const searchableText = [
        product.name,
        product.brand,
        product.category,
        product.subcategory,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });

    if (!hasMatchesInNewCategory) {
      setSearchTerm("");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("todas");
    setSelectedSubcategory("todas");
    setSelectedBrand("todas");
    setSortOrder("default");
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="relative overflow-hidden rounded-3xl border border-blue-200/20 bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] shadow-[0_18px_45px_rgba(37,99,235,0.18)]">
        <div className="absolute -right-10 top-8 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute left-8 bottom-0 h-36 w-36 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_35%,rgba(255,255,255,0.03)_100%)]" />

        <div className="relative px-6 py-12 md:px-8 md:py-14">
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-50">
            Catálogo ADDA Seguridad
          </span>

          <h1 className="mt-4 text-3xl font-bold text-white md:text-5xl">
            Equipos de seguridad
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-blue-100 md:text-lg md:leading-8">
            Explora nuestro catálogo profesional de CCTV, almacenamiento,
            accesorios y soluciones inteligentes para proyectos residenciales,
            comerciales e institucionales.
          </p>

          <div className="mt-7 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white backdrop-blur-sm">
              {filteredProducts.length} resultados
            </span>

            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white backdrop-blur-sm">
              {categories.length - 1} categorías
            </span>

            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white backdrop-blur-sm">
              {brands.length - 1} marcas
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="lg:col-span-3 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:sticky md:top-24 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-800">Filtros</h2>

              <button
                onClick={clearFilters}
                className="text-sm font-medium text-cyan-700 transition hover:underline"
              >
                Limpiar
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Buscar producto
                </label>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ej. cámara domo, Dahua..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Categoría
                </label>

                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "todas" ? "Todas" : category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Subcategoría
                </label>

                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                >
                  {availableSubcategories.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory === "todas" ? "Todas" : subcategory}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Marca
                </label>

                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                >
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand === "todas" ? "Todas" : brand}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ordenar por
                </label>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                >
                  <option value="default">Relevancia</option>
                  <option value="price-asc">Precio: menor a mayor</option>
                  <option value="price-desc">Precio: mayor a menor</option>
                  <option value="name-asc">Nombre: A - Z</option>
                  <option value="name-desc">Nombre: Z - A</option>
                </select>
              </div>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-9">
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800">
                Cargando catálogo...
              </h2>

              <p className="mt-3 text-slate-600">
                Estamos consultando los productos disponibles.
              </p>
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-red-700">
                Error al cargar productos
              </h2>

              <p className="mt-3 text-red-600">{loadError}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800">
                No encontramos productos con esos filtros
              </h2>

              <p className="mt-3 text-slate-600">
                Intenta cambiar la categoría, la subcategoría, la marca o el
                término de búsqueda.
              </p>

              <button
                onClick={clearFilters}
                className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const validOffer = hasValidOffer(product);
                const basePrice = Number(product.price ?? 0);
                const offerPrice = Number(product.offer_price ?? 0);

                return (
                  <CardProduct
                    key={product.id}
                    img={product.image_url ?? "/placeholder-product.png"}
                    name={product.name}
                    brand={product.brand ?? "Sin marca"}
                    formattedPrice={formatPrice(basePrice)}
                    slug={product.slug}
                    stockLabel={getStockLabel(Number(product.stock ?? 0))}
                    hasOffer={validOffer}
                    formattedOfferPrice={
                      validOffer ? formatPrice(offerPrice) : undefined
                    }
                    offerLabel={product.offer_label ?? "Oferta"}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>
    </section>
  );
};