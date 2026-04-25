import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabase";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  price: number | string;
  description: string | null;
  image_url: string | null;
  stock: number | string | null;
  has_offer: boolean | null;
  offer_price: number | string | null;
  offer_label: string | null;
  created_at: string | null;
};

type ProductForm = {
  name: string;
  slug: string;
  sku: string;
  brand: string;
  category: string;
  subcategory: string;
  price: string;
  description: string;
  image_url: string;
  stock: string;
  has_offer: boolean;
  offer_price: string;
  offer_label: string;
};

type OfferFilter = "all" | "with-offer" | "without-offer";
type StockFilter = "all" | "in-stock" | "low-stock" | "out-of-stock";
type SortKey =
  | "name"
  | "sku"
  | "brand"
  | "category"
  | "price"
  | "stock"
  | "offer";
type SortDirection = "asc" | "desc";
type ToastType = "success" | "error";

type Toast = {
  type: ToastType;
  message: string;
};

const initialForm: ProductForm = {
  name: "",
  slug: "",
  sku: "",
  brand: "",
  category: "",
  subcategory: "",
  price: "",
  description: "",
  image_url: "",
  stock: "0",
  has_offer: false,
  offer_price: "",
  offer_label: "",
};

const LOW_STOCK_THRESHOLD = 5;

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export const AdminProductsPage = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hasManualSlugEdit, setHasManualSlugEdit] = useState(false);
  const [form, setForm] = useState<ProductForm>(initialForm);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [offerFilter, setOfferFilter] = useState<OfferFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [productToDelete, setProductToDelete] =
    useState<ProductRow | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchProducts = async () => {
    setIsLoading(true);
    setLoadError(null);

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, sku, brand, category, subcategory, price, description, image_url, stock, has_offer, offer_price, offer_label, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin products fetch error:", error);
      setLoadError(error.message || "No fue posible cargar los productos.");
      setProducts([]);
      setIsLoading(false);
      showToast("error", "No fue posible cargar los productos.");
      return;
    }

    setProducts((data as ProductRow[]) ?? []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setIsEditing(false);
    setEditingId(null);
    setHasManualSlugEdit(false);
    setFormError(null);
  };

  const handleChange = (field: keyof ProductForm, value: string | boolean) => {
    setForm((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

      if (field === "name" && !isEditing && !hasManualSlugEdit) {
        updated.slug = slugify(String(value));
      }

      return updated;
    });
  };

  const handleSlugChange = (value: string) => {
    setHasManualSlugEdit(true);

    setForm((prev) => ({
      ...prev,
      slug: slugify(value),
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) return "El nombre es obligatorio.";
    if (!form.slug.trim()) return "La URL amigable es obligatoria.";
    if (!form.sku.trim()) return "El SKU es obligatorio.";
    if (!form.price.trim()) return "El precio es obligatorio.";

    if (Number.isNaN(Number(form.price))) return "El precio debe ser numérico.";
    if (Number.isNaN(Number(form.stock))) return "El stock debe ser numérico.";

    if (form.has_offer) {
      if (!form.offer_price.trim()) return "Debes ingresar el precio de oferta.";
      if (Number.isNaN(Number(form.offer_price))) {
        return "El precio de oferta debe ser numérico.";
      }
    }

    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      showToast("error", validationError);
      return;
    }

    setIsSaving(true);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      sku: form.sku.trim(),
      brand: form.brand.trim() || null,
      category: form.category.trim() || null,
      subcategory: form.subcategory.trim() || null,
      price: Number(form.price),
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      stock: Number(form.stock),
      has_offer: form.has_offer,
      offer_price:
        form.has_offer && form.offer_price.trim()
          ? Number(form.offer_price)
          : null,
      offer_label: form.has_offer ? form.offer_label.trim() || "Oferta" : null,
    };

    if (isEditing && editingId) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        console.error("Update product error:", error);
        setFormError(error.message || "No fue posible actualizar el producto.");
        showToast("error", "No fue posible actualizar el producto.");
        setIsSaving(false);
        return;
      }

      showToast("success", "Producto actualizado correctamente.");
    } else {
      const { error } = await supabase.from("products").insert(payload);

      if (error) {
        console.error("Insert product error:", error);
        setFormError(error.message || "No fue posible crear el producto.");
        showToast("error", "No fue posible crear el producto.");
        setIsSaving(false);
        return;
      }

      showToast("success", "Producto creado correctamente.");
    }

    resetForm();
    await fetchProducts();
    setIsSaving(false);
  };

  const handleEdit = (product: ProductRow) => {
    setIsEditing(true);
    setEditingId(product.id);
    setHasManualSlugEdit(true);
    setFormError(null);

    setForm({
      name: product.name ?? "",
      slug: product.slug ?? "",
      sku: product.sku ?? "",
      brand: product.brand ?? "",
      category: product.category ?? "",
      subcategory: product.subcategory ?? "",
      price: String(product.price ?? ""),
      description: product.description ?? "",
      image_url: product.image_url ?? "",
      stock: String(product.stock ?? 0),
      has_offer: Boolean(product.has_offer),
      offer_price:
        product.offer_price !== null && product.offer_price !== undefined
          ? String(product.offer_price)
          : "",
      offer_label: product.offer_label ?? "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDeleteModal = (product: ProductRow) => {
    setProductToDelete(product);
    setFormError(null);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setProductToDelete(null);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    setFormError(null);

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productToDelete.id);

    if (error) {
      console.error("Delete product error:", error);
      setFormError(error.message || "No fue posible eliminar el producto.");
      showToast("error", "No fue posible eliminar el producto.");
      setIsDeleting(false);
      return;
    }

    if (editingId === productToDelete.id) {
      resetForm();
    }

    showToast("success", "Producto eliminado correctamente.");
    setProductToDelete(null);
    await fetchProducts();
    setIsDeleting(false);
  };

  const formatPrice = (value: number | string | null) => {
    if (value === null || value === undefined || value === "") return "—";

    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Number(value));
  };

  const getNormalizedText = (value: string | null | undefined) =>
    (value ?? "").trim().toLowerCase();

  const getStockValue = (value: number | string | null) => {
    const numericValue = Number(value ?? 0);
    return Number.isNaN(numericValue) ? 0 : numericValue;
  };

  const getSortValue = (product: ProductRow, key: SortKey) => {
    if (key === "price") return Number(product.price ?? 0);
    if (key === "stock") return getStockValue(product.stock);
    if (key === "offer") return product.has_offer ? 1 : 0;

    const valueMap = {
      name: product.name,
      sku: product.sku,
      brand: product.brand,
      category: product.category,
    };

    return getNormalizedText(valueMap[key]);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const brandOptions = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.brand?.trim())
          .filter((brand): brand is string => Boolean(brand))
      )
    ).sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.category?.trim())
          .filter((category): category is string => Boolean(category))
      )
    ).sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          product.name,
          product.slug,
          product.sku,
          product.brand,
          product.category,
          product.subcategory,
        ]
          .map((value) => getNormalizedText(value))
          .some((value) => value.includes(normalizedSearch));

      const matchesBrand =
        selectedBrand === "all" || (product.brand ?? "") === selectedBrand;

      const matchesCategory =
        selectedCategory === "all" ||
        (product.category ?? "") === selectedCategory;

      const matchesOffer =
        offerFilter === "all" ||
        (offerFilter === "with-offer" && Boolean(product.has_offer)) ||
        (offerFilter === "without-offer" && !product.has_offer);

      const stockValue = getStockValue(product.stock);

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in-stock" && stockValue > LOW_STOCK_THRESHOLD) ||
        (stockFilter === "low-stock" &&
          stockValue > 0 &&
          stockValue <= LOW_STOCK_THRESHOLD) ||
        (stockFilter === "out-of-stock" && stockValue <= 0);

      return (
        matchesSearch &&
        matchesBrand &&
        matchesCategory &&
        matchesOffer &&
        matchesStock
      );
    });
  }, [
    products,
    searchTerm,
    selectedBrand,
    selectedCategory,
    offerFilter,
    stockFilter,
  ]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const aValue = getSortValue(a, sortKey);
      const bValue = getSortValue(b, sortKey);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return sortDirection === "asc"
        ? String(aValue).localeCompare(String(bValue), "es")
        : String(bValue).localeCompare(String(aValue), "es");
    });
  }, [filteredProducts, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / itemsPerPage));

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedProducts, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedBrand,
    selectedCategory,
    offerFilter,
    stockFilter,
    itemsPerPage,
    sortKey,
    sortDirection,
  ]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedBrand("all");
    setSelectedCategory("all");
    setOfferFilter("all");
    setStockFilter("all");
  };

  const SortButton = ({ label, sort }: { label: string; sort: SortKey }) => (
    <button
      type="button"
      onClick={() => handleSort(sort)}
      className="inline-flex items-center gap-1 font-semibold text-slate-600 transition hover:text-[#2D5398]"
    >
      {label}
      <span className="text-xs">{getSortIcon(sort)}</span>
    </button>
  );

  const PaginationControls = () => (
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
      <div className="text-sm font-medium text-slate-600">
        Mostrando{" "}
        <span className="font-bold text-slate-900">
          {paginatedProducts.length}
        </span>{" "}
        de{" "}
        <span className="font-bold text-slate-900">
          {sortedProducts.length}
        </span>{" "}
        productos
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 outline-none focus:border-[#2D5398]"
        >
          <option value={5}>5 por página</option>
          <option value={10}>10 por página</option>
          <option value={20}>20 por página</option>
          <option value={50}>50 por página</option>
        </select>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>

          <span className="rounded-xl bg-[#2D5398]/10 px-4 py-2 text-sm font-bold text-[#2D5398]">
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-10 md:py-12">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 max-w-sm rounded-2xl border px-5 py-4 text-sm font-semibold shadow-xl ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] shadow-xl">
        <div className="relative px-6 py-12 md:px-8 md:py-14">
          <div className="absolute -right-16 top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-8 h-32 w-32 rounded-full bg-blue-200/10 blur-3xl" />

          <div className="relative">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-50">
              Panel administrador
            </span>

            <h1 className="mt-4 max-w-4xl text-2xl font-bold text-white md:text-4xl">
              Gestión de productos ADDA Seguridad
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-blue-100 md:text-lg md:leading-8">
              Desde aquí puedes crear, editar, eliminar productos, actualizar
              stock y configurar ofertas del catálogo.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-md md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="border-l-4 border-[#2D5398] pl-4 text-2xl font-bold text-slate-800">
            {isEditing ? "Editar producto" : "Nuevo producto"}
          </h2>

          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar edición
            </button>
          )}
        </div>

        {formError && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {formError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nombre
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              URL amigable
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="Ej: camara-ptz-hikvision-25x"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              SKU
            </label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => handleChange("sku", e.target.value)}
              placeholder="Ej: CAM-HK-PTZ-002"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Marca
            </label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => handleChange("brand", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Categoría
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Subcategoría
            </label>
            <input
              type="text"
              value={form.subcategory}
              onChange={(e) => handleChange("subcategory", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Precio
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => handleChange("price", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Stock
            </label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => handleChange("stock", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              URL imagen
            </label>
            <input
              type="text"
              value={form.image_url}
              onChange={(e) => handleChange("image_url", e.target.value)}
              placeholder="Por ahora déjalo vacío si aún no tienes imágenes"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:col-span-2">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.has_offer}
                  onChange={(e) => handleChange("has_offer", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Activar oferta
              </label>

              {form.has_offer && (
                <>
                  <input
                    type="number"
                    value={form.offer_price}
                    onChange={(e) => handleChange("offer_price", e.target.value)}
                    placeholder="Precio en oferta"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398] md:max-w-[220px]"
                  />

                  <input
                    type="text"
                    value={form.offer_label}
                    onChange={(e) => handleChange("offer_label", e.target.value)}
                    placeholder="Etiqueta de oferta"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398] md:max-w-[240px]"
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex rounded-xl bg-[#2D5398] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving
                ? "Guardando..."
                : isEditing
                ? "Actualizar producto"
                : "Crear producto"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="inline-flex rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Limpiar formulario
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-md md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="border-l-4 border-[#2D5398] pl-4 text-2xl font-bold text-slate-800">
            Tabla de productos
          </h2>

          <div className="text-sm font-medium text-slate-500">
            {sortedProducts.length} resultado
            {sortedProducts.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Buscar producto
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre, SKU, slug, marca o categoría"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Marca
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
              >
                <option value="all">Todas las marcas</option>
                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
              >
                <option value="all">Todas las categorías</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Oferta
              </label>
              <select
                value={offerFilter}
                onChange={(e) => setOfferFilter(e.target.value as OfferFilter)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
              >
                <option value="all">Todas</option>
                <option value="with-offer">Con oferta</option>
                <option value="without-offer">Sin oferta</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Stock
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as StockFilter)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
              >
                <option value="all">Todos</option>
                <option value="in-stock">Disponible</option>
                <option value="low-stock">Stock bajo</option>
                <option value="out-of-stock">Sin stock</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Limpiar filtros
            </button>

            <div className="inline-flex items-center rounded-xl bg-[#2D5398]/10 px-4 py-2.5 text-sm font-medium text-[#2D5398]">
              Stock bajo definido en {LOW_STOCK_THRESHOLD} unidades o menos
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-600">
            Cargando productos...
          </div>
        ) : loadError ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-red-700">
            {loadError}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-600">
            No hay productos registrados todavía.
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-600">
            No hay productos que coincidan con los filtros aplicados.
          </div>
        ) : (
          <>
            <div className="mt-6 hidden overflow-x-auto lg:block">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-sm text-slate-500">
                    <th className="px-3 py-2">
                      <SortButton label="Producto" sort="name" />
                    </th>
                    <th className="px-3 py-2">
                      <SortButton label="SKU" sort="sku" />
                    </th>
                    <th className="px-3 py-2">
                      <SortButton label="Marca" sort="brand" />
                    </th>
                    <th className="px-3 py-2">
                      <SortButton label="Categoría" sort="category" />
                    </th>
                    <th className="px-3 py-2">
                      <SortButton label="Precio" sort="price" />
                    </th>
                    <th className="px-3 py-2">
                      <SortButton label="Stock" sort="stock" />
                    </th>
                    <th className="px-3 py-2">
                      <SortButton label="Oferta" sort="offer" />
                    </th>
                    <th className="px-3 py-2">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedProducts.map((product) => {
                    const stockValue = getStockValue(product.stock);
                    const isLowStock =
                      stockValue > 0 && stockValue <= LOW_STOCK_THRESHOLD;
                    const isOutOfStock = stockValue <= 0;

                    return (
                      <tr
                        key={product.id}
                        className="rounded-2xl bg-slate-50 text-sm text-slate-700 shadow-sm transition hover:bg-slate-100"
                      >
                        <td className="rounded-l-2xl px-3 py-4">
                          <div className="font-semibold text-slate-800">
                            {product.name}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {product.slug}
                          </div>
                        </td>

                        <td className="px-3 py-4">{product.sku ?? "—"}</td>
                        <td className="px-3 py-4">{product.brand ?? "—"}</td>
                        <td className="px-3 py-4">
                          {product.category ?? "—"}
                          {product.subcategory
                            ? ` / ${product.subcategory}`
                            : ""}
                        </td>
                        <td className="px-3 py-4">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex flex-col gap-1">
                            <span>{stockValue}</span>

                            {isOutOfStock ? (
                              <span className="inline-flex w-fit rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                                Sin stock
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex w-fit rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                Stock bajo
                              </span>
                            ) : (
                              <span className="inline-flex w-fit rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                Disponible
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          {product.has_offer ? (
                            <div>
                              <div className="font-semibold text-emerald-700">
                                {formatPrice(product.offer_price)}
                              </div>
                              <div className="text-xs text-slate-500">
                                {product.offer_label ?? "Oferta"}
                              </div>
                            </div>
                          ) : (
                            "No"
                          )}
                        </td>

                        <td className="rounded-r-2xl px-3 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(product)}
                              className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-200"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(product)}
                              className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-200"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid gap-4 lg:hidden">
              {paginatedProducts.map((product) => {
                const stockValue = getStockValue(product.stock);
                const isLowStock =
                  stockValue > 0 && stockValue <= LOW_STOCK_THRESHOLD;
                const isOutOfStock = stockValue <= 0;

                return (
                  <article
                    key={product.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {product.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {product.slug}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            SKU
                          </p>
                          <p className="mt-1 font-semibold text-slate-700">
                            {product.sku ?? "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Marca
                          </p>
                          <p className="mt-1 font-semibold text-slate-700">
                            {product.brand ?? "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Categoría
                          </p>
                          <p className="mt-1 font-semibold text-slate-700">
                            {product.category ?? "—"}
                          </p>
                          {product.subcategory && (
                            <p className="mt-1 text-xs text-slate-500">
                              {product.subcategory}
                            </p>
                          )}
                        </div>

                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Precio
                          </p>
                          <p className="mt-1 font-semibold text-slate-700">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isOutOfStock ? (
                          <span className="inline-flex rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">
                            Sin stock: {stockValue}
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
                            Stock bajo: {stockValue}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            Disponible: {stockValue}
                          </span>
                        )}

                        {product.has_offer ? (
                          <span className="inline-flex rounded-full bg-[#2D5398]/10 px-3 py-1.5 text-xs font-semibold text-[#2D5398]">
                            {product.offer_label ?? "Oferta"} ·{" "}
                            {formatPrice(product.offer_price)}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">
                            Sin oferta
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="w-full rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-200"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(product)}
                          className="w-full rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <PaginationControls />
          </>
        )}
      </div>

      {productToDelete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-xl font-bold text-red-700">
              !
            </div>

            <h3 className="mt-5 text-xl font-bold text-slate-900">
              Confirmar eliminación
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Vas a eliminar el producto{" "}
              <span className="font-semibold text-slate-900">
                {productToDelete.name}
              </span>
              . Esta acción no se puede deshacer.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};