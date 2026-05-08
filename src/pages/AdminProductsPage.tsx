import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
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
  cost_price: number | string | null;
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
  cost_price: string;
  desired_margin: string;
  include_wompi_fee_in_price: boolean;
  description: string;
  image_url: string;
  stock: string;
  has_offer: boolean;
  offer_price: string;
  offer_label: string;
};

type TaxMode = "sin_iva" | "con_iva";

type BusinessSettings = {
  tax_mode: TaxMode;
  tax_rate: number | string | null;
};

type OfferFilter = "all" | "with-offer" | "without-offer";
type StockFilter = "all" | "in-stock" | "low-stock" | "out-of-stock";
type SortKey =
  | "name"
  | "sku"
  | "brand"
  | "category"
  | "price"
  | "cost_price"
  | "profit"
  | "margin"
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
  cost_price: "0",
  desired_margin: "30",
  include_wompi_fee_in_price: false,
  description: "",
  image_url: "",
  stock: "0",
  has_offer: false,
  offer_price: "",
  offer_label: "",
};

const LOW_STOCK_THRESHOLD = 5;
const IVA_RATE = 0.19;
const WOMPI_FEE_RATE = 0.032;
const WOMPI_FIXED_FEE = 900;


const BRAND_OPTIONS = [
  "Hikvision",
  "Dahua",
  "Ezviz",
  "Imou",
  "HiLook",
  "Tenda",
  "TP-Link",
  "Western Digital",
  "Seagate",
  "Genérica",
];

const CATEGORY_OPTIONS = [
  "Cámaras",
  "Grabadores",
  "Almacenamiento",
  "Redes",
  "Energía",
  "Accesorios",
];

const SUBCATEGORY_OPTIONS: Record<string, string[]> = {
  Cámaras: ["Domo", "Bullet", "PTZ", "Solar", "Pinhole"],
  Grabadores: ["DVR", "XVR", "NVR"],
  Almacenamiento: ["Disco duro", "MicroSD", "SSD"],
  Redes: ["Router", "Switch", "Access Point", "Cable UTP", "Patch Cord", "Fibra óptica"],
  Energía: ["Fuente", "UPS", "Regulador"],
  Accesorios: ["Balun", "Jack DC", "Caja de paso", "Bornera", "Cable"],
};

const normalizeText = (text: string | null | undefined) => {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

const slugify = (text: string) => {
  return normalizeText(text)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const calculateSuggestedSalePrice = (
  cost: number,
  desiredMargin: number,
  includeWompiFee: boolean,
  taxMultiplier = 1
) => {
  if (cost <= 0 || desiredMargin <= 0) return 0;

  const marginRate = desiredMargin / 100;

  if (marginRate >= 0.95) return 0;

  if (!includeWompiFee) {
    return Math.ceil(cost / (1 - marginRate));
  }

  const denominator = 1 - marginRate - WOMPI_FEE_RATE * taxMultiplier;

  if (denominator <= 0) return 0;

  return Math.ceil((cost + WOMPI_FIXED_FEE) / denominator);
};

const roundPriceToHundred = (value: number) => {
  if (value <= 0) return 0;
  return Math.ceil(value / 100) * 100;
};


const detectCategoryFromText = (text: string) => {
  const value = normalizeText(text);

  if (
    value.includes("camara") ||
    value.includes("domo") ||
    value.includes("bullet") ||
    value.includes("ptz") ||
    value.includes("solar") ||
    value.includes("pinhole")
  ) {
    return "Cámaras";
  }

  if (
    value.includes("dvr") ||
    value.includes("xvr") ||
    value.includes("nvr") ||
    value.includes("grabador")
  ) {
    return "Grabadores";
  }

  if (
    value.includes("disco") ||
    value.includes("micro") ||
    value.includes("sd") ||
    value.includes("ssd") ||
    value.includes("almacenamiento")
  ) {
    return "Almacenamiento";
  }

  if (
    value.includes("router") ||
    value.includes("switch") ||
    value.includes("access") ||
    value.includes("red") ||
    value.includes("utp") ||
    value.includes("patch cord") ||
    value.includes("fibra") ||
    value.includes("cable de red") ||
    value.includes("cable utp")
  ) {
    return "Redes";
  }

  if (
    value.includes("fuente") ||
    value.includes("ups") ||
    value.includes("regulador") ||
    value.includes("energia")
  ) {
    return "Energía";
  }

  if (
    value.includes("balun") ||
    value.includes("jack") ||
    value.includes("caja") ||
    value.includes("bornera") ||
    value.includes("accesorio")
  ) {
    return "Accesorios";
  }

  return "all";
};

const detectCategoryAndSubcategoryFromText = (text: string) => {
  const value = normalizeText(text);

  if (value.includes("domo")) {
    return { category: "Cámaras", subcategory: "Domo" };
  }

  if (value.includes("bullet")) {
    return { category: "Cámaras", subcategory: "Bullet" };
  }

  if (value.includes("ptz")) {
    return { category: "Cámaras", subcategory: "PTZ" };
  }

  if (value.includes("solar")) {
    return { category: "Cámaras", subcategory: "Solar" };
  }

  if (value.includes("pinhole")) {
    return { category: "Cámaras", subcategory: "Pinhole" };
  }

  if (value.includes("camara")) {
    return { category: "Cámaras", subcategory: "Domo" };
  }

  if (value.includes("dvr")) {
    return { category: "Grabadores", subcategory: "DVR" };
  }

  if (value.includes("xvr")) {
    return { category: "Grabadores", subcategory: "XVR" };
  }

  if (value.includes("nvr")) {
    return { category: "Grabadores", subcategory: "NVR" };
  }

  if (value.includes("disco")) {
    return { category: "Almacenamiento", subcategory: "Disco duro" };
  }

  if (value.includes("micro") || value.includes("sd")) {
    return { category: "Almacenamiento", subcategory: "MicroSD" };
  }

  if (value.includes("ssd")) {
    return { category: "Almacenamiento", subcategory: "SSD" };
  }

  if (value.includes("router")) {
    return { category: "Redes", subcategory: "Router" };
  }

  if (value.includes("switch")) {
    return { category: "Redes", subcategory: "Switch" };
  }

  if (value.includes("access")) {
    return { category: "Redes", subcategory: "Access Point" };
  }

  if (
    value.includes("utp") ||
    value.includes("cable utp") ||
    value.includes("cable de red")
  ) {
    return { category: "Redes", subcategory: "Cable UTP" };
  }

  if (value.includes("patch cord")) {
    return { category: "Redes", subcategory: "Patch Cord" };
  }

  if (value.includes("fibra")) {
    return { category: "Redes", subcategory: "Fibra óptica" };
  }

  if (value.includes("fuente")) {
    return { category: "Energía", subcategory: "Fuente" };
  }

  if (value.includes("ups")) {
    return { category: "Energía", subcategory: "UPS" };
  }

  if (value.includes("regulador")) {
    return { category: "Energía", subcategory: "Regulador" };
  }

  if (value.includes("balun")) {
    return { category: "Accesorios", subcategory: "Balun" };
  }

  if (value.includes("jack")) {
    return { category: "Accesorios", subcategory: "Jack DC" };
  }

  if (value.includes("caja")) {
    return { category: "Accesorios", subcategory: "Caja de paso" };
  }

  if (value.includes("bornera")) {
    return { category: "Accesorios", subcategory: "Bornera" };
  }

  if (
    value.includes("cable poder") ||
    value.includes("cable energia") ||
    value.includes("cable camara")
  ) {
    return { category: "Accesorios", subcategory: "Cable" };
  }

  return { category: "", subcategory: "" };
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
  const [taxMode, setTaxMode] = useState<TaxMode>("sin_iva");
  const [taxRate, setTaxRate] = useState(IVA_RATE);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    document.documentElement.setAttribute("translate", "no");
    document.body.classList.add("notranslate");

    return () => {
      document.body.classList.remove("notranslate");
    };
  }, []);

  useEffect(() => {
    const loadBusinessSettings = async () => {
      const { data, error } = await supabase
        .from("business_settings")
        .select("tax_mode, tax_rate")
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error cargando configuración fiscal:", error.message);
        setTaxMode("sin_iva");
        setTaxRate(IVA_RATE);
        return;
      }

      const settings = data as BusinessSettings | null;
      const nextTaxMode: TaxMode =
        settings?.tax_mode === "con_iva" ? "con_iva" : "sin_iva";
      const nextTaxRate = Number(settings?.tax_rate ?? 19) / 100;

      setTaxMode(nextTaxMode);
      setTaxRate(Number.isNaN(nextTaxRate) ? IVA_RATE : nextTaxRate);
    };

    loadBusinessSettings();
  }, []);

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
        "id, name, slug, sku, brand, category, subcategory, price, cost_price, description, image_url, stock, has_offer, offer_price, offer_label, created_at"
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

      if (field === "name") {
        const detected = detectCategoryAndSubcategoryFromText(String(value));

        if (!isEditing && !hasManualSlugEdit) {
          updated.slug = slugify(String(value));
        }

        if (detected.category && detected.subcategory) {
          updated.category = detected.category;
          updated.subcategory = detected.subcategory;
        }
      }

      return updated;
    });
  };

  const handleCategoryChange = (value: string) => {
    const firstSubcategory = SUBCATEGORY_OPTIONS[value]?.[0] ?? "";

    setForm((prev) => ({
      ...prev,
      category: value,
      subcategory: firstSubcategory,
    }));
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    const detectedCategory = detectCategoryFromText(value);

    if (detectedCategory !== "all") {
      setSelectedCategory(detectedCategory);
    }

    if (!value.trim()) {
      setSelectedCategory("all");
    }
  };

  const handleCategoryFilterChange = (value: string) => {
    const detectedCategory = detectCategoryFromText(searchTerm);

    if (
      searchTerm.trim() &&
      detectedCategory !== "all" &&
      value !== detectedCategory
    ) {
      setSelectedCategory(detectedCategory);
      showToast(
        "error",
        `La búsqueda actual corresponde a ${detectedCategory}. Ajusté el filtro automáticamente.`
      );
      return;
    }

    setSelectedCategory(value);
  };

  const handleSlugChange = (value: string) => {
    setHasManualSlugEdit(true);

    setForm((prev) => ({
      ...prev,
      slug: slugify(value),
    }));
  };


  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("error", "Solo puedes subir archivos de imagen.");
      return;
    }

    try {
      setIsUploadingImage(true);

      const fileExt = file.name.split(".").pop()?.toLowerCase() || "webp";
      const safeSlug = form.slug.trim() || slugify(form.name || "producto");
      const fileName = `${safeSlug}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      handleChange("image_url", data.publicUrl);
      showToast("success", "Imagen subida correctamente.");
    } catch (error) {
      console.error("Upload image error:", error);
      showToast("error", "No fue posible subir la imagen.");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) return "El nombre es obligatorio.";
    if (!form.slug.trim()) return "La URL amigable es obligatoria.";
    if (!form.sku.trim()) return "El SKU es obligatorio.";
    if (!form.brand.trim()) return "La marca es obligatoria.";
    if (!form.category.trim()) return "La categoría es obligatoria.";
    if (!form.subcategory.trim()) return "La subcategoría es obligatoria.";
    if (!form.price.trim()) return "El precio es obligatorio.";
    if (!form.cost_price.trim()) return "El costo del producto es obligatorio.";

    if (Number.isNaN(Number(form.price))) return "El precio debe ser numérico.";
    if (Number.isNaN(Number(form.cost_price))) return "El costo del producto debe ser numérico.";
    if (Number.isNaN(Number(form.stock))) return "El stock debe ser numérico.";

    if (Number(form.cost_price) < 0) return "El costo del producto no puede ser negativo.";
    if (Number(form.price) < 0) return "El precio no puede ser negativo.";

    const allowedSubcategories = SUBCATEGORY_OPTIONS[form.category] ?? [];

    if (
      allowedSubcategories.length > 0 &&
      !allowedSubcategories.includes(form.subcategory)
    ) {
      return "La subcategoría no corresponde a la categoría seleccionada.";
    }

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
      price: Math.round(Number(form.price)),
      cost_price: Math.round(Number(form.cost_price)),
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      stock: Math.round(Number(form.stock)),
      has_offer: form.has_offer,
      offer_price:
        form.has_offer && form.offer_price.trim()
          ? Math.round(Number(form.offer_price))
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
      const { data: insertedProduct, error } = await supabase
        .from("products")
        .insert(payload)
        .select(
          "id, name, slug, sku, brand, category, subcategory, price, cost_price, description, image_url, stock, has_offer, offer_price, offer_label, created_at"
        )
        .single();

      if (error) {
        console.error("Insert product error:", error);
        setFormError(error.message || "No fue posible crear el producto.");
        showToast("error", "No fue posible crear el producto.");
        setIsSaving(false);
        return;
      }

      if (!insertedProduct) {
        const message =
          "Supabase no devolvió el producto creado. Revisa permisos RLS o configuración de la tabla.";
        setFormError(message);
        showToast("error", message);
        setIsSaving(false);
        return;
      }

      setProducts((currentProducts) => [
        insertedProduct as ProductRow,
        ...currentProducts,
      ]);

      showToast("success", "Producto creado correctamente.");
    }

    await fetchProducts();
    resetForm();
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
      cost_price: String(product.cost_price ?? 0),
      desired_margin: "30",
      include_wompi_fee_in_price: false,
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

  const getSalePrice = (product: ProductRow) => {
    const regularPrice = Number(product.price ?? 0);
    const offerPrice = Number(product.offer_price ?? 0);

    if (product.has_offer && offerPrice > 0) {
      return offerPrice;
    }

    return regularPrice;
  };

  const getCostPrice = (product: ProductRow) => {
    const cost = Number(product.cost_price ?? 0);
    return Number.isNaN(cost) ? 0 : cost;
  };

  const getGrossProfit = (product: ProductRow) => {
    return getSalePrice(product) - getCostPrice(product);
  };

  const getCommercialMargin = (product: ProductRow) => {
    const salePrice = getSalePrice(product);

    if (salePrice <= 0) return 0;

    return (getGrossProfit(product) / salePrice) * 100;
  };

  const getMarginClass = (margin: number) => {
    if (margin < 15) return "bg-red-100 text-red-700";
    if (margin < 30) return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getNormalizedText = (value: string | null | undefined) =>
    normalizeText(value);

  const getStockValue = (value: number | string | null) => {
    const numericValue = Number(value ?? 0);
    return Number.isNaN(numericValue) ? 0 : numericValue;
  };

  const getSortValue = (product: ProductRow, key: SortKey) => {
    switch (key) {
      case "price":
        return Number(product.price ?? 0);
      case "cost_price":
        return getCostPrice(product);
      case "profit":
        return getGrossProfit(product);
      case "margin":
        return getCommercialMargin(product);
      case "stock":
        return getStockValue(product.stock);
      case "offer":
        return product.has_offer ? 1 : 0;
      case "name":
        return getNormalizedText(product.name);
      case "sku":
        return getNormalizedText(product.sku);
      case "brand":
        return getNormalizedText(product.brand);
      case "category":
        return getNormalizedText(product.category);
      default:
        return "";
    }
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
        [...BRAND_OPTIONS, ...products.map((product) => product.brand?.trim())]
          .filter((brand): brand is string => Boolean(brand))
      )
    ).sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(
        [
          ...CATEGORY_OPTIONS,
          ...products.map((product) => product.category?.trim()),
        ].filter((category): category is string => Boolean(category))
      )
    ).sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);

  const formSubcategoryOptions = useMemo(() => {
    return SUBCATEGORY_OPTIONS[form.category] ?? [];
  }, [form.category]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const forcedCategory = detectCategoryFromText(searchTerm);

    return products.filter((product) => {
      const productCategory = product.category ?? "";

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

      const matchesForcedCategory =
        forcedCategory === "all" || productCategory === forcedCategory;

      const matchesBrand =
        selectedBrand === "all" || (product.brand ?? "") === selectedBrand;

      const matchesCategory =
        selectedCategory === "all" || productCategory === selectedCategory;

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
        matchesForcedCategory &&
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

  const formPrice = Number(form.price || 0);
  const formCostPrice = Number(form.cost_price || 0);
  const desiredMarginValue = Number(form.desired_margin || 0);
  const wompiTaxMultiplier = taxMode === "con_iva" ? 1 + taxRate : 1;
  const suggestedSalePrice = roundPriceToHundred(
    calculateSuggestedSalePrice(
      formCostPrice,
      desiredMarginValue,
      form.include_wompi_fee_in_price,
      wompiTaxMultiplier
    )
  );
  const formOfferPrice = Number(form.offer_price || 0);
  const formEffectiveSalePrice =
    form.has_offer && formOfferPrice > 0 ? formOfferPrice : formPrice;

  // En este proyecto el precio del producto se guarda como base comercial.
  // Si la configuración fiscal está con IVA, el checkout calcula el IVA aparte.
  // Por eso la rentabilidad se calcula sobre el precio base, no sobre el total con IVA.
  const formTaxAmount =
    taxMode === "con_iva" ? Math.round(formEffectiveSalePrice * taxRate) : 0;
  const formCustomerTotalWithTax = formEffectiveSalePrice + formTaxAmount;

  const formPaymentGatewayCost =
    form.include_wompi_fee_in_price && formEffectiveSalePrice > 0
      ? Math.round(formCustomerTotalWithTax * WOMPI_FEE_RATE + WOMPI_FIXED_FEE)
      : 0;

  const formAccountingRevenue = formEffectiveSalePrice;
  const formNetRevenueAfterGateway =
    formAccountingRevenue - formPaymentGatewayCost;
  const formContributionProfit =
    formNetRevenueAfterGateway - formCostPrice;
  const formRealMargin =
    formAccountingRevenue > 0
      ? (formContributionProfit / formAccountingRevenue) * 100
      : 0;
  const breakEvenPrice = form.include_wompi_fee_in_price
    ? roundPriceToHundred(
        Math.ceil(
          (formCostPrice + WOMPI_FIXED_FEE) /
            (1 - WOMPI_FEE_RATE * (1 + (taxMode === "con_iva" ? taxRate : 0)))
        )
      )
    : formCostPrice;
  const priceSafetyMargin = formEffectiveSalePrice - breakEvenPrice;
  const formDiscountValue =
    form.has_offer && formOfferPrice > 0 ? formPrice - formOfferPrice : 0;
  const formDiscountPercent =
    form.has_offer && formPrice > 0 && formOfferPrice > 0
      ? (formDiscountValue / formPrice) * 100
      : 0;
  const isFormLoss = formContributionProfit < 0;
  const isFormLowMargin = !isFormLoss && formRealMargin < 15;
  const isFormHealthyMargin = formRealMargin >= 30;

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
    <section
      translate="no"
      className="notranslate relative mx-auto max-w-7xl px-4 py-10 md:py-12"
    >
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

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] p-6 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
            Panel administrador
          </p>

          <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            Gestión de productos ADDA Seguridad
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100 md:text-base">
            Crea, edita, controla stock, valida rentabilidad y configura ofertas del catálogo.
          </p>
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
          className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nombre
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Ej: Cámara domo Dahua 1080p"
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
              placeholder="Ej: camara-domo-dahua-1080p"
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
              placeholder="Ej: CAM-DH-D-001"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Marca
            </label>
            <select
              value={form.brand}
              onChange={(e) => handleChange("brand", e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            >
              <option value="">Selecciona una marca</option>
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
              value={form.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            >
              <option value="">Selecciona una categoría</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Subcategoría
            </label>
            <select
              value={form.subcategory}
              onChange={(e) => handleChange("subcategory", e.target.value)}
              disabled={!form.category}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">
                {form.category
                  ? "Selecciona una subcategoría"
                  : "Primero selecciona una categoría"}
              </option>
              {formSubcategoryOptions.map((subcategory) => (
                <option key={subcategory} value={subcategory}>
                  {subcategory}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Precio de venta
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={form.price}
              onChange={(e) => handleChange("price", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Costo del producto
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={form.cost_price}
              onChange={(e) => handleChange("cost_price", e.target.value)}
              placeholder="Costo real de compra"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            />
            <p className="mt-1 text-xs text-slate-500">
              Base para utilidad bruta y margen comercial.
            </p>
          </div>

          <div className="rounded-2xl border border-[#2D5398]/15 bg-[#2D5398]/5 p-5 md:col-span-2 xl:col-span-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Precio inteligente PRO
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Define el precio desde el costo, el margen objetivo y la
                  decisión de absorber la pasarela dentro de un precio único.
                </p>
              </div>

              <span className="inline-flex w-fit rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#2D5398] shadow-sm">
                Precio único para cliente
              </span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Margen deseado %
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="90"
                  value={form.desired_margin}
                  onChange={(e) =>
                    handleChange("desired_margin", e.target.value)
                  }
                  placeholder="Ej: 30"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
                />
              </div>

              <label className="flex min-h-[74px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.include_wompi_fee_in_price}
                  onChange={(e) =>
                    handleChange(
                      "include_wompi_fee_in_price",
                      e.target.checked
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                Absorber costo Wompi en el precio sugerido
              </label>

              <article className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Precio sugerido
                </p>
                <p className="mt-2 text-2xl font-bold text-[#2D5398]">
                  {formatPrice(suggestedSalePrice)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {form.include_wompi_fee_in_price
                    ? "Incluye costo variable de pasarela."
                    : "Calculado solo con margen comercial."}
                </p>
              </article>

              <button
                type="button"
                disabled={suggestedSalePrice <= 0}
                onClick={() =>
                  handleChange("price", String(suggestedSalePrice))
                }
                className="inline-flex min-h-[74px] items-center justify-center rounded-xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Aplicar precio sugerido
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2 xl:col-span-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Análisis de rentabilidad del producto
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Lectura contable del precio actual u oferta activa. El IVA no se trata como ingreso; si está activo, se calcula aparte para el cliente.
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-bold ${
                  isFormLoss
                    ? "bg-red-100 text-red-700"
                    : isFormLowMargin
                    ? "bg-amber-100 text-amber-700"
                    : isFormHealthyMargin
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-blue-100 text-[#2D5398]"
                }`}
              >
                {isFormLoss
                  ? "Riesgo de pérdida"
                  : isFormLowMargin
                  ? "Margen bajo"
                  : isFormHealthyMargin
                  ? "Rentable"
                  : "En evaluación"}
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <article className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Base de venta sin IVA
                </p>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {formatPrice(formAccountingRevenue)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Precio del producto usado para margen. El IVA se calcula aparte si está activo.
                </p>
              </article>

              <article className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  IVA al cliente
                </p>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {formatPrice(formTaxAmount)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {taxMode === "con_iva"
                    ? "Se suma en checkout, no afecta utilidad."
                    : "Configuración actual sin IVA."}
                </p>
              </article>

              <article className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Costo variable pasarela
                </p>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {formatPrice(formPaymentGatewayCost)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {form.include_wompi_fee_in_price
                    ? "Estimado con 3.2% + $900 sobre el total pagado por el cliente."
                    : "No se descuenta en este escenario."}
                </p>
              </article>

              <article className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Utilidad contributiva
                </p>
                <p
                  className={`mt-2 text-xl font-bold ${
                    formContributionProfit < 0
                      ? "text-red-700"
                      : "text-emerald-700"
                  }`}
                >
                  {formatPrice(formContributionProfit)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Después de costo de compra y pasarela.
                </p>
              </article>

              <article className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Margen real
                </p>
                <p
                  className={`mt-2 text-xl font-bold ${
                    isFormLoss
                      ? "text-red-700"
                      : isFormLowMargin
                      ? "text-amber-700"
                      : "text-emerald-700"
                  }`}
                >
                  {formatPercent(formRealMargin)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Utilidad contributiva / base de venta sin IVA.
                </p>
              </article>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Precio mínimo sin pérdida
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatPrice(breakEvenPrice)}
                </p>
                <p
                  className={`mt-2 text-sm font-semibold ${
                    priceSafetyMargin < 0 ? "text-red-700" : "text-emerald-700"
                  }`}
                >
                  Colchón frente al mínimo: {formatPrice(priceSafetyMargin)}
                </p>
              </article>

              <article
                className={`rounded-2xl p-4 text-sm leading-6 ${
                  isFormLoss
                    ? "bg-red-50 text-red-700"
                    : isFormLowMargin
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {isFormLoss ? (
                  <p>
                    Contablemente no conviene: el precio evaluado no cubre el
                    costo de compra y los costos variables asociados a la venta.
                  </p>
                ) : isFormLowMargin ? (
                  <p>
                    Operación viable, pero con margen bajo. Antes de aprobar
                    descuentos revisa garantía, logística, empaque y gastos
                    operativos para no afectar la utilidad neta.
                  </p>
                ) : (
                  <p>
                    Escenario saludable: el producto conserva utilidad después
                    del costo de compra y la pasarela absorbida. La utilidad neta
                    final dependerá de gastos operativos, logística e impuestos.
                  </p>
                )}

                {form.has_offer && formOfferPrice > 0 && (
                  <p className="mt-3 font-semibold">
                    Oferta activa: descuento de {formatPrice(formDiscountValue)}
                    ({formatPercent(formDiscountPercent)}). El análisis ya está
                    evaluando el precio de oferta.
                  </p>
                )}
              </article>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:col-span-2 xl:col-span-3">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">Oferta del producto</h3>
              <p className="mt-1 text-sm text-slate-500">Actívala solo si el análisis de rentabilidad mantiene utilidad positiva.</p>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.has_offer}
                  onChange={(e) => handleChange("has_offer", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Activar oferta segura
              </label>

              {form.has_offer && (
                <>
                  <input
                    type="number"
                    step="1"
                    min="0"
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


          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Stock
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={form.stock}
              onChange={(e) => handleChange("stock", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            />
          </div>

          <div className="md:col-span-2 xl:col-span-3">
            <label className="mb-3 block text-sm font-medium text-slate-700">
              Imagen del producto
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                <div className="flex-1">
                  <label className="flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-[#2D5398]/30 bg-white px-6 py-8 text-center transition hover:border-[#2D5398] hover:bg-[#2D5398]/5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                    />

                    <div>
                      <p className="text-sm font-semibold text-[#2D5398]">
                        {isUploadingImage
                          ? "Subiendo imagen..."
                          : "Seleccionar imagen"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        JPG, PNG o WEBP. La URL se guardará automáticamente.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-center">
                  <div className="h-36 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <img
                      src={
                        form.image_url.trim()
                          ? form.image_url
                          : "/placeholder-product.png"
                      }
                      alt="Vista previa del producto"
                      className="h-full w-full object-contain p-3"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-product.png";
                      }}
                    />
                  </div>
                </div>
              </div>

              {form.image_url && (
                <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
                  Imagen conectada correctamente.
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 xl:col-span-3">
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

          <div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-3">
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
                onChange={(e) => handleSearchChange(e.target.value)}
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
                onChange={(e) => handleCategoryFilterChange(e.target.value)}
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
                      <SortButton label="Costo" sort="cost_price" />
                    </th>
                    <th className="px-3 py-2">
                      <SortButton label="Utilidad" sort="profit" />
                    </th>
                    <th className="px-3 py-2">
                      <SortButton label="Margen" sort="margin" />
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
                    const grossProfit = getGrossProfit(product);
                    const commercialMargin = getCommercialMargin(product);

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
                          {formatPrice(product.cost_price)}
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`font-semibold ${
                              grossProfit < 0 ? "text-red-700" : "text-emerald-700"
                            }`}
                          >
                            {formatPrice(grossProfit)}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getMarginClass(
                              commercialMargin
                            )}`}
                          >
                            {formatPercent(commercialMargin)}
                          </span>
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
                const grossProfit = getGrossProfit(product);
                const commercialMargin = getCommercialMargin(product);

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

                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Costo
                          </p>
                          <p className="mt-1 font-semibold text-slate-700">
                            {formatPrice(product.cost_price)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Utilidad
                          </p>
                          <p
                            className={`mt-1 font-semibold ${
                              grossProfit < 0 ? "text-red-700" : "text-emerald-700"
                            }`}
                          >
                            {formatPrice(grossProfit)}
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

                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getMarginClass(
                            commercialMargin
                          )}`}
                        >
                          Margen: {formatPercent(commercialMargin)}
                        </span>

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