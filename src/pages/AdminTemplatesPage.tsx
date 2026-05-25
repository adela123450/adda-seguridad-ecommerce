import { type FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type QuoteTemplate = {
  id: string;
  name: string;
  template_code: string | null;
  description: string | null;
  service_type: string;
  installation_type: string | null;
  estimated_duration: string | null;
  default_public_scope: string | null;
  compatible_analog: boolean;
  compatible_ip: boolean;
  compatible_wifi: boolean;
  compatible_solar: boolean;
  compatible_ajax: boolean;
  default_labor_notes: string | null;
  default_logistics_notes: string | null;
  active: boolean;
  created_at: string;
  updated_at?: string;
};

type FormState = {
  name: string;
  template_code: string;
  description: string;
  service_type: string;
  installation_type: string;
  estimated_duration: string;
  default_public_scope: string;
  default_labor_notes: string;
  default_logistics_notes: string;
  compatible_analog: boolean;
  compatible_ip: boolean;
  compatible_wifi: boolean;
  compatible_solar: boolean;
  compatible_ajax: boolean;
  active: boolean;
};

const initialForm: FormState = {
  name: "",
  template_code: "",
  description: "",
  service_type: "installation",
  installation_type: "analog",
  estimated_duration: "",
  default_public_scope: "",
  default_labor_notes: "",
  default_logistics_notes: "",
  compatible_analog: false,
  compatible_ip: false,
  compatible_wifi: false,
  compatible_solar: false,
  compatible_ajax: false,
  active: true,
};

const serviceTypes = [
  { value: "installation", label: "Instalación" },
  { value: "maintenance", label: "Mantenimiento" },
  { value: "diagnostic", label: "Diagnóstico" },
  { value: "support", label: "Soporte técnico" },
];

const installationTypes = [
  { value: "analog", label: "CCTV análogo" },
  { value: "ip", label: "CCTV IP" },
  { value: "wifi", label: "CCTV WiFi" },
  { value: "solar", label: "CCTV solar" },
  { value: "ajax", label: "Alarmas AJAX" },
  { value: "maintenance", label: "Mantenimiento" },
  { value: "diagnostic", label: "Diagnóstico" },
  { value: "support", label: "Soporte técnico" },
];

const getServiceTypeLabel = (value: string) => {
  return serviceTypes.find((type) => type.value === value)?.label ?? value;
};

const getInstallationTypeLabel = (value: string | null) => {
  if (!value) return "Sin tecnología";
  return installationTypes.find((type) => type.value === value)?.label ?? value;
};

const normalizeCode = (value: string) => {
  return value
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 30);
};

const generateTemplateCode = (name: string) => {
  const normalized = normalizeCode(name);
  return normalized ? `TPL-${normalized}` : "TPL-NUEVA-PLANTILLA";
};

export const AdminTemplatesPage = () => {
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadTemplates = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("quote_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("No fue posible cargar las plantillas de cotización.");
      setTemplates([]);
    } else {
      setTemplates((data ?? []) as QuoteTemplate[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesSearch =
        !term ||
        template.name.toLowerCase().includes(term) ||
        template.template_code?.toLowerCase().includes(term) ||
        template.description?.toLowerCase().includes(term) ||
        template.service_type.toLowerCase().includes(term) ||
        template.installation_type?.toLowerCase().includes(term);

      const matchesService =
        serviceFilter === "all" || template.service_type === serviceFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && template.active) ||
        (statusFilter === "inactive" && !template.active);

      return matchesSearch && matchesService && matchesStatus;
    });
  }, [templates, search, serviceFilter, statusFilter]);


  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setMessage("");
    setError("");
  };

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "name" && !editingId && !current.template_code.trim()) {
        next.template_code = generateTemplateCode(String(value));
      }

      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    if (!form.name.trim()) {
      setError("El nombre de la plantilla es obligatorio.");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      template_code:
        form.template_code.trim() || generateTemplateCode(form.name),
      description: form.description.trim() || null,
      service_type: form.service_type,
      installation_type: form.installation_type,
      estimated_duration: form.estimated_duration.trim() || null,
      default_public_scope: form.default_public_scope.trim() || null,
      default_labor_notes: form.default_labor_notes.trim() || null,
      default_logistics_notes: form.default_logistics_notes.trim() || null,
      compatible_analog: form.compatible_analog,
      compatible_ip: form.compatible_ip,
      compatible_wifi: form.compatible_wifi,
      compatible_solar: form.compatible_solar,
      compatible_ajax: form.compatible_ajax,
      active: form.active,
      updated_at: new Date().toISOString(),
    };

    const response = editingId
      ? await supabase
          .from("quote_templates")
          .update(payload)
          .eq("id", editingId)
      : await supabase.from("quote_templates").insert(payload);

    if (response.error) {
      setError(
        response.error.message || "No fue posible guardar la plantilla.",
      );
    } else {
      setMessage(
        editingId
          ? "Plantilla actualizada correctamente."
          : "Plantilla creada correctamente.",
      );
      resetForm();
      await loadTemplates();
    }

    setSaving(false);
  };

  const handleEdit = (template: QuoteTemplate) => {
    setEditingId(template.id);

    setForm({
      name: template.name,
      template_code: template.template_code ?? "",
      description: template.description ?? "",
      service_type: template.service_type,
      installation_type: template.installation_type ?? "analog",
      estimated_duration: template.estimated_duration ?? "",
      default_public_scope: template.default_public_scope ?? "",
      default_labor_notes: template.default_labor_notes ?? "",
      default_logistics_notes: template.default_logistics_notes ?? "",
      compatible_analog: template.compatible_analog,
      compatible_ip: template.compatible_ip,
      compatible_wifi: template.compatible_wifi,
      compatible_solar: template.compatible_solar,
      compatible_ajax: template.compatible_ajax,
      active: template.active,
    });

    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleStatus = async (template: QuoteTemplate) => {
    setMessage("");
    setError("");

    const { error } = await supabase
      .from("quote_templates")
      .update({
        active: !template.active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", template.id);

    if (error) {
      setError("No fue posible actualizar el estado de la plantilla.");
    } else {
      setMessage(
        !template.active
          ? "Plantilla activada correctamente."
          : "Plantilla desactivada correctamente.",
      );
      await loadTemplates();
    }
  };

  const handleDelete = async (template: QuoteTemplate) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar la plantilla "${template.name}"? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    setDeletingId(template.id);
    setMessage("");
    setError("");

    const { error } = await supabase
      .from("quote_templates")
      .delete()
      .eq("id", template.id);

    if (error) {
      setError(
        "No fue posible eliminar la plantilla. Verifica si tiene ítems asociados o dependencias.",
      );
    } else {
      setMessage("Plantilla eliminada correctamente.");

      if (editingId === template.id) {
        resetForm();
      }

      await loadTemplates();
    }

    setDeletingId(null);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] p-6 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
          Centro de plantillas
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          Plantillas reutilizables ADDA
        </h2>

        <p className="mt-2 max-w-3xl text-blue-100">
          Administra plantillas técnicas para instalaciones, mantenimientos,
          diagnósticos y soporte, estandarizando cotizaciones y reduciendo
          errores comerciales.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid min-w-0 gap-8 lg:grid-cols-[420px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1E293B]">
                {editingId ? "Editar plantilla" : "Nueva plantilla"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Configura estructuras reutilizables para cotizaciones.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="grid min-w-0 gap-4">
            <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
              Nombre plantilla
              <input
                value={form.name}
                onChange={(event) => handleChange("name", event.target.value)}
                placeholder="Ej: Instalación IP 4 cámaras"
                className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
              />
            </label>

            <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
              Código plantilla
              <input
                value={form.template_code}
                onChange={(event) =>
                  handleChange(
                    "template_code",
                    normalizeCode(event.target.value),
                  )
                }
                placeholder="TPL-IP-001"
                className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
              />
            </label>

            <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
              Descripción técnica
              <textarea
                value={form.description}
                onChange={(event) =>
                  handleChange("description", event.target.value)
                }
                placeholder="Describe el uso interno de la plantilla"
                className="min-h-24 w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
              />
            </label>

            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
                Tipo de servicio
                <select
                  value={form.service_type}
                  onChange={(event) =>
                    handleChange("service_type", event.target.value)
                  }
                  className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                >
                  {serviceTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
                Tecnología
                <select
                  value={form.installation_type}
                  onChange={(event) =>
                    handleChange("installation_type", event.target.value)
                  }
                  className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
                >
                  {installationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
              Duración estimada
              <input
                value={form.estimated_duration}
                onChange={(event) =>
                  handleChange("estimated_duration", event.target.value)
                }
                placeholder="Ej: 1 jornada"
                className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
              />
            </label>

            <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
              Alcance comercial
              <textarea
                value={form.default_public_scope}
                onChange={(event) =>
                  handleChange("default_public_scope", event.target.value)
                }
                placeholder="Texto que puede usarse como alcance visible para el cliente"
                className="min-h-24 w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
              />
            </label>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="mb-3 text-sm font-bold text-slate-700">
                Compatibilidades
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
                    className="flex items-center gap-2 text-sm font-medium text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(form[field as keyof FormState])}
                      onChange={(event) =>
                        handleChange(
                          field as keyof FormState,
                          event.target.checked,
                        )
                      }
                      className="h-4 w-4 accent-[#2D5398]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
              Notas de mano de obra
              <textarea
                value={form.default_labor_notes}
                onChange={(event) =>
                  handleChange("default_labor_notes", event.target.value)
                }
                placeholder="Ej: Incluye instalación, configuración y pruebas funcionales"
                className="min-h-24 w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
              />
            </label>

            <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
              Notas logísticas
              <textarea
                value={form.default_logistics_notes}
                onChange={(event) =>
                  handleChange("default_logistics_notes", event.target.value)
                }
                placeholder="Ej: Transporte urbano básico incluido"
                className="min-h-24 w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
              />
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  handleChange("active", event.target.checked)
                }
                className="h-4 w-4 accent-[#2D5398]"
              />
              Plantilla activa
            </label>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#2D5398]/20 transition hover:bg-[#234684] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Guardando..."
                : editingId
                  ? "Actualizar plantilla"
                  : "Crear plantilla"}
            </button>
          </div>
        </form>

        <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-[#1E293B]">
              Plantillas registradas
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Administra las estructuras reutilizables del negocio.
            </p>
          </div>

          <div className="mb-6 grid min-w-0 gap-3 md:grid-cols-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, código, descripción..."
              className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20 md:col-span-2"
            />

            <select
              value={serviceFilter}
              onChange={(event) => setServiceFilter(event.target.value)}
              className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
            >
              <option value="all">Todos los servicios</option>
              {serviceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-2 font-normal outline-none transition focus:border-[#2D5398] focus:ring-2 focus:ring-[#2D5398]/20"
            >
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
              <option value="all">Todas</option>
            </select>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
              Cargando plantillas...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
              No hay plantillas que coincidan con los filtros.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTemplates.map((template) => (
                <article
                  key={template.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#2D5398]/30 hover:shadow-md"
                >
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_120px]">
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold leading-tight text-slate-900">
                        {template.name}
                      </h3>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#2D5398]/10 px-3 py-1 text-xs font-bold text-[#2D5398]">
                          {template.template_code ?? "Sin código"}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            template.active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {template.active ? "Activa" : "Inactiva"}
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-500">
                        {template.description ||
                          "Plantilla sin descripción técnica registrada."}
                      </p>

                      {template.default_public_scope && (
                        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Alcance comercial
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {template.default_public_scope}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                          {getServiceTypeLabel(template.service_type)}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                          {getInstallationTypeLabel(template.installation_type)}
                        </span>

                        {template.estimated_duration && (
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            {template.estimated_duration}
                          </span>
                        )}

                        {template.compatible_analog && (
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            Análogo
                          </span>
                        )}

                        {template.compatible_ip && (
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            IP
                          </span>
                        )}

                        {template.compatible_wifi && (
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            WiFi
                          </span>
                        )}

                        {template.compatible_solar && (
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            Solar
                          </span>
                        )}

                        {template.compatible_ajax && (
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            AJAX
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row gap-2 lg:flex-col">
                      <button
                        type="button"
                        onClick={() => handleEdit(template)}
                        className="flex-1 rounded-xl border border-[#2D5398]/20 bg-[#2D5398]/10 px-3 py-2 text-xs font-bold text-[#2D5398] transition hover:bg-[#2D5398]/20"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleStatus(template)}
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                      >
                        {template.active ? "Desactivar" : "Activar"}
                      </button>

                      <button
                        type="button"
                        disabled={deletingId === template.id}
                        onClick={() => handleDelete(template)}
                        className="flex-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === template.id
                          ? "Eliminando..."
                          : "Eliminar"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
