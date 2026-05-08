import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  image_url: string | null;
};

type MediaRole = "principal" | "lateral" | "posterior" | "detalle";

type MigrationStatus = "pending" | "checking" | "success" | "warning" | "error";

type ProductMigrationState = {
  status: MigrationStatus;
  message: string;
  migratedRoles: MediaRole[];
};

type ProductMediaRow = {
  id: string;
  product_id: string;
  media_type: string;
  media_role: string;
  file_url: string;
  file_path: string | null;
  sort_order: number | null;
};

type ToastType = "success" | "error";

type Toast = {
  type: ToastType;
  message: string;
};

const IMAGE_ROLES: Array<{
  role: MediaRole;
  suffix: string;
  targetFileName: string;
  sortOrder: number;
  label: string;
}> = [
  { role: "principal", suffix: "", targetFileName: "principal.webp", sortOrder: 1, label: "Principal" },
  { role: "lateral", suffix: "-lateral", targetFileName: "lateral.webp", sortOrder: 2, label: "Lateral" },
  { role: "posterior", suffix: "-posterior", targetFileName: "posterior.webp", sortOrder: 3, label: "Posterior" },
  { role: "detalle", suffix: "-detalle", targetFileName: "detalle.webp", sortOrder: 4, label: "Detalle" },
];

const STORAGE_BUCKET = "product-images";
const LEGACY_IMAGE_BASE_PATH = "/products/imagenes";

const getInitialMigrationState = (): ProductMigrationState => ({
  status: "pending",
  message: "Pendiente por migrar",
  migratedRoles: [],
});

const formatRoleLabel = (role: MediaRole) => {
  const config = IMAGE_ROLES.find((item) => item.role === role);
  return config?.label ?? role;
};

const getLegacyImageUrl = (slug: string, suffix: string) => {
  return `${LEGACY_IMAGE_BASE_PATH}/${slug}${suffix}.webp`;
};

const getStoragePath = (slug: string, targetFileName: string) => {
  return `productos/${slug}/${targetFileName}`;
};

const readLegacyImageAsFile = async (
  productSlug: string,
  suffix: string,
  targetFileName: string
) => {
  const legacyUrl = getLegacyImageUrl(productSlug, suffix);
  const response = await fetch(legacyUrl, { cache: "no-store" });

  if (!response.ok) return null;

  const blob = await response.blob();

  if (!blob.type.startsWith("image/")) return null;

  return new File([blob], targetFileName, {
    type: blob.type || "image/webp",
  });
};

export const AdminMultimediaMigrationPage = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productMedia, setProductMedia] = useState<ProductMediaRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigratingAll, setIsMigratingAll] = useState(false);
  const [migratingProductId, setMigratingProductId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [migrationState, setMigrationState] = useState<Record<string, ProductMigrationState>>({});

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

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);

    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id, name, slug, sku, image_url")
      .order("name", { ascending: true });

    if (productsError) {
      console.error("Error cargando productos:", productsError);
      setLoadError("No fue posible cargar los productos.");
      setProducts([]);
      setIsLoading(false);
      return;
    }

    const { data: mediaData, error: mediaError } = await supabase
      .from("product_media")
      .select("id, product_id, media_type, media_role, file_url, file_path, sort_order")
      .order("sort_order", { ascending: true });

    if (mediaError) {
      console.error("Error cargando multimedia:", mediaError);
      setLoadError("No fue posible cargar la multimedia registrada.");
      setProductMedia([]);
      setIsLoading(false);
      return;
    }

    const loadedProducts = (productsData as ProductRow[]) ?? [];
    const loadedMedia = (mediaData as ProductMediaRow[]) ?? [];

    setProducts(loadedProducts);
    setProductMedia(loadedMedia);

    setMigrationState(() => {
      const nextState: Record<string, ProductMigrationState> = {};

      loadedProducts.forEach((product) => {
        const existingImageMedia = loadedMedia.filter(
          (media) => media.product_id === product.id && media.media_type === "image"
        );

        if (existingImageMedia.length > 0) {
          const migratedRoles = existingImageMedia
            .map((media) => media.media_role)
            .filter((role): role is MediaRole =>
              IMAGE_ROLES.some((imageRole) => imageRole.role === role)
            );

          nextState[product.id] = {
            status: "success",
            message: "Producto migrado correctamente.",
            migratedRoles,
          };
        } else {
          nextState[product.id] = getInitialMigrationState();
        }
      });

      return nextState;
    });

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const mediaByProductId = useMemo(() => {
    return productMedia.reduce<Record<string, ProductMediaRow[]>>((accumulator, media) => {
      if (!accumulator[media.product_id]) {
        accumulator[media.product_id] = [];
      }

      accumulator[media.product_id].push(media);
      return accumulator;
    }, {});
  }, [productMedia]);

  const migratedProductsCount = useMemo(() => {
    return products.filter((product) =>
      mediaByProductId[product.id]?.some(
        (media) => media.media_type === "image" && media.media_role === "principal"
      )
    ).length;
  }, [products, mediaByProductId]);

  const pendingProductsCount = Math.max(products.length - migratedProductsCount, 0);

  const updateProductMigrationState = (
    productId: string,
    nextState: ProductMigrationState
  ) => {
    setMigrationState((current) => ({
      ...current,
      [productId]: nextState,
    }));
  };

  const registerMedia = async ({
    product,
    role,
    fileUrl,
    filePath,
    sortOrder,
  }: {
    product: ProductRow;
    role: MediaRole;
    fileUrl: string;
    filePath: string;
    sortOrder: number;
  }) => {
    const existingMedia = mediaByProductId[product.id]?.find(
      (media) => media.media_type === "image" && media.media_role === role
    );

    if (existingMedia) {
      const { error } = await supabase
        .from("product_media")
        .update({
          file_url: fileUrl,
          file_path: filePath,
          sort_order: sortOrder,
        })
        .eq("id", existingMedia.id);

      if (error) throw error;
      return;
    }

    const { error } = await supabase.from("product_media").insert({
      product_id: product.id,
      media_type: "image",
      media_role: role,
      file_url: fileUrl,
      file_path: filePath,
      sort_order: sortOrder,
    });

    if (error) throw error;
  };

  const migrateProduct = async (product: ProductRow) => {
    setMigratingProductId(product.id);
    updateProductMigrationState(product.id, {
      status: "checking",
      message: "Revisando imágenes locales...",
      migratedRoles: [],
    });

    const migratedRoles: MediaRole[] = [];
    const missingRoles: MediaRole[] = [];

    try {
      for (const imageRole of IMAGE_ROLES) {
        const localFile = await readLegacyImageAsFile(
          product.slug,
          imageRole.suffix,
          imageRole.targetFileName
        );

        if (!localFile) {
          missingRoles.push(imageRole.role);
          continue;
        }

        const storagePath = getStoragePath(product.slug, imageRole.targetFileName);

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, localFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

        await registerMedia({
          product,
          role: imageRole.role,
          fileUrl: data.publicUrl,
          filePath: storagePath,
          sortOrder: imageRole.sortOrder,
        });

        if (imageRole.role === "principal") {
          const { error: updateProductError } = await supabase
            .from("products")
            .update({ image_url: data.publicUrl })
            .eq("id", product.id);

          if (updateProductError) throw updateProductError;
        }

        migratedRoles.push(imageRole.role);
      }

      if (migratedRoles.length === 0) {
        updateProductMigrationState(product.id, {
          status: "warning",
          message:
            "No se encontraron imágenes locales para este producto. Se mantiene fallback.",
          migratedRoles,
        });
        return;
      }

      updateProductMigrationState(product.id, {
        status: missingRoles.length > 0 ? "warning" : "success",
        message:
          missingRoles.length > 0
            ? `Migrado parcialmente. Faltan: ${missingRoles
                .map(formatRoleLabel)
                .join(", ")}.`
            : "Producto migrado completamente.",
        migratedRoles,
      });

      await loadData();
    } catch (error) {
      console.error("Error migrando producto:", error);

      updateProductMigrationState(product.id, {
        status: "error",
        message: "No fue posible migrar este producto.",
        migratedRoles,
      });

      showToast("error", `Error migrando: ${product.name}`);
    } finally {
      setMigratingProductId(null);
    }
  };

  const migrateAllProducts = async () => {
    setIsMigratingAll(true);

    for (const product of products) {
      await migrateProduct(product);
    }

    setIsMigratingAll(false);
    showToast("success", "Proceso de migración finalizado.");
  };

  const getStatusClass = (status: MigrationStatus) => {
    if (status === "success") return "bg-emerald-100 text-emerald-700";
    if (status === "warning") return "bg-amber-100 text-amber-700";
    if (status === "error") return "bg-red-100 text-red-700";
    if (status === "checking") return "bg-blue-100 text-[#2D5398]";
    return "bg-slate-100 text-slate-600";
  };

  const getProductRegisteredMedia = (productId: string) => {
    return (mediaByProductId[productId] ?? []).filter(
      (media) => media.media_type === "image"
    );
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:py-12">
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

      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] p-6 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
          Panel administrador
        </p>

        <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">
          Migración multimedia cloud
        </h1>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-100 md:text-base">
          Migra las imágenes locales legacy desde{" "}
          <span className="font-bold text-white">/public/products/imagenes</span>{" "}
          hacia Supabase Storage, registrándolas automáticamente en{" "}
          <span className="font-bold text-white">product_media</span>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Productos cargados
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{products.length}</p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Con imagen principal cloud
          </p>
          <p className="mt-3 text-3xl font-bold text-emerald-700">
            {migratedProductsCount}
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Pendientes
          </p>
          <p className="mt-3 text-3xl font-bold text-amber-700">
            {pendingProductsCount}
          </p>
        </article>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="border-l-4 border-[#2D5398] pl-4 text-2xl font-bold text-slate-800">
              Ejecutar migración
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Este proceso no elimina las imágenes locales. Copia las imágenes
              encontradas, actualiza la imagen principal en el producto y crea
              registros multimedia para galería cloud.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading || isMigratingAll}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Recargar
            </button>

            <button
              type="button"
              onClick={migrateAllProducts}
              disabled={isLoading || isMigratingAll || products.length === 0}
              className="rounded-xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isMigratingAll ? "Migrando catálogo..." : "Migrar todo el catálogo"}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          <strong>Nota operativa:</strong> deja la carpeta local activa mientras
          validamos todo. Cuando ProductPage consuma primero{" "}
          <strong>product_media</strong> y todo esté probado, limpiamos la
          dependencia legacy.
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
        <h2 className="border-l-4 border-[#2D5398] pl-4 text-2xl font-bold text-slate-800">
          Estado por producto
        </h2>

        {isLoading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600">
            Cargando información multimedia...
          </div>
        ) : loadError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center text-red-700">
            {loadError}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600">
            No hay productos registrados.
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {products.map((product) => {
              const state = migrationState[product.id] ?? getInitialMigrationState();
              const registeredMedia = getProductRegisteredMedia(product.id);
              const isCurrentProductMigrating = migratingProductId === product.id;

              return (
                <article
                  key={product.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                >
                  <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {product.name}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                            state.status
                          )}`}
                        >
                          {state.status === "checking"
                            ? "Procesando"
                            : state.status === "success"
                            ? "Migrado"
                            : state.status === "warning"
                            ? "Parcial"
                            : state.status === "error"
                            ? "Error"
                            : "Pendiente"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        Slug:{" "}
                        <span className="font-semibold text-slate-700">
                          {product.slug}
                        </span>
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        SKU:{" "}
                        <span className="font-semibold text-slate-700">
                          {product.sku ?? "Sin SKU"}
                        </span>
                      </p>

                      <p className="mt-3 text-sm font-medium text-slate-600">
                        {state.message}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Multimedia registrada
                      </p>

                      {registeredMedia.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">
                          Sin registros cloud todavía.
                        </p>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {registeredMedia.map((media) => (
                            <a
                              key={media.id}
                              href={media.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#2D5398] shadow-sm transition hover:bg-blue-50"
                            >
                              {media.media_role}
                            </a>
                          ))}
                        </div>
                      )}

                      {state.migratedRoles.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {state.migratedRoles.map((role) => (
                            <span
                              key={role}
                              className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                            >
                              {formatRoleLabel(role)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => migrateProduct(product)}
                      disabled={
                        isMigratingAll ||
                        isCurrentProductMigrating ||
                        Boolean(migratingProductId)
                      }
                      className="rounded-xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCurrentProductMigrating ? "Migrando..." : "Migrar producto"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
