import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCart } from "../hooks/useCart";
import { useFavorites } from "../hooks/useFavorites";

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
};

type ProductMediaRow = {
  id: string;
  media_type: string;
  media_role: string;
  file_url: string;
  sort_order: number | null;
};

const PLACEHOLDER_IMAGE = "/placeholder-product.png";

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

const getStockLabel = (stock: number) => {
  if (stock <= 0) return "Agotado";
  if (stock <= 5) return "Pocas unidades";
  return "Disponible";
};

const checkImageExists = (url: string) => {
  return new Promise<boolean>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = url;
  });
};

const checkPdfExists = async (url: string) => {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
    });

    if (!response.ok) return false;

    const contentType = response.headers.get("content-type") ?? "";

    return contentType.includes("application/pdf");
  } catch {
    return false;
  }
};

export const ProductPage = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [product, setProduct] = useState<ProductRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [, setProductMedia] = useState<ProductMediaRow[]>([]);
  const [technicalSheetUrl, setTechnicalSheetUrl] = useState<string | null>(
    null
  );

  useEffect(() => {
    const getProduct = async () => {
      if (!slug) return;

      setIsLoading(true);
      setLoadError(null);

      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, slug, sku, brand, category, subcategory, price, description, image_url, stock, has_offer, offer_price, offer_label"
        )
        .eq("slug", slug)
        .single();

      if (error) {
        console.error("Error cargando producto:", error.message);
        setProduct(null);
        setLoadError("No fue posible cargar la información del producto.");
      } else {
        setProduct(data as ProductRow);
      }

      setIsLoading(false);
    };

    getProduct();
  }, [slug]);

  useEffect(() => {
    const prepareGalleryAndFiles = async () => {
      if (!product) return;

      setTechnicalSheetUrl(null);

      const { data: mediaData, error: mediaError } = await supabase
        .from("product_media")
        .select("id, media_type, media_role, file_url, sort_order")
        .eq("product_id", product.id)
        .order("sort_order", { ascending: true });

      const mediaRows = !mediaError && mediaData ? (mediaData as ProductMediaRow[]) : [];
      setProductMedia(mediaRows);

      const cloudImages = mediaRows
        .filter((media) => media.media_type === "image")
        .map((media) => media.file_url)
        .filter(Boolean);

      const uniqueCloudImages = Array.from(new Set(cloudImages));

      if (uniqueCloudImages.length > 0) {
        setGalleryImages(uniqueCloudImages);
        setSelectedImage(uniqueCloudImages[0]);
      } else {
        const mainImage =
          product.image_url && product.image_url.trim() !== ""
            ? product.image_url
            : `/products/imagenes/${product.slug}.webp`;

        const candidates = [
          mainImage,
          `/products/imagenes/${product.slug}-lateral.webp`,
          `/products/imagenes/${product.slug}-posterior.webp`,
          `/products/imagenes/${product.slug}-detalle.webp`,
        ];

        const uniqueCandidates = Array.from(new Set(candidates));

        const checkedImages = await Promise.all(
          uniqueCandidates.map(async (image) => {
            const exists = await checkImageExists(image);
            return exists ? image : null;
          })
        );

        const validImages = checkedImages.filter(
          (image): image is string => Boolean(image)
        );

        const finalImages =
          validImages.length > 0 ? validImages : [PLACEHOLDER_IMAGE];

        setGalleryImages(finalImages);
        setSelectedImage(finalImages[0]);
      }

      const cloudTechnicalSheet = mediaRows.find(
        (media) =>
          media.media_role === "technical_sheet" ||
          media.media_type === "pdf" ||
          media.media_type === "document"
      );

      if (cloudTechnicalSheet?.file_url) {
        setTechnicalSheetUrl(cloudTechnicalSheet.file_url);
        return;
      }

      const legacyPdfUrl = `/products/fichas_tecnicas/${product.slug}.pdf`;
      const legacyPdfExists = await checkPdfExists(legacyPdfUrl);

      if (legacyPdfExists) {
        setTechnicalSheetUrl(legacyPdfUrl);
      }
    };

    prepareGalleryAndFiles();
  }, [product]);

  useEffect(() => {
    if (!showToast) return;

    const timer = setTimeout(() => {
      setShowToast(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, [showToast]);

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-800">
          Cargando producto...
        </h1>
        <p className="mt-4 text-slate-600">
          Estamos consultando la información desde el catálogo.
        </p>
      </section>
    );
  }

  if (!product || loadError) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-800">
          Producto no encontrado
        </h1>
        <p className="mt-4 text-slate-600">
          {loadError ?? "El producto que buscas no existe o fue removido."}
        </p>
      </section>
    );
  }

  const stock = Number(product.stock ?? 0);
  const basePrice = Number(product.price ?? 0);
  const offerPrice = Number(product.offer_price ?? 0);
  const finalPrice =
    product.has_offer && offerPrice > 0 && offerPrice < basePrice
      ? offerPrice
      : basePrice;

  const imageUrl = product.image_url ?? PLACEHOLDER_IMAGE;
  const visibleImage = selectedImage || imageUrl;

  const brand = product.brand ?? "Sin marca";
  const category = product.category ?? "Sin categoría";
  const subcategory = product.subcategory ?? "Sin subcategoría";
  const stockLabel = getStockLabel(stock);
  const formattedPrice = formatPrice(finalPrice);
  const favoriteActive = isFavorite(product.slug);

  const stockBadgeClass =
    stockLabel === "Agotado"
      ? "border-red-100 bg-red-50 text-red-600"
      : stockLabel === "Pocas unidades"
      ? "border-amber-100 bg-amber-50 text-amber-600"
      : "border-emerald-100 bg-emerald-50 text-emerald-600";

  const handleAddToCart = () => {
    if (stock <= 0) {
      alert("Este producto no tiene unidades disponibles.");
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      img: visibleImage,
      price: finalPrice,
      stock,
    });

    setShowToast(true);
  };

  const handleToggleFavorite = () => {
    toggleFavorite({
      slug: product.slug,
      name: product.name,
      brand,
      img: visibleImage,
      formattedPrice,
    });
  };

  return (
    <>
      {showToast && (
        <div className="fixed right-4 top-24 z-50 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-xl">
          <p className="text-sm font-medium text-emerald-700">
            Producto agregado al carrito
          </p>
        </div>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#2D5398] via-[#234684] to-[#111827] px-6 py-10 text-white shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-blue-100">
            FICHA DE PRODUCTO
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-5xl">
            {product.name}
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
            Conoce las características, disponibilidad y datos principales de
            este equipo para tomar una mejor decisión de compra o cotización.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md transition duration-300 hover:shadow-xl">
              <div className="flex h-[340px] items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-100">
                <img
                  src={visibleImage}
                  alt={product.name}
                  className="h-full w-full object-contain p-4 transition duration-300 hover:scale-105"
                  onError={() => setSelectedImage(PLACEHOLDER_IMAGE)}
                />
              </div>

              {galleryImages.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {galleryImages.map((image) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`overflow-hidden rounded-xl border bg-white transition duration-300 hover:border-[#2D5398] ${
                        selectedImage === image
                          ? "border-[#2D5398] ring-2 ring-blue-100"
                          : "border-slate-200"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} vista adicional`}
                        className="h-16 w-full object-contain p-1"
                        onError={() => setSelectedImage(PLACEHOLDER_IMAGE)}
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2D5398]">
                    {brand}
                  </span>

                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${stockBadgeClass}`}
                  >
                    {stockLabel}
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-bold text-slate-800">
                  {product.name}
                </h2>

                <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                  {formattedPrice}
                </p>

                {product.has_offer &&
                  offerPrice > 0 &&
                  offerPrice < basePrice && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-slate-400 line-through">
                        {formatPrice(basePrice)}
                      </span>
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                        {product.offer_label || "Oferta"}
                      </span>
                    </div>
                  )}

                <p className="mt-2 text-sm text-slate-500">
                  Precio referencial sujeto a disponibilidad
                </p>

                <div className="mt-5 space-y-2 text-sm text-slate-600">
                  <p>
                    SKU:{" "}
                    <span className="font-semibold text-slate-800">
                      {product.sku ?? "Sin SKU"}
                    </span>
                  </p>

                  <p>
                    Categoría:{" "}
                    <span className="font-semibold text-slate-800">
                      {category}
                    </span>
                  </p>

                  <p>
                    Subcategoría:{" "}
                    <span className="font-semibold text-slate-800">
                      {subcategory}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md transition duration-300 hover:shadow-xl">
              <h2 className="border-l-4 border-[#2D5398] pl-4 text-2xl font-bold text-slate-800">
                Descripción del producto
              </h2>

              <p className="mt-5 text-justify leading-8 text-slate-600">
                {product.description ||
                  "Producto disponible en el catálogo de ADDA Seguridad. Para mayor información técnica, disponibilidad o compatibilidad, puedes solicitar asesoría comercial."}
              </p>

              <h3 className="mt-10 border-l-4 border-[#2D5398] pl-4 text-xl font-semibold text-slate-800">
                Información principal
              </h3>

              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <li className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                  Marca: {brand}
                </li>

                <li className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                  Categoría: {category}
                </li>

                <li className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                  Subcategoría: {subcategory}
                </li>

                <li className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                  Disponibilidad: {stockLabel}
                </li>
              </ul>

              <h3 className="mt-10 border-l-4 border-[#2D5398] pl-4 text-xl font-semibold text-slate-800">
                Datos comerciales
              </h3>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 border-b border-slate-200 sm:grid-cols-2">
                  <div className="bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                    Código SKU
                  </div>
                  <div className="px-4 py-3 text-slate-600">
                    {product.sku ?? "Sin SKU"}
                  </div>
                </div>

                <div className="grid grid-cols-1 border-b border-slate-200 sm:grid-cols-2">
                  <div className="bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                    Precio
                  </div>
                  <div className="px-4 py-3 text-slate-600">
                    {formattedPrice}
                  </div>
                </div>

                <div className="grid grid-cols-1 border-b border-slate-200 sm:grid-cols-2">
                  <div className="bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                    Stock disponible
                  </div>
                  <div className="px-4 py-3 text-slate-600">{stock}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2">
                  <div className="bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                    Estado
                  </div>
                  <div className="px-4 py-3 text-slate-600">{stockLabel}</div>
                </div>
              </div>
            </div>
          </main>

          <aside className="lg:col-span-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md transition duration-300 hover:shadow-xl">
              {technicalSheetUrl && (
                <a
                  href={technicalSheetUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-6 flex w-full items-center justify-between rounded-2xl border border-[#2D5398] bg-[#2D5398] px-4 py-4 text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-7 w-7"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M7 3h7l4 4v14H7V3Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 3v5h5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9 15c1.8-3.8 3.2-3.8 4 0 .7 2.9 2.1 2.3 3-.2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-5">
                        Ficha técnica
                      </p>
                      <p className="text-xs font-medium text-blue-100">
                        Descargar PDF
                      </p>
                    </div>
                  </div>

                  <div className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#2D5398]">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-7 w-7"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 4v10"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                      />
                      <path
                        d="M7.5 10.5 12 15l4.5-4.5"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M5 19h14"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </a>
              )}

              <h2 className="border-l-4 border-[#2D5398] pl-4 text-xl font-bold text-slate-800">
                Disponibilidad y compra
              </h2>

              <div className="mt-5">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${stockBadgeClass}`}
                >
                  {stockLabel}
                </span>

                <p className="mt-4 text-sm text-slate-600">
                  Unidades disponibles:{" "}
                  <span className="font-semibold text-slate-800">{stock}</span>
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={stock <= 0}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-[#2D5398] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {stock <= 0 ? "Producto agotado" : "Agregar al carrito"}
                </button>

                <button
                  onClick={handleToggleFavorite}
                  className={`inline-flex w-full items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition duration-300 ${
                    favoriteActive
                      ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {favoriteActive
                    ? "Quitar de favoritos"
                    : "Agregar a favoritos"}
                </button>

                <a
                  href={`https://wa.me/573015068866?text=Hola,%20quiero%20cotizar%20el%20producto%20${encodeURIComponent(
                    product.name
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-[#2D5398] bg-white px-4 py-3 text-center text-sm font-semibold text-[#2D5398] transition duration-300 hover:bg-blue-50"
                >
                  Cotizar por WhatsApp
                </a>
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                <h3 className="text-sm font-semibold text-slate-800">
                  Información adicional
                </h3>

                <ul className="mt-3 space-y-3 text-sm text-slate-600">
                  <li>✔ Garantía por defectos de fábrica.</li>
                  <li>✔ Soporte técnico especializado.</li>
                  <li>✔ Asesoría para selección del equipo.</li>
                  <li>✔ Atención comercial vía WhatsApp.</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
};