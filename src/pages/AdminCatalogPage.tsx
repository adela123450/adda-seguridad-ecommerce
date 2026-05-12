import { type FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type CatalogItem = {
  id: string;
  sku: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  item_type: string;
  category: string;
  subcategory: string | null;
  cost_price: number;
  suggested_sale_price: number;
  margin_percentage: number;
  tax_rate: number;
  unit_type: string;
  unit_quantity: number;
  compatible_analog: boolean;
  compatible_ip: boolean;
  compatible_wifi: boolean;
  compatible_solar: boolean;
  compatible_ajax: boolean;
  environment: string | null;
  material_quality: string | null;
  shielded: boolean;
  cable_category: string | null;
  amperage: string | null;
  color: string | null;
  visible_to_customer: boolean;
  public_name: string | null;
  public_group: string | null;
  inventory_track: boolean;
  active: boolean;
  reusable_in_templates: boolean;
  created_at: string;
  updated_at: string;
};

type CatalogForm = {
  sku: string;
  name: string;
  slug: string;
  description: string;
  item_type: string;
  category: string;
  subcategory: string;
  custom_subcategory: string;
  cost_price: string;
  suggested_sale_price: string;
  tax_rate: string;
  unit_type: string;
  unit_quantity: string;
  compatible_analog: boolean;
  compatible_ip: boolean;
  compatible_wifi: boolean;
  compatible_solar: boolean;
  compatible_ajax: boolean;
  environment: string;
  material_quality: string;
  shielded: boolean;
  cable_category: string;
  amperage: string;
  color: string;
  visible_to_customer: boolean;
  public_name: string;
  public_group: string;
  inventory_track: boolean;
  active: boolean;
  reusable_in_templates: boolean;
};

const initialForm: CatalogForm = {
  sku: "",
  name: "",
  slug: "",
  description: "",
  item_type: "consumable",
  category: "Materiales menores",
  subcategory: "",
  custom_subcategory: "",
  cost_price: "0",
  suggested_sale_price: "0",
  tax_rate: "0",
  unit_type: "unidad",
  unit_quantity: "1",
  compatible_analog: false,
  compatible_ip: false,
  compatible_wifi: false,
  compatible_solar: false,
  compatible_ajax: false,
  environment: "",
  material_quality: "",
  shielded: false,
  cable_category: "",
  amperage: "",
  color: "",
  visible_to_customer: false,
  public_name: "",
  public_group: "",
  inventory_track: false,
  active: true,
  reusable_in_templates: true,
};

const itemTypes = [
  { value: "product", label: "Producto / equipo principal" },
  { value: "consumable", label: "Consumible / material" },
  { value: "labor", label: "Mano de obra" },
  { value: "tool", label: "Herramienta / uso de equipo" },
  { value: "energy", label: "Energía / respaldo eléctrico" },
  { value: "infrastructure", label: "Infraestructura" },
  { value: "logistics", label: "Logística / transporte" },
  { value: "service", label: "Servicio técnico" },
  { value: "operational", label: "Costo operativo" },
];

const unitTypes = [
  "unidad",
  "metro",
  "caja",
  "tramo",
  "kit",
  "jornada",
  "servicio",
];

const categories = [
  "CCTV análogo",
  "CCTV IP",
  "CCTV WiFi",
  "CCTV solar",
  "Alarmas AJAX",
  "Materiales menores",
  "Cableado y canalización",
  "Mano de obra",
  "Transporte y logística",
  "Herramientas y operación",
  "Infraestructura y energía",
];

const defaultSubcategories = [
  "Cámaras",
  "XVR",
  "DVR",
  "NVR",
  "Discos duros",
  "MicroSD",
  "Fuentes de poder",
  "VideoBalun",
  "Borneras",
  "RJ45",
  "Patch cord",
  "Cable UTP",
  "Cable eléctrico",
  "Cable HDMI / VGA",
  "Neopreno",
  "Cajas de paso",
  "Canaletas",
  "Tubo PVC",
  "Curvas y terminales",
  "Abrazaderas",
  "Fijación",
  "Consumibles",
  "Racks",
  "UPS",
  "Estabilizadores",
  "Multitomas",
  "Monitores",
  "Paneles solares",
  "Baterías",
  "Soportes",
  "Hub AJAX",
  "Sensores AJAX",
  "Sirenas AJAX",
  "Mano de obra técnica",
  "Auxiliar técnico",
  "Trabajo en alturas",
  "Eléctrico",
  "Diagnóstico",
  "Mantenimiento",
  "Soporte técnico",
  "Transporte",
  "Logística",
  "Herramientas",
  "Otra",
];

const publicGroups = [
  "Materiales menores de instalación",
  "Insumos de fijación y montaje",
  "Insumos eléctricos y de terminación",
  "Cableado y canalización",
  "Equipos principales",
  "Mano de obra técnica",
  "Logística y desplazamiento",
  "Costos operativos de instalación",
  "Uso de herramientas y equipos menores",
];

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getItemTypeLabel = (value: string) =>
  itemTypes.find((type) => type.value === value)?.label ?? value;

export const AdminCatalogPage = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [form, setForm] = useState<CatalogForm>(initialForm);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const subcategoryOptions = useMemo(() => {
    const existing = items
      .map((item) => item.subcategory)
      .filter((subcategory): subcategory is string => Boolean(subcategory));

    return Array.from(new Set([...defaultSubcategories, ...existing])).sort(
      (a, b) => {
        if (a === "Otra") return 1;
        if (b === "Otra") return -1;
        return a.localeCompare(b, "es");
      }
    );
  }, [items]);

  const loadItems = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("catalog_items")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      setError("No fue posible cargar el catálogo técnico interno.");
      setItems([]);
    } else {
      setItems((data ?? []) as CatalogItem[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const term = search.trim().toLowerCase();

      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.sku?.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.subcategory?.toLowerCase().includes(term) ||
        item.public_group?.toLowerCase().includes(term);

      const matchesType =
        typeFilter === "all" || item.item_type === typeFilter;

      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.active) ||
        (statusFilter === "inactive" && !item.active);

      return matchesSearch && matchesType && matchesCategory && matchesStatus;
    });
  }, [items, search, typeFilter, categoryFilter, statusFilter]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingItem(null);
    setMessage("");
    setError("");
  };

  const handleChange = (
    field: keyof CatalogForm,
    value: string | boolean
  ) => {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "name" && !editingItem) {
        next.slug = normalizeSlug(String(value));
      }

      if (field === "subcategory" && value !== "Otra") {
        next.custom_subcategory = "";
      }

      return next;
    });
  };

  const handleEdit = (item: CatalogItem) => {
    const existingSubcategory = item.subcategory ?? "";
    const isKnownSubcategory = subcategoryOptions.includes(existingSubcategory);

    setEditingItem(item);

    setForm({
      sku: item.sku ?? "",
      name: item.name,
      slug: item.slug ?? "",
      description: item.description ?? "",
      item_type: item.item_type,
      category: item.category,
      subcategory: isKnownSubcategory ? existingSubcategory : "Otra",
      custom_subcategory: isKnownSubcategory ? "" : existingSubcategory,
      cost_price: String(item.cost_price ?? 0),
      suggested_sale_price: String(item.suggested_sale_price ?? 0),
      tax_rate: String(item.tax_rate ?? 0),
      unit_type: item.unit_type,
      unit_quantity: String(item.unit_quantity ?? 1),
      compatible_analog: item.compatible_analog,
      compatible_ip: item.compatible_ip,
      compatible_wifi: item.compatible_wifi,
      compatible_solar: item.compatible_solar,
      compatible_ajax: item.compatible_ajax,
      environment: item.environment ?? "",
      material_quality: item.material_quality ?? "",
      shielded: item.shielded,
      cable_category: item.cable_category ?? "",
      amperage: item.amperage ?? "",
      color: item.color ?? "",
      visible_to_customer: item.visible_to_customer,
      public_name: item.public_name ?? "",
      public_group: item.public_group ?? "",
      inventory_track: item.inventory_track,
      active: item.active,
      reusable_in_templates: item.reusable_in_templates,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const calculateMargin = () => {
    const cost = toNumber(form.cost_price);
    const price = toNumber(form.suggested_sale_price);

    if (price <= 0) return 0;

    return Number((((price - cost) / price) * 100).toFixed(2));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    if (!form.name.trim()) {
      setError("El nombre del ítem es obligatorio.");
      setSaving(false);
      return;
    }

    const finalSubcategory =
      form.subcategory === "Otra"
        ? form.custom_subcategory.trim()
        : form.subcategory.trim();

    const payload = {
      sku: form.sku.trim() || null,
      name: form.name.trim(),
      slug: form.slug.trim() || normalizeSlug(form.name),
      description: form.description.trim() || null,
      item_type: form.item_type,
      category: form.category,
      subcategory: finalSubcategory || null,
      cost_price: toNumber(form.cost_price),
      suggested_sale_price: toNumber(form.suggested_sale_price),
      margin_percentage: calculateMargin(),
      tax_rate: toNumber(form.tax_rate),
      unit_type: form.unit_type,
      unit_quantity: toNumber(form.unit_quantity) || 1,
      compatible_analog: form.compatible_analog,
      compatible_ip: form.compatible_ip,
      compatible_wifi: form.compatible_wifi,
      compatible_solar: form.compatible_solar,
      compatible_ajax: form.compatible_ajax,
      environment: form.environment.trim() || null,
      material_quality: form.material_quality.trim() || null,
      shielded: form.shielded,
      cable_category: form.cable_category.trim() || null,
      amperage: form.amperage.trim() || null,
      color: form.color.trim() || null,
      visible_to_customer: form.visible_to_customer,
      public_name: form.public_name.trim() || null,
      public_group: form.public_group.trim() || null,
      inventory_track: form.inventory_track,
      active: form.active,
      reusable_in_templates: form.reusable_in_templates,
      updated_at: new Date().toISOString(),
    };

    const response = editingItem
      ? await supabase
          .from("catalog_items")
          .update(payload)
          .eq("id", editingItem.id)
      : await supabase.from("catalog_items").insert(payload);

    if (response.error) {
      setError(
        response.error.message ||
          "No fue posible guardar el ítem del catálogo."
      );
    } else {
      setMessage(
        editingItem
          ? "Ítem actualizado correctamente."
          : "Ítem creado correctamente."
      );
      resetForm();
      await loadItems();
    }

    setSaving(false);
  };

  const toggleActive = async (item: CatalogItem) => {
    setMessage("");
    setError("");

    const { error } = await supabase
      .from("catalog_items")
      .update({
        active: !item.active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      setError("No fue posible actualizar el estado del ítem.");
    } else {
      setMessage(
        !item.active
          ? "Ítem activado correctamente."
          : "Ítem desactivado correctamente."
      );
      await loadItems();
    }
  };

  return (
    <section className="mx-auto max-w-7xl overflow-hidden px-4 py-8">
      <div className="mb-8 overflow-hidden rounded-3xl bg-[#2D5398] shadow-xl">
        <div className="grid gap-6 p-6 text-white md:grid-cols-[1.5fr_1fr] md:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
              Cotizaciones PRO
            </p>

            <h2 className="mt-2 text-3xl font-black md:text-4xl">
              Catálogo técnico interno
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/85">
              Administra consumibles, mano de obra, infraestructura, logística,
              herramientas y materiales técnicos usados para calcular
              cotizaciones reales de ADDA Seguridad.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
            <p className="text-sm text-white/75">Ítems registrados</p>
            <p className="mt-2 text-4xl font-black">{items.length}</p>
            <p className="mt-2 text-sm text-white/75">
              Activos: {items.filter((item) => item.active).length}
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
        <form
          onSubmit={handleSubmit}
          className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800">
                {editingItem ? "Editar ítem" : "Nuevo ítem"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Define costos, compatibilidad y visibilidad comercial.
              </p>
            </div>

            {editingItem && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="grid min-w-0 gap-4">
            <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
              Nombre interno
              <input
                value={form.name}
                onChange={(event) => handleChange("name", event.target.value)}
                className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                placeholder="Ej: UTP Cat6 exterior blindado 100% cobre"
              />
            </label>

            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                SKU
                <input
                  value={form.sku}
                  onChange={(event) => handleChange("sku", event.target.value)}
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                  placeholder="Opcional"
                />
              </label>

              <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                Slug
                <input
                  value={form.slug}
                  onChange={(event) => handleChange("slug", event.target.value)}
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                />
              </label>
            </div>

            <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
              Descripción
              <textarea
                value={form.description}
                onChange={(event) =>
                  handleChange("description", event.target.value)
                }
                className="min-h-20 w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                placeholder="Detalle técnico interno"
              />
            </label>

            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                Tipo
                <select
                  value={form.item_type}
                  onChange={(event) =>
                    handleChange("item_type", event.target.value)
                  }
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                >
                  {itemTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                Categoría
                <select
                  value={form.category}
                  onChange={(event) =>
                    handleChange("category", event.target.value)
                  }
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
              Subcategoría
              <select
                value={form.subcategory}
                onChange={(event) =>
                  handleChange("subcategory", event.target.value)
                }
                className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
              >
                <option value="">Seleccionar subcategoría</option>
                {subcategoryOptions.map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </select>
            </label>

            {form.subcategory === "Otra" && (
              <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                Nueva subcategoría
                <input
                  value={form.custom_subcategory}
                  onChange={(event) =>
                    handleChange("custom_subcategory", event.target.value)
                  }
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                  placeholder="Escribe la nueva subcategoría"
                />
              </label>
            )}

            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                Costo interno
                <input
                  type="number"
                  value={form.cost_price}
                  onChange={(event) =>
                    handleChange("cost_price", event.target.value)
                  }
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                />
              </label>

              <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                Precio sugerido
                <input
                  type="number"
                  value={form.suggested_sale_price}
                  onChange={(event) =>
                    handleChange("suggested_sale_price", event.target.value)
                  }
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                />
              </label>
            </div>

            <div className="grid min-w-0 gap-4 md:grid-cols-3">
              <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                IVA %
                <input
                  type="number"
                  value={form.tax_rate}
                  onChange={(event) =>
                    handleChange("tax_rate", event.target.value)
                  }
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                />
              </label>

              <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                Unidad
                <select
                  value={form.unit_type}
                  onChange={(event) =>
                    handleChange("unit_type", event.target.value)
                  }
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                >
                  {unitTypes.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                Cantidad unidad
                <input
                  type="number"
                  value={form.unit_quantity}
                  onChange={(event) =>
                    handleChange("unit_quantity", event.target.value)
                  }
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                />
              </label>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="mb-3 text-sm font-black text-slate-700">
                Compatibilidad técnica
              </p>

              <div className="grid gap-2 md:grid-cols-2">
                {[
                  ["compatible_analog", "Análogo"],
                  ["compatible_ip", "IP"],
                  ["compatible_wifi", "WiFi"],
                  ["compatible_solar", "Solar"],
                  ["compatible_ajax", "AJAX"],
                ].map(([field, label]) => (
                  <label
                    key={field}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-600"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(form[field as keyof CatalogForm])}
                      onChange={(event) =>
                        handleChange(
                          field as keyof CatalogForm,
                          event.target.checked
                        )
                      }
                      className="h-4 w-4 accent-[#2D5398]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                Ambiente
                <input
                  value={form.environment}
                  onChange={(event) =>
                    handleChange("environment", event.target.value)
                  }
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                  placeholder="Interior / exterior"
                />
              </label>

              <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                Calidad material
                <input
                  value={form.material_quality}
                  onChange={(event) =>
                    handleChange("material_quality", event.target.value)
                  }
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                  placeholder="Aleación / 100% cobre"
                />
              </label>
            </div>

            <div className="grid min-w-0 gap-4 md:grid-cols-3">
              <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                Categoría cable
                <input
                  value={form.cable_category}
                  onChange={(event) =>
                    handleChange("cable_category", event.target.value)
                  }
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                  placeholder="Cat5e / Cat6"
                />
              </label>

              <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                Amperaje
                <input
                  value={form.amperage}
                  onChange={(event) =>
                    handleChange("amperage", event.target.value)
                  }
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                  placeholder="1A / 1.5A / 2A"
                />
              </label>

              <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                Color
                <input
                  value={form.color}
                  onChange={(event) =>
                    handleChange("color", event.target.value)
                  }
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.shielded}
                onChange={(event) =>
                  handleChange("shielded", event.target.checked)
                }
                className="h-4 w-4 accent-[#2D5398]"
              />
              Blindado
            </label>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="mb-3 text-sm font-black text-slate-700">
                Visibilidad comercial
              </p>

              <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.visible_to_customer}
                  onChange={(event) =>
                    handleChange("visible_to_customer", event.target.checked)
                  }
                  className="h-4 w-4 accent-[#2D5398]"
                />
                Visible directamente al cliente
              </label>

              <div className="grid min-w-0 gap-3">
                <input
                  value={form.public_name}
                  onChange={(event) =>
                    handleChange("public_name", event.target.value)
                  }
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                  placeholder="Nombre público"
                />

                <select
                  value={form.public_group}
                  onChange={(event) =>
                    handleChange("public_group", event.target.value)
                  }
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                >
                  <option value="">Seleccionar agrupación pública</option>
                  {publicGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-2 rounded-2xl bg-slate-50 p-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.inventory_track}
                  onChange={(event) =>
                    handleChange("inventory_track", event.target.checked)
                  }
                  className="h-4 w-4 accent-[#2D5398]"
                />
                Controlar inventario
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.reusable_in_templates}
                  onChange={(event) =>
                    handleChange(
                      "reusable_in_templates",
                      event.target.checked
                    )
                  }
                  className="h-4 w-4 accent-[#2D5398]"
                />
                Reutilizable en plantillas
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    handleChange("active", event.target.checked)
                  }
                  className="h-4 w-4 accent-[#2D5398]"
                />
                Activo
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#2D5398]/20 transition hover:bg-[#234684] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Guardando..."
                : editingItem
                ? "Actualizar ítem"
                : "Crear ítem"}
            </button>
          </div>
        </form>

        <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-black text-slate-800">
              Catálogo registrado
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Filtra y administra los ítems internos usados en cotizaciones.
            </p>
          </div>

          <div className="mb-5 grid min-w-0 gap-3 md:grid-cols-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20 md:col-span-2"
              placeholder="Buscar por nombre, SKU, categoría..."
            />

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
            >
              <option value="all">Todos los tipos</option>
              {itemTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
            >
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="all">Todos</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20 md:col-span-4"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
              Cargando catálogo...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
              No hay ítems que coincidan con los filtros.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-400">
                    <th className="px-3">Ítem</th>
                    <th className="px-3">Tipo</th>
                    <th className="px-3">Costo</th>
                    <th className="px-3">Precio</th>
                    <th className="px-3">Margen</th>
                    <th className="px-3">Compatibilidad</th>
                    <th className="px-3">Estado</th>
                    <th className="px-3 text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="bg-slate-50">
                      <td className="rounded-l-2xl px-3 py-4">
                        <p className="font-black text-slate-800">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.category}
                          {item.subcategory ? ` / ${item.subcategory}` : ""}
                        </p>
                        {item.sku && (
                          <p className="mt-1 text-xs font-semibold text-[#2D5398]">
                            SKU: {item.sku}
                          </p>
                        )}
                        {item.public_group && (
                          <p className="mt-1 text-xs text-slate-400">
                            Grupo cliente: {item.public_group}
                          </p>
                        )}
                      </td>

                      <td className="px-3 py-4 text-sm font-semibold text-slate-600">
                        {getItemTypeLabel(item.item_type)}
                      </td>

                      <td className="px-3 py-4 text-sm font-semibold text-slate-700">
                        ${Number(item.cost_price).toLocaleString("es-CO")}
                      </td>

                      <td className="px-3 py-4 text-sm font-semibold text-slate-700">
                        $
                        {Number(item.suggested_sale_price).toLocaleString(
                          "es-CO"
                        )}
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            item.margin_percentage < 15
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {Number(item.margin_percentage).toFixed(2)}%
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.compatible_analog && (
                            <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-600">
                              Análogo
                            </span>
                          )}
                          {item.compatible_ip && (
                            <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-600">
                              IP
                            </span>
                          )}
                          {item.compatible_wifi && (
                            <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-600">
                              WiFi
                            </span>
                          )}
                          {item.compatible_solar && (
                            <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-600">
                              Solar
                            </span>
                          )}
                          {item.compatible_ajax && (
                            <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-600">
                              AJAX
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            item.active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {item.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="rounded-r-2xl px-3 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="rounded-xl bg-[#2D5398]/10 px-3 py-2 text-xs font-black text-[#2D5398] transition hover:bg-[#2D5398]/20"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleActive(item)}
                            className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-300"
                          >
                            {item.active ? "Desactivar" : "Activar"}
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
      </div>
    </section>
  );
};
