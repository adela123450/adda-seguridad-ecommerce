import { useEffect, useState } from "react";
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hasManualSlugEdit, setHasManualSlugEdit] = useState(false);
  const [form, setForm] = useState<ProductForm>(initialForm);

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

  const handleChange = (
    field: keyof ProductForm,
    value: string | boolean
  ) => {
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

    if (Number.isNaN(Number(form.price))) {
      return "El precio debe ser numérico.";
    }

    if (Number.isNaN(Number(form.stock))) {
      return "El stock debe ser numérico.";
    }

    if (form.has_offer) {
      if (!form.offer_price.trim()) {
        return "Debes ingresar el precio de oferta.";
      }

      if (Number.isNaN(Number(form.offer_price))) {
        return "El precio de oferta debe ser numérico.";
      }
    }

    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
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
      offer_label: form.has_offer
        ? form.offer_label.trim() || "Oferta"
        : null,
    };

    if (isEditing && editingId) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        console.error("Update product error:", error);
        setFormError(error.message || "No fue posible actualizar el producto.");
        setIsSaving(false);
        return;
      }

      setSuccessMessage("Producto actualizado correctamente.");
    } else {
      const { error } = await supabase.from("products").insert(payload);

      if (error) {
        console.error("Insert product error:", error);
        setFormError(error.message || "No fue posible crear el producto.");
        setIsSaving(false);
        return;
      }

      setSuccessMessage("Producto creado correctamente.");
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
    setSuccessMessage(null);

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

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "¿Seguro que deseas eliminar este producto?"
    );

    if (!confirmed) return;

    setSuccessMessage(null);
    setFormError(null);

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error("Delete product error:", error);
      setFormError(error.message || "No fue posible eliminar el producto.");
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    setSuccessMessage("Producto eliminado correctamente.");
    await fetchProducts();
  };

  const formatPrice = (value: number | string | null) => {
    if (value === null || value === undefined || value === "") return "—";

    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Number(value));
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:py-12">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] shadow-xl">
        <div className="relative px-6 py-12 md:px-8 md:py-14">
          <div className="absolute -right-16 top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute left-8 bottom-0 h-32 w-32 rounded-full bg-blue-200/10 blur-3xl" />

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

        {successMessage && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {successMessage}
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

          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
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

          <div className="md:col-span-2 flex flex-wrap gap-3">
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
        <h2 className="border-l-4 border-[#2D5398] pl-4 text-2xl font-bold text-slate-800">
          Tabla de productos
        </h2>

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
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-sm text-slate-500">
                  <th className="px-3 py-2">Producto</th>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Marca</th>
                  <th className="px-3 py-2">Categoría</th>
                  <th className="px-3 py-2">Precio</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">Oferta</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="rounded-2xl bg-slate-50 text-sm text-slate-700 shadow-sm"
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
                      {product.subcategory ? ` / ${product.subcategory}` : ""}
                    </td>
                    <td className="px-3 py-4">{formatPrice(product.price)}</td>
                    <td className="px-3 py-4">{product.stock ?? 0}</td>
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
                          onClick={() => handleDelete(product.id)}
                          className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-200"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};