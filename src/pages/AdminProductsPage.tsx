import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { supabaseAdmin } from "../lib/supabase";

type ProductClassification =
  | "equipment"
  | "supplied_material"
  | "installation_consumable"
  | "internal_cost";

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
  sale_unit: string | null;
  public_sale_unit: string | null;
  quote_unit: string | null;
  purchase_unit: string | null;
  unit_content: number | string | null;
  quote_by_unit: boolean | null;
  has_offer: boolean | null;
  offer_price: number | string | null;
  offer_label: string | null;
  product_classification: ProductClassification | null;
  public_group: string | null;
  visible_to_customer: boolean | null;
  created_at: string | null;
};

type ProductForm = {
  name: string;
  slug: string;
  sku: string;
  brand: string;
  category: string;
  subcategory: string;
  product_classification: ProductClassification;
  price: string;
  cost_price: string;
  desired_margin: string;
  include_wompi_fee_in_price: boolean;
  description: string;
  image_url: string;
  stock: string;
  public_sale_unit: string;
  quote_unit: string;
  purchase_unit: string;
  unit_content: string;
  quote_by_unit: boolean;
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

type TechnicalSheetMedia = {
  id: string;
  product_id: string;
  media_type: string;
  media_role: string;
  file_url: string;
  file_path: string | null;
  sort_order: number | null;
};

const initialForm: ProductForm = {
  name: "",
  slug: "",
  sku: "",
  brand: "",
  category: "",
  subcategory: "",
  product_classification: "equipment",
  price: "",
  cost_price: "0",
  desired_margin: "30",
  include_wompi_fee_in_price: false,
  description: "",
  image_url: "",
  stock: "0",
  public_sale_unit: "unidad",
  quote_unit: "unidad",
  purchase_unit: "unidad",
  unit_content: "1",
  quote_by_unit: false,
  has_offer: false,
  offer_price: "",
  offer_label: "",
};

const LOW_STOCK_THRESHOLD = 5;
const IVA_RATE = 0.19;
const WOMPI_FEE_RATE = 0.032;
const WOMPI_FIXED_FEE = 900;

const INSTALLATION_SERVICES_GROUP = "installation_services_consumables";

const PRODUCT_CLASSIFICATION_OPTIONS: Array<{
  value: ProductClassification;
  label: string;
  description: string;
}> = [
  {
    value: "equipment",
    label: "Equipo principal",
    description: "Visible en PDF con precio y descripción individual.",
  },
  {
    value: "supplied_material",
    label: "Material suministrado",
    description: "Visible en PDF como material relevante del proyecto.",
  },
  {
    value: "installation_consumable",
    label: "Instalación y consumibles",
    description: "Se agrupa en servicios de instalación y materiales consumibles.",
  },
  {
    value: "internal_cost",
    label: "Costo interno no visible",
    description: "Afecta costo, utilidad y margen, pero no aparece al cliente.",
  },
];

const getProductClassificationMeta = (classification?: string | null) => {
  return (
    PRODUCT_CLASSIFICATION_OPTIONS.find(
      (option) => option.value === classification
    ) ?? PRODUCT_CLASSIFICATION_OPTIONS[0]
  );
};

const getProductVisibilityConfig = (
  classification: ProductClassification
): { public_group: string | null; visible_to_customer: boolean } => {
  if (classification === "installation_consumable") {
    return {
      public_group: INSTALLATION_SERVICES_GROUP,
      visible_to_customer: false,
    };
  }

  if (classification === "internal_cost") {
    return {
      public_group: null,
      visible_to_customer: false,
    };
  }

  return {
    public_group: null,
    visible_to_customer: true,
  };
};

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
  "CCTV",
  "Canalización",
  "Cableado estructurado",
  "Energía",
  "Consumibles",
  "Servicios técnicos",
  "Montaje",
  "Costos internos",
];

const SUBCATEGORY_OPTIONS: Record<string, string[]> = {
  CCTV: [
    "Bullet",
    "Domo",
    "Cámaras WiFi",
    "Cámaras especiales",
    "NVR",
    "XVR",
    "Disco duro",
    "MicroSD",
    "Balun",
    "Video y conectividad",
  ],
  Canalización: [
    "Accesorios de canalización",
    "PVC",
    "Cajas de paso",
    "Canaletas",
    "Racks",
  ],
  "Cableado estructurado": [
    "Cable UTP",
    "Conectores RJ45",
    "Patch Cord",
    "Accesorios de red",
  ],
  Energía: [
    "Borneras",
    "Fuentes",
    "UPS",
    "Estabilizadores",
    "Cableado eléctrico",
    "Tomas y multitomas",
    "Cinta aislante",
  ],
  Consumibles: [
    "Fijación",
    "Conectividad",
    "Protección",
    "Soldadura",
    "Consumibles generales",
  ],
  "Servicios técnicos": [
    "Auxiliar técnico",
    "Auxiliar alturas",
    "Limpieza",
    "Servicio eléctrico",
  ],
  Montaje: ["Brazo expansor"],
  "Costos internos": [
    "Transporte",
    "Combustible",
    "Peajes",
    "Viáticos",
    "Parqueaderos",
    "Logística",
  ],
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


type ProportionalPricingInput = {
  price: number | string | null | undefined;
  costPrice: number | string | null | undefined;
  unitContent: number | string | null | undefined;
  quoteByUnit: boolean | null | undefined;
};

type ProportionalPricingResult = {
  isProportional: boolean;
  unitContent: number;
  unitSalePrice: number;
  unitCostPrice: number;
  unitProfit: number;
  unitMargin: number;
};

const toSafeNumber = (value: number | string | null | undefined) => {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const calculateProportionalPricing = ({
  price,
  costPrice,
  unitContent,
  quoteByUnit,
}: ProportionalPricingInput): ProportionalPricingResult => {
  const safePrice = toSafeNumber(price);
  const safeCostPrice = toSafeNumber(costPrice);
  const safeUnitContent = toSafeNumber(unitContent);
  const isProportional = Boolean(quoteByUnit) && safeUnitContent > 0;

  const unitSalePrice = isProportional
    ? safePrice / safeUnitContent
    : safePrice;

  const unitCostPrice = isProportional
    ? safeCostPrice / safeUnitContent
    : safeCostPrice;

  const unitProfit = unitSalePrice - unitCostPrice;
  const unitMargin =
    unitSalePrice > 0 ? (unitProfit / unitSalePrice) * 100 : 0;

  return {
    isProportional,
    unitContent: safeUnitContent,
    unitSalePrice,
    unitCostPrice,
    unitProfit,
    unitMargin,
  };
};

const calculateProportionalSubtotal = (
  quantity: number | string | null | undefined,
  unitSalePrice: number
) => {
  const safeQuantity = toSafeNumber(quantity);
  return safeQuantity * unitSalePrice;
};

const calculateProportionalTotalCost = (
  quantity: number | string | null | undefined,
  unitCostPrice: number
) => {
  const safeQuantity = toSafeNumber(quantity);
  return safeQuantity * unitCostPrice;
};


const detectCategoryFromText = (text: string) => {
  const value = normalizeText(text);

  if (
    value.includes("camara") ||
    value.includes("dahua") ||
    value.includes("hikvision") ||
    value.includes("domo") ||
    value.includes("bullet") ||
    value.includes("ptz") ||
    value.includes("solar") ||
    value.includes("ranger") ||
    value.includes("cruiser") ||
    value.includes("ojo de pez") ||
    value.includes("dvr") ||
    value.includes("xvr") ||
    value.includes("nvr") ||
    value.includes("grabador") ||
    value.includes("disco") ||
    value.includes("microsd") ||
    value.includes("micro sd") ||
    value.includes("balun") ||
    value.includes("hdmi") ||
    value.includes("vga")
  ) {
    return "CCTV";
  }

  if (
    value.includes("canaleta") ||
    value.includes("tuberia") ||
    value.includes("tubo") ||
    value.includes("pvc") ||
    value.includes("emt") ||
    value.includes("rack") ||
    value.includes("gabinete") ||
    value.includes("caja de paso") ||
    value.includes("caja electrica") ||
    value.includes("brazo expansor") ||
    value.includes("poste") ||
    value.includes("posteria")
  ) {
    return "Canalización";
  }

  if (
    value.includes("utp") ||
    value.includes("cat5") ||
    value.includes("cat6") ||
    value.includes("rj45") ||
    value.includes("patch cord") ||
    value.includes("fibra") ||
    value.includes("router") ||
    value.includes("switch") ||
    value.includes("access point") ||
    value.includes("repetidor")
  ) {
    return "Cableado estructurado";
  }

  if (
    value.includes("fuente") ||
    value.includes("ups") ||
    value.includes("estabilizador") ||
    value.includes("regulador") ||
    value.includes("energia") ||
    value.includes("eléctrico") ||
    value.includes("electrico") ||
    value.includes("bornera") ||
    value.includes("multitoma") ||
    value.includes("toma macho") ||
    value.includes("toma hembra") ||
    value.includes("cable duplex") ||
    value.includes("cable dúplex") ||
    value.includes("cable neopreno")
  ) {
    return "Energía";
  }

  if (
    value.includes("abrazadera") ||
    value.includes("tornillo") ||
    value.includes("chazo") ||
    value.includes("cinta") ||
    value.includes("termoencogible") ||
    value.includes("soldadura") ||
    value.includes("terminal") ||
    value.includes("bonera")
  ) {
    return "Consumibles";
  }

  if (
    value.includes("auxiliar") ||
    value.includes("mano de obra") ||
    value.includes("servicio tecnico") ||
    value.includes("servicio técnico") ||
    value.includes("mantenimiento") ||
    value.includes("limpieza")
  ) {
    return "Servicios técnicos";
  }

  if (value.includes("brazo") || value.includes("soporte") || value.includes("herraje")) {
    return "Montaje";
  }

  if (
    value.includes("transporte") ||
    value.includes("combustible") ||
    value.includes("peaje") ||
    value.includes("viatico") ||
    value.includes("viático") ||
    value.includes("parqueadero") ||
    value.includes("logistica") ||
    value.includes("logística")
  ) {
    return "Costos internos";
  }

  return "all";
};

const detectCategoryAndSubcategoryFromText = (text: string) => {
  const value = normalizeText(text);

  if (value.includes("bullet") || value.includes("bala")) {
    return { category: "CCTV", subcategory: "Bullet" };
  }

  if (value.includes("domo") || value.includes("torreta")) {
    return { category: "CCTV", subcategory: "Domo" };
  }

  if (
    value.includes("ranger") ||
    value.includes("cruiser") ||
    value.includes("wifi") ||
    value.includes("wi-fi")
  ) {
    return { category: "CCTV", subcategory: "Cámaras WiFi" };
  }

  if (
    value.includes("ptz") ||
    value.includes("ojo de pez") ||
    value.includes("solar")
  ) {
    return { category: "CCTV", subcategory: "Cámaras especiales" };
  }

  if (value.includes("camara")) {
    return { category: "CCTV", subcategory: "Bullet" };
  }

  if (value.includes("nvr")) {
    return { category: "CCTV", subcategory: "NVR" };
  }

  if (value.includes("dvr") || value.includes("xvr")) {
    return { category: "CCTV", subcategory: "XVR" };
  }

  if (value.includes("disco")) {
    return { category: "CCTV", subcategory: "Disco duro" };
  }

  if (value.includes("microsd") || value.includes("micro sd")) {
    return { category: "CCTV", subcategory: "MicroSD" };
  }

  if (value.includes("balun")) {
    return { category: "CCTV", subcategory: "Balun" };
  }

  if (value.includes("hdmi") || value.includes("vga")) {
    return { category: "CCTV", subcategory: "Video y conectividad" };
  }

  if (value.includes("canaleta")) {
    return { category: "Canalización", subcategory: "Canaletas" };
  }

  if (value.includes("pvc") || value.includes("tuberia") || value.includes("tubo")) {
    return { category: "Canalización", subcategory: "PVC" };
  }

  if (value.includes("caja")) {
    return { category: "Canalización", subcategory: "Cajas de paso" };
  }

  if (value.includes("rack") || value.includes("gabinete")) {
    return { category: "Canalización", subcategory: "Racks" };
  }

  if (
    value.includes("abrazadera") ||
    value.includes("broca") ||
    value.includes("puntilla") ||
    value.includes("kit tension") ||
    value.includes("kit tensión") ||
    value.includes("espiral")
  ) {
    return {
      category: "Canalización",
      subcategory: "Accesorios de canalización",
    };
  }

  if (
    value.includes("utp") ||
    value.includes("cat5") ||
    value.includes("cat6") ||
    value.includes("cable de red")
  ) {
    return { category: "Cableado estructurado", subcategory: "Cable UTP" };
  }

  if (value.includes("rj45")) {
    return {
      category: "Cableado estructurado",
      subcategory: "Conectores RJ45",
    };
  }

  if (value.includes("patch cord")) {
    return { category: "Cableado estructurado", subcategory: "Patch Cord" };
  }

  if (
    value.includes("router") ||
    value.includes("switch") ||
    value.includes("access") ||
    value.includes("repetidor") ||
    value.includes("capucha")
  ) {
    return {
      category: "Cableado estructurado",
      subcategory: "Accesorios de red",
    };
  }

  if (value.includes("fuente")) {
    return { category: "Energía", subcategory: "Fuentes" };
  }

  if (value.includes("ups")) {
    return { category: "Energía", subcategory: "UPS" };
  }

  if (value.includes("estabilizador") || value.includes("regulador")) {
    return { category: "Energía", subcategory: "Estabilizadores" };
  }

  if (
    value.includes("cable duplex") ||
    value.includes("cable dúplex") ||
    value.includes("cable neopreno")
  ) {
    return { category: "Energía", subcategory: "Cableado eléctrico" };
  }

  if (
    value.includes("toma macho") ||
    value.includes("toma hembra") ||
    value.includes("multitoma")
  ) {
    return { category: "Energía", subcategory: "Tomas y multitomas" };
  }

  if (value.includes("bornera")) {
    return { category: "Energía", subcategory: "Borneras" };
  }

  if (value.includes("cinta aislante")) {
    return { category: "Energía", subcategory: "Cinta aislante" };
  }

  if (
    value.includes("tornillo") ||
    value.includes("chazo") ||
    value.includes("abrazadera") ||
    value.includes("puntilla")
  ) {
    return { category: "Consumibles", subcategory: "Fijación" };
  }

  if (value.includes("terminal") || value.includes("bonera")) {
    return { category: "Consumibles", subcategory: "Conectividad" };
  }

  if (value.includes("cinta") || value.includes("termoencogible")) {
    return { category: "Consumibles", subcategory: "Protección" };
  }

  if (value.includes("soldadura")) {
    return { category: "Consumibles", subcategory: "Soldadura" };
  }

  if (value.includes("auxiliar")) {
    return { category: "Servicios técnicos", subcategory: "Auxiliar técnico" };
  }

  if (value.includes("alturas")) {
    return { category: "Servicios técnicos", subcategory: "Auxiliar alturas" };
  }

  if (value.includes("limpieza") || value.includes("mantenimiento")) {
    return { category: "Servicios técnicos", subcategory: "Limpieza" };
  }

  if (value.includes("electrico") || value.includes("eléctrico")) {
    return {
      category: "Servicios técnicos",
      subcategory: "Servicio eléctrico",
    };
  }

  if (value.includes("brazo") || value.includes("soporte") || value.includes("herraje")) {
    return { category: "Montaje", subcategory: "Brazo expansor" };
  }

  if (value.includes("transporte")) {
    return { category: "Costos internos", subcategory: "Transporte" };
  }

  if (value.includes("combustible")) {
    return { category: "Costos internos", subcategory: "Combustible" };
  }

  if (value.includes("peaje")) {
    return { category: "Costos internos", subcategory: "Peajes" };
  }

  if (value.includes("viatico") || value.includes("viático")) {
    return { category: "Costos internos", subcategory: "Viáticos" };
  }

  if (value.includes("parqueadero")) {
    return { category: "Costos internos", subcategory: "Parqueaderos" };
  }

  if (value.includes("logistica") || value.includes("logística")) {
    return { category: "Costos internos", subcategory: "Logística" };
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
  const [isUploadingTechnicalSheet, setIsUploadingTechnicalSheet] =
    useState(false);
  const [currentTechnicalSheet, setCurrentTechnicalSheet] =
    useState<TechnicalSheetMedia | null>(null);
  const [isRemovingImage, setIsRemovingImage] = useState(false);
  const [isRemovingTechnicalSheet, setIsRemovingTechnicalSheet] =
    useState(false);

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
      const { data, error } = await supabaseAdmin
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

    const { data, error } = await supabaseAdmin
      .from("products")
      .select(
        "id, name, slug, sku, brand, category, subcategory, price, cost_price, description, image_url, stock, sale_unit, public_sale_unit, quote_unit, purchase_unit, unit_content, quote_by_unit, has_offer, offer_price, offer_label, product_classification, public_group, visible_to_customer, created_at"
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
    setCurrentTechnicalSheet(null);
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

  const loadTechnicalSheet = async (productId: string) => {
    const { data, error } = await supabaseAdmin
      .from("product_media")
      .select("id, product_id, media_type, media_role, file_url, file_path, sort_order")
      .eq("product_id", productId)
      .eq("media_type", "pdf")
      .eq("media_role", "technical_sheet")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Load technical sheet error:", error);
      setCurrentTechnicalSheet(null);
      return;
    }

    setCurrentTechnicalSheet((data as TechnicalSheetMedia | null) ?? null);
  };

  const upsertTechnicalSheetMedia = async ({
    productId,
    fileUrl,
    filePath,
  }: {
    productId: string;
    fileUrl: string;
    filePath: string;
  }) => {
    const { data: existingMedia, error: existingError } = await supabaseAdmin
      .from("product_media")
      .select("id")
      .eq("product_id", productId)
      .eq("media_type", "pdf")
      .eq("media_role", "technical_sheet")
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingMedia?.id) {
      const { error } = await supabaseAdmin
        .from("product_media")
        .update({
          file_url: fileUrl,
          file_path: filePath,
          sort_order: 10,
        })
        .eq("id", existingMedia.id);

      if (error) {
        throw error;
      }

      return existingMedia.id as string;
    }

    const { data, error } = await supabaseAdmin
      .from("product_media")
      .insert({
        product_id: productId,
        media_type: "pdf",
        media_role: "technical_sheet",
        file_url: fileUrl,
        file_path: filePath,
        sort_order: 10,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return data.id as string;
  };

  const handleTechnicalSheetUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!editingId) {
      showToast(
        "error",
        "Primero guarda o edita un producto existente para asociar la ficha técnica."
      );
      e.target.value = "";
      return;
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (file.type !== "application/pdf" && fileExtension !== "pdf") {
      showToast("error", "Solo puedes subir fichas técnicas en PDF.");
      e.target.value = "";
      return;
    }

    try {
      setIsUploadingTechnicalSheet(true);

      const safeSlug = form.slug.trim() || slugify(form.name || "producto");
      const filePath = `productos/${safeSlug}/ficha-tecnica.pdf`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("technical-sheets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabaseAdmin.storage
        .from("technical-sheets")
        .getPublicUrl(filePath);

      const mediaId = await upsertTechnicalSheetMedia({
        productId: editingId,
        fileUrl: data.publicUrl,
        filePath,
      });

      setCurrentTechnicalSheet({
        id: mediaId,
        product_id: editingId,
        media_type: "pdf",
        media_role: "technical_sheet",
        file_url: data.publicUrl,
        file_path: filePath,
        sort_order: 10,
      });

      showToast("success", "Ficha técnica PDF subida correctamente.");
    } catch (error) {
      console.error("Upload technical sheet error:", error);
      showToast("error", "No fue posible subir la ficha técnica PDF.");
    } finally {
      setIsUploadingTechnicalSheet(false);
      e.target.value = "";
    }
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

      const { error: uploadError } = await supabaseAdmin.storage
        .from("product-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabaseAdmin.storage
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

  const getProductImagePathFromUrl = (imageUrl: string) => {
    try {
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split("/product-images/");

      if (pathParts.length < 2) return null;

      return decodeURIComponent(pathParts[1]);
    } catch {
      return null;
    }
  };

  const handleRemoveImage = async () => {
    if (!editingId || !form.image_url) return;

    const confirmed = window.confirm(
      "¿Seguro que deseas eliminar la imagen actual del producto?"
    );

    if (!confirmed) return;

    try {
      setIsRemovingImage(true);

      const filePath = getProductImagePathFromUrl(form.image_url);

      if (filePath) {
        await supabaseAdmin.storage.from("product-images").remove([filePath]);
      }

      const { error } = await supabaseAdmin
        .from("products")
        .update({ image_url: null })
        .eq("id", editingId);

      if (error) {
        throw error;
      }

      handleChange("image_url", "");
      showToast("success", "Imagen eliminada correctamente.");
      await fetchProducts();
    } catch (error) {
      console.error("Remove image error:", error);
      showToast("error", "No fue posible eliminar la imagen.");
    } finally {
      setIsRemovingImage(false);
    }
  };

  const handleRemoveTechnicalSheet = async () => {
    if (!currentTechnicalSheet?.id) return;

    const confirmed = window.confirm(
      "¿Seguro que deseas eliminar la ficha técnica PDF?"
    );

    if (!confirmed) return;

    try {
      setIsRemovingTechnicalSheet(true);

      if (currentTechnicalSheet.file_path) {
        await supabaseAdmin.storage
          .from("technical-sheets")
          .remove([currentTechnicalSheet.file_path]);
      }

      const { error } = await supabaseAdmin
        .from("product_media")
        .delete()
        .eq("id", currentTechnicalSheet.id);

      if (error) {
        throw error;
      }

      setCurrentTechnicalSheet(null);
      showToast("success", "Ficha técnica eliminada correctamente.");
    } catch (error) {
      console.error("Remove technical sheet error:", error);
      showToast("error", "No fue posible eliminar la ficha técnica.");
    } finally {
      setIsRemovingTechnicalSheet(false);
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
    if (Number.isNaN(Number(form.unit_content))) return "El contenido por unidad debe ser numérico.";

    if (Number(form.cost_price) < 0) return "El costo del producto no puede ser negativo.";
    if (Number(form.unit_content) <= 0) return "El contenido por unidad debe ser mayor a cero.";
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

    const productClassification = form.product_classification || "equipment";
    const visibilityConfig = getProductVisibilityConfig(productClassification);

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
      // Mantener sale_unit por compatibilidad legacy mientras el resto del proyecto migra.
      sale_unit: form.public_sale_unit || "unidad",
      public_sale_unit: form.public_sale_unit || "unidad",
      quote_unit: form.quote_unit || "unidad",
      purchase_unit: form.purchase_unit || "unidad",
      unit_content: Number(form.unit_content || 1),
      quote_by_unit: form.quote_by_unit,
      product_classification: productClassification,
      public_group: visibilityConfig.public_group,
      visible_to_customer: visibilityConfig.visible_to_customer,
      has_offer: form.has_offer,
      offer_price:
        form.has_offer && form.offer_price.trim()
          ? Math.round(Number(form.offer_price))
          : null,
      offer_label: form.has_offer ? form.offer_label.trim() || "Oferta" : null,
    };

    if (isEditing && editingId) {
      const { error } = await supabaseAdmin
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
      const { data: insertedProduct, error } = await supabaseAdmin
        .from("products")
        .insert(payload)
        .select(
          "id, name, slug, sku, brand, category, subcategory, price, cost_price, description, image_url, stock, sale_unit, public_sale_unit, quote_unit, purchase_unit, unit_content, quote_by_unit, has_offer, offer_price, offer_label, product_classification, public_group, visible_to_customer, created_at"
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

    setCurrentTechnicalSheet(null);

    setForm({
      name: product.name ?? "",
      slug: product.slug ?? "",
      sku: product.sku ?? "",
      brand: product.brand ?? "",
      category: product.category ?? "",
      subcategory: product.subcategory ?? "",
      product_classification: product.product_classification ?? "equipment",
      price: String(product.price ?? ""),
      cost_price: String(product.cost_price ?? 0),
      desired_margin: "30",
      include_wompi_fee_in_price: false,
      description: product.description ?? "",
      image_url: product.image_url ?? "",
      stock: String(product.stock ?? 0),
      public_sale_unit: product.public_sale_unit ?? product.sale_unit ?? "unidad",
      quote_unit: product.quote_unit ?? product.sale_unit ?? "unidad",
      purchase_unit: product.purchase_unit ?? "unidad",
      unit_content: String(product.unit_content ?? 1),
      quote_by_unit: Boolean(product.quote_by_unit),
      has_offer: Boolean(product.has_offer),
      offer_price:
        product.offer_price !== null && product.offer_price !== undefined
          ? String(product.offer_price)
          : "",
      offer_label: product.offer_label ?? "",
    });

    loadTechnicalSheet(product.id);

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

    const { error } = await supabaseAdmin
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

  const projectedTaxAmount =
    taxMode === "con_iva" ? Math.round(suggestedSalePrice * taxRate) : 0;
  const projectedCustomerTotalWithTax = suggestedSalePrice + projectedTaxAmount;
  const projectedPaymentGatewayCost =
    form.include_wompi_fee_in_price && suggestedSalePrice > 0
      ? Math.round(projectedCustomerTotalWithTax * WOMPI_FEE_RATE + WOMPI_FIXED_FEE)
      : 0;
  const projectedContributionProfit =
    suggestedSalePrice - projectedPaymentGatewayCost - formCostPrice;
  const projectedMargin =
    suggestedSalePrice > 0
      ? (projectedContributionProfit / suggestedSalePrice) * 100
      : 0;
  const projectedPriceSafetyMargin = suggestedSalePrice - breakEvenPrice;

  const proportionalPreview = calculateProportionalPricing({
    price: formEffectiveSalePrice,
    costPrice: formCostPrice,
    unitContent: form.unit_content,
    quoteByUnit: form.quote_by_unit,
  });
  const proportionalExampleQuantity = proportionalPreview.isProportional
    ? Math.min(proportionalPreview.unitContent, 100)
    : 1;
  const proportionalExampleSubtotal = calculateProportionalSubtotal(
    proportionalExampleQuantity,
    proportionalPreview.unitSalePrice
  );
  const proportionalExampleTotalCost = calculateProportionalTotalCost(
    proportionalExampleQuantity,
    proportionalPreview.unitCostPrice
  );
  const proportionalExampleProfit =
    proportionalExampleSubtotal - proportionalExampleTotalCost;
  const proportionalExampleMargin =
    proportionalExampleSubtotal > 0
      ? (proportionalExampleProfit / proportionalExampleSubtotal) * 100
      : 0;

  // Precio proyectado para cotizaciones de proyecto.
  // En proyectos con instalación normalmente NO se absorbe Wompi,
  // porque el pago suele manejarse por transferencia/anticipo/acuerdo comercial.
  const quoteSuggestedSalePrice = roundPriceToHundred(
    calculateSuggestedSalePrice(
      formCostPrice,
      desiredMarginValue,
      false
    )
  );

  const proportionalProjectedPreview = calculateProportionalPricing({
    price: quoteSuggestedSalePrice,
    costPrice: formCostPrice,
    unitContent: form.unit_content,
    quoteByUnit: form.quote_by_unit,
  });

  const SectionHeader = ({
    title,
    description,
    badge,
  }: {
    title: string;
    description: string;
    badge?: string;
  }) => (
    <summary className="flex cursor-pointer list-none flex-col gap-3 rounded-2xl bg-slate-50 px-5 py-4 transition hover:bg-slate-100 md:flex-row md:items-center md:justify-between">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <div className="flex items-center gap-3">
        {badge && (
          <span className="inline-flex w-fit rounded-full bg-[#2D5398]/10 px-3 py-1.5 text-xs font-bold text-[#2D5398]">
            {badge}
          </span>
        )}
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm">
          Abrir / cerrar
        </span>
      </div>
    </summary>
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <details open className="group rounded-3xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              title="1. Información comercial"
              description="Datos mínimos para identificar, clasificar y publicar el producto en el catálogo maestro ERP."
              badge={isEditing ? "Edición activa" : "Nuevo producto"}
            />

            <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Ej: Cámara domo Dahua 1080p"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">URL amigable</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="Ej: camara-domo-dahua-1080p"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">SKU</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  placeholder="Ej: CAM-DH-D-001"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Marca</label>
                <select
                  value={form.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
                >
                  <option value="">Selecciona una marca</option>
                  {brandOptions.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Categoría</label>
                <select
                  value={form.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
                >
                  <option value="">Selecciona una categoría</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Subcategoría</label>
                <select
                  value={form.subcategory}
                  onChange={(e) => handleChange("subcategory", e.target.value)}
                  disabled={!form.category}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">{form.category ? "Selecciona una subcategoría" : "Primero selecciona una categoría"}</option>
                  {formSubcategoryOptions.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>{subcategory}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Clasificación para cotizaciones</label>
                <select
                  value={form.product_classification}
                  onChange={(e) =>
                    handleChange(
                      "product_classification",
                      e.target.value as ProductClassification
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
                >
                  {PRODUCT_CLASSIFICATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {getProductClassificationMeta(form.product_classification).description}
                </p>
              </div>

              <div className="md:col-span-2 xl:col-span-3">
                <label className="mb-2 block text-sm font-medium text-slate-700">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  placeholder="Describe el producto, sus usos principales y notas comerciales."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
                />
              </div>
            </div>
          </details>

          <details open className="group rounded-3xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              title="2. Pricing & rentabilidad ERP"
              description="Define precio, costo, stock, margen deseado, Wompi, IVA, oferta y rentabilidad real/proyectada."
              badge="Finanzas PRO"
            />

            <div className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Precio de venta actual</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
                  />
                  <p className="mt-1 text-xs text-slate-500">Es el precio real guardado y usado por ecommerce.</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Costo del producto</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.cost_price}
                    onChange={(e) => handleChange("cost_price", e.target.value)}
                    placeholder="Costo real de compra"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
                  />
                  <p className="mt-1 text-xs text-slate-500">Base para utilidad y margen comercial.</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Stock</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.stock}
                    onChange={(e) => handleChange("stock", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
                  />
                  <p className="mt-1 text-xs text-slate-500">Control operativo base del catálogo.</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Margen deseado %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="90"
                    value={form.desired_margin}
                    onChange={(e) => handleChange("desired_margin", e.target.value)}
                    placeholder="Ej: 30"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
                  />
                  <p className="mt-1 text-xs text-slate-500">Simula el precio sugerido; no cambia el precio hasta aplicar.</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
                <label className="flex min-h-[74px] items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.include_wompi_fee_in_price}
                    onChange={(e) => handleChange("include_wompi_fee_in_price", e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  <span>
                    <span className="block font-semibold text-slate-800">Absorber costo Wompi</span>
                    <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">
                      Recomendado para ventas ecommerce. En cotizaciones con instalación normalmente se deja desactivado salvo pago por pasarela.
                    </span>
                  </span>
                </label>

                <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Precio sugerido</p>
                  <p className="mt-2 text-2xl font-bold text-[#2D5398]">{formatPrice(suggestedSalePrice)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {form.include_wompi_fee_in_price ? "Incluye costo estimado de pasarela." : "Calculado con margen comercial."}
                  </p>
                </article>

                <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Margen proyectado</p>
                  <p className={`mt-2 text-2xl font-bold ${projectedMargin < 15 ? "text-amber-700" : "text-emerald-700"}`}>
                    {formatPercent(projectedMargin)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Si aplicas el precio sugerido.</p>
                </article>

                <button
                  type="button"
                  disabled={suggestedSalePrice <= 0}
                  onClick={() => handleChange("price", String(suggestedSalePrice))}
                  className="inline-flex min-h-[74px] items-center justify-center rounded-xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Aplicar precio sugerido
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Análisis de rentabilidad del producto</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      El margen real se calcula con el precio actual. El margen proyectado se calcula con el precio sugerido.
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
                    {isFormLoss ? "Riesgo de pérdida" : isFormLowMargin ? "Margen bajo" : isFormHealthyMargin ? "Rentable" : "En evaluación"}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                  <article className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Base sin IVA</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{formatPrice(formAccountingRevenue)}</p>
                    <p className="mt-1 text-xs text-slate-500">Precio actual/oferta activa.</p>
                  </article>

                  <article className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">IVA al cliente</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{formatPrice(formTaxAmount)}</p>
                    <p className="mt-1 text-xs text-slate-500">{taxMode === "con_iva" ? "Se suma en checkout." : "Modo actual sin IVA."}</p>
                  </article>

                  <article className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Costo Wompi</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{formatPrice(formPaymentGatewayCost)}</p>
                    <p className="mt-1 text-xs text-slate-500">{form.include_wompi_fee_in_price ? "3.2% + $900 estimado." : "No aplicado."}</p>
                  </article>

                  <article className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Utilidad actual</p>
                    <p className={`mt-2 text-xl font-bold ${formContributionProfit < 0 ? "text-red-700" : "text-emerald-700"}`}>
                      {formatPrice(formContributionProfit)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Después de costo y pasarela.</p>
                  </article>

                  <article className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Margen real actual</p>
                    <p className={`mt-2 text-xl font-bold ${isFormLoss ? "text-red-700" : isFormLowMargin ? "text-amber-700" : "text-emerald-700"}`}>
                      {formatPercent(formRealMargin)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">No cambia hasta aplicar precio.</p>
                  </article>

                  <article className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#2D5398]">Margen proyectado</p>
                    <p className={`mt-2 text-xl font-bold ${projectedMargin < 15 ? "text-amber-700" : "text-[#2D5398]"}`}>
                      {formatPercent(projectedMargin)}
                    </p>
                    <p className="mt-1 text-xs text-[#2D5398]">Con precio sugerido.</p>
                  </article>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Precio mínimo sin pérdida</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatPrice(breakEvenPrice)}</p>
                    <p className={`mt-2 text-sm font-semibold ${priceSafetyMargin < 0 ? "text-red-700" : "text-emerald-700"}`}>
                      Colchón actual: {formatPrice(priceSafetyMargin)}
                    </p>
                    <p className={`mt-1 text-sm font-semibold ${projectedPriceSafetyMargin < 0 ? "text-red-700" : "text-[#2D5398]"}`}>
                      Colchón proyectado: {formatPrice(projectedPriceSafetyMargin)}
                    </p>
                  </article>

                  <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Utilidad proyectada</p>
                    <p className={`mt-2 text-2xl font-bold ${projectedContributionProfit < 0 ? "text-red-700" : "text-emerald-700"}`}>
                      {formatPrice(projectedContributionProfit)}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">Calculada con precio sugerido, IVA fiscal y Wompi si está activo.</p>
                  </article>

                  <article className={`rounded-2xl p-4 text-sm leading-6 ${isFormLoss ? "bg-red-50 text-red-700" : isFormLowMargin ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {isFormLoss ? (
                      <p>El precio actual no cubre adecuadamente el costo y los costos variables. Revisa antes de publicar o cotizar.</p>
                    ) : isFormLowMargin ? (
                      <p>Operación viable, pero con margen bajo. Considera garantía, logística, empaque y gastos operativos.</p>
                    ) : (
                      <p>Escenario saludable con el precio actual. La utilidad neta final dependerá de gastos operativos, logística e impuestos.</p>
                    )}
                    {form.has_offer && formOfferPrice > 0 && (
                      <p className="mt-3 font-semibold">Oferta activa: descuento de {formatPrice(formDiscountValue)} ({formatPercent(formDiscountPercent)}).</p>
                    )}
                  </article>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Oferta del producto</h3>
                  <p className="mt-1 text-sm text-slate-500">Actívala solo si el análisis mantiene utilidad positiva.</p>
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
            </div>
          </details>

          <details className="group rounded-3xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              title="3. Unidades ERP y consumo proporcional"
              description="Separa compra, venta pública ecommerce y consumo técnico en cotizaciones por metro, unidad, tramo o servicio."
              badge={form.quote_by_unit ? "Proporcional activo" : "Unitario"}
            />

            <div className="space-y-5 p-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Unidad de compra</label>
                  <select
                    value={form.purchase_unit}
                    onChange={(e) => handleChange("purchase_unit", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
                  >
                    <option value="unidad">Unidad</option>
                    <option value="rollo">Rollo</option>
                    <option value="caja">Caja</option>
                    <option value="paquete">Paquete</option>
                    <option value="kit">Kit</option>
                    <option value="tramo">Tramo</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Unidad de venta pública</label>
                  <select
                    value={form.public_sale_unit}
                    onChange={(e) => handleChange("public_sale_unit", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
                  >
                    <option value="unidad">Unidad</option>
                    <option value="rollo">Rollo</option>
                    <option value="caja">Caja</option>
                    <option value="paquete">Paquete</option>
                    <option value="kit">Kit</option>
                    <option value="tramo">Tramo</option>
                    <option value="servicio">Servicio</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">La ve el cliente en ecommerce.</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Unidad de cotización</label>
                  <select
                    value={form.quote_unit}
                    onChange={(e) => handleChange("quote_unit", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
                  >
                    <option value="unidad">Unidad</option>
                    <option value="metro">Metro</option>
                    <option value="hora">Hora</option>
                    <option value="punto">Punto</option>
                    <option value="tramo">Tramo</option>
                    <option value="servicio">Servicio</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Se usa en cotizaciones técnicas.</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Contenido por compra</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.unit_content}
                    onChange={(e) => handleChange("unit_content", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
                    placeholder="Ej: 304"
                  />
                  <p className="mt-1 text-xs text-slate-500">Rollo 304m, caja 500 und, tramo 2m.</p>
                </div>

                <label className="flex min-h-[74px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.quote_by_unit}
                    onChange={(e) => handleChange("quote_by_unit", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span>
                    <span className="block font-semibold text-slate-700">Cotización proporcional</span>
                    <span className="mt-1 block text-xs font-normal text-slate-500">Permite consumo parcial en proyectos.</span>
                  </span>
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Vista proporcional ERP</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Actual usa el precio real. Proyectado cotización usa margen deseado sin absorber Wompi.
                    </p>
                  </div>

                  <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-bold ${proportionalPreview.isProportional ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                    {proportionalPreview.isProportional ? "Proporcional activo" : "Producto unitario"}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <article className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Costo por {form.quote_unit}</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{formatPrice(Math.round(proportionalPreview.unitCostPrice))}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {proportionalPreview.isProportional ? `${formatPrice(formCostPrice)} / ${proportionalPreview.unitContent}` : "Mismo costo unitario."}
                    </p>
                  </article>

                  <article className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Precio actual por {form.quote_unit}</p>
                    <p className="mt-2 text-xl font-bold text-[#2D5398]">{formatPrice(Math.round(proportionalPreview.unitSalePrice))}</p>
                    <p className="mt-1 text-xs text-slate-500">Margen actual: {formatPercent(proportionalPreview.unitMargin)}</p>
                  </article>

                  <article className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#2D5398]">Precio proyectado por {form.quote_unit}</p>
                    <p className="mt-2 text-xl font-bold text-[#2D5398]">{formatPrice(Math.round(proportionalProjectedPreview.unitSalePrice))}</p>
                    <p className="mt-1 text-xs text-[#2D5398]">Margen cotización: {formatPercent(proportionalProjectedPreview.unitMargin)}</p>
                  </article>

                  <article className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ejemplo cotizable actual</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{formatPrice(Math.round(proportionalExampleSubtotal))}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {proportionalExampleQuantity} {form.quote_unit}
                      {proportionalPreview.isProportional ? ` · utilidad ${formatPrice(Math.round(proportionalExampleProfit))} · margen ${formatPercent(proportionalExampleMargin)}` : " · cálculo unitario"}
                    </p>
                  </article>
                </div>

                {proportionalPreview.isProportional && (
                  <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-[#2D5398]">
                    Este producto se compra por {form.purchase_unit}, se vende públicamente por {form.public_sale_unit} y se consume en cotización por {form.quote_unit}.
                  </div>
                )}
              </div>
            </div>
          </details>

          <details className="group rounded-3xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              title="4. Multimedia y ficha técnica"
              description="Gestiona la imagen comercial y la ficha técnica PDF asociada al producto."
              badge={currentTechnicalSheet ? "PDF conectado" : "Multimedia"}
            />

            <div className="grid gap-5 p-5 lg:grid-cols-2">
              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">Imagen del producto</label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    <div className="flex-1">
                      <label className="flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-[#2D5398]/30 bg-white px-6 py-8 text-center transition hover:border-[#2D5398] hover:bg-[#2D5398]/5">
                        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} className="hidden" />
                        <div>
                          <p className="text-sm font-semibold text-[#2D5398]">{isUploadingImage ? "Subiendo imagen..." : "Seleccionar imagen"}</p>
                          <p className="mt-1 text-xs text-slate-500">JPG, PNG o WEBP.</p>
                        </div>
                      </label>
                    </div>

                    <div className="flex justify-center">
                      <div className="h-36 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <img
                          src={form.image_url.trim() ? form.image_url : "/placeholder-product.png"}
                          alt="Vista previa del producto"
                          className="h-full w-full object-contain p-3"
                          onError={(e) => { e.currentTarget.src = "/placeholder-product.png"; }}
                        />
                      </div>
                    </div>
                  </div>

                  {form.image_url && (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">Imagen conectada correctamente.</div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={isRemovingImage}
                        className="inline-flex rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRemovingImage ? "Eliminando imagen..." : "Eliminar imagen actual"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">Ficha técnica PDF</label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <label className={`flex items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${isEditing ? "cursor-pointer border-[#2D5398]/30 bg-white hover:border-[#2D5398] hover:bg-[#2D5398]/5" : "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70"}`}>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handleTechnicalSheetUpload}
                      disabled={!isEditing || isUploadingTechnicalSheet}
                      className="hidden"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#2D5398]">
                        {isUploadingTechnicalSheet ? "Subiendo ficha técnica..." : currentTechnicalSheet ? "Reemplazar ficha técnica PDF" : "Seleccionar ficha técnica PDF"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">PDF técnico asociado al producto.</p>
                      {!isEditing && <p className="mt-2 text-xs font-semibold text-amber-700">Guarda el producto primero para asociar una ficha técnica.</p>}
                    </div>
                  </label>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Estado de la ficha</p>
                    {currentTechnicalSheet?.file_url ? (
                      <div className="mt-3 space-y-3">
                        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">Ficha técnica conectada correctamente.</div>
                        <a
                          href={currentTechnicalSheet.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full items-center justify-center rounded-xl bg-[#2D5398] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#234684]"
                        >
                          Ver PDF actual
                        </a>
                        <button
                          type="button"
                          onClick={handleRemoveTechnicalSheet}
                          disabled={isRemovingTechnicalSheet}
                          className="inline-flex w-full items-center justify-center rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isRemovingTechnicalSheet ? "Eliminando PDF..." : "Eliminar ficha técnica"}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-xs font-medium text-slate-600">Este producto aún no tiene ficha técnica asociada.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </details>

          <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">{isEditing ? "Editando producto" : "Nuevo producto"}</p>
              <p className="text-xs text-slate-500">Guarda los cambios cuando termines de revisar cada bloque.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex rounded-xl bg-[#2D5398] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Guardando..." : isEditing ? "Actualizar producto" : "Crear producto"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="inline-flex rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Limpiar formulario
              </button>
            </div>
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
                          <div className="mt-1 text-xs text-slate-500">
                            {product.quote_by_unit
                              ? `Compra: ${product.purchase_unit ?? "unidad"} x ${
                                  product.unit_content ?? 1
                                } · Ecommerce: ${product.public_sale_unit ?? product.sale_unit ?? "unidad"} · Cotiza: ${product.quote_unit ?? product.sale_unit ?? "unidad"}`
                              : `Ecommerce: ${product.public_sale_unit ?? product.sale_unit ?? "unidad"}`}
                          </div>
                          <div className="mt-2">
                            <span className="inline-flex rounded-full bg-[#2D5398]/10 px-2.5 py-1 text-xs font-bold text-[#2D5398]">
                              {getProductClassificationMeta(product.product_classification).label}
                            </span>
                          </div>
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
                          <p className="mt-1 text-xs text-slate-500">
                            {product.quote_by_unit
                              ? `Compra: ${product.purchase_unit ?? "unidad"} x ${
                                  product.unit_content ?? 1
                                } · Ecommerce: ${product.public_sale_unit ?? product.sale_unit ?? "unidad"} · Cotiza: ${product.quote_unit ?? product.sale_unit ?? "unidad"}`
                              : `Ecommerce: ${product.public_sale_unit ?? product.sale_unit ?? "unidad"}`}
                          </p>
                          <span className="mt-2 inline-flex rounded-full bg-[#2D5398]/10 px-2.5 py-1 text-xs font-bold text-[#2D5398]">
                            {getProductClassificationMeta(product.product_classification).label}
                          </span>
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