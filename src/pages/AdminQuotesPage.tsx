import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { createQuoteVersion, duplicateQuote } from "../modules/quotes/services/quoteService";

type Quote = {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  technical_scope: string | null;
  customer_city: string | null;
  status:
    | "draft"
    | "sent"
    | "viewed"
    | "approved"
    | "rejected"
    | "expired";
  total: number;
  expiration_date: string;
  created_at: string;
  parent_quote_id: string | null;
  version_number: number | null;
  version_label: string | null;
};

type NewQuoteForm = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  project_name: string;
  project_address: string;
  city: string;
};

const initialForm: NewQuoteForm = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  project_name: "",
  project_address: "",
  city: "",
};

const moneyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export const AdminQuotesPage = () => {
  const navigate = useNavigate();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [modalError, setModalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<NewQuoteForm>(initialForm);
  const [duplicatingQuoteId, setDuplicatingQuoteId] = useState<string | null>(null);
  const [versioningQuoteId, setVersioningQuoteId] = useState<string | null>(null);

  const loadQuotes = async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("quotes")
      .select(
        "id, quote_number, customer_name, customer_phone, customer_email, technical_scope, customer_city, status, total, expiration_date, created_at, parent_quote_id, version_number, version_label"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando cotizaciones:", error);
      setErrorMessage(`No fue posible cargar las cotizaciones: ${error.message}`);
      setQuotes([]);
    } else {
      setQuotes((data ?? []) as Quote[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const filteredQuotes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return quotes.filter((quote) => {
      const matchesStatus =
        statusFilter === "todas" || quote.status === statusFilter;

      const searchableText = [
        quote.quote_number,
        quote.customer_name,
        quote.customer_phone,
        quote.customer_email,
        quote.technical_scope,
        quote.customer_city,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchableText.includes(normalizedSearch);
    });
  }, [quotes, searchTerm, statusFilter]);

  const totalQuotes = quotes.length;
  const approvedQuotes = quotes.filter((quote) => quote.status === "approved").length;
  const pendingQuotes = quotes.filter((quote) => quote.status === "draft").length;
  const projectedValue = quotes.reduce(
    (sum, quote) => sum + Number(quote.total ?? 0),
    0
  );

  const handleOpenModal = () => {
    setForm(initialForm);
    setSuccessMessage("");
    setErrorMessage("");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!saving) {
      setIsModalOpen(false);
      setForm(initialForm);
      setModalError("");
    }
  };

  const handleChange = (field: keyof NewQuoteForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) return;

    if (!form.customer_name.trim()) {
      setModalError("El nombre del cliente es obligatorio.");
      return;
    }

    setSaving(true);
    setModalError("");
    setErrorMessage("");
    setSuccessMessage("");

    const { data, error } = await supabase
      .from("quotes")
      .insert({
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim() || null,
        customer_email: form.customer_email.trim() || null,
        customer_city: form.city.trim() || null,
        project_address: form.project_address.trim() || null,
        technical_scope: form.project_name.trim() || null,
        status: "draft",
        validity_days: 7,
        issue_date: new Date().toISOString().split("T")[0],
        expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      })
      .select("id, quote_number")
      .single();

    if (error) {
      console.error("Error creando cotización:", error);
      setModalError(`No fue posible crear la cotización: ${error.message}`);
      setSaving(false);
      return;
    }

    setSuccessMessage(
      `Cotización creada correctamente${
        data?.quote_number ? `: ${data.quote_number}` : ""
      }.`
    );

    setIsModalOpen(false);
    setForm(initialForm);
    setSaving(false);

    await loadQuotes();
  };

  const handleDeleteDraftQuote = async (quote: Quote) => {
    if (quote.status !== "draft") {
      setErrorMessage("Solo se pueden eliminar cotizaciones en estado borrador.");
      return;
    }

    const confirmDelete = window.confirm(
      `¿Seguro que deseas eliminar la cotización ${quote.quote_number}? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("quotes")
      .delete()
      .eq("id", quote.id)
      .eq("status", "draft");

    if (error) {
      setErrorMessage(`No fue posible eliminar la cotización: ${error.message}`);
      return;
    }

    setSuccessMessage(`Cotización ${quote.quote_number} eliminada correctamente.`);
    await loadQuotes();
  };


  const handleDuplicateQuote = async (quote: Quote) => {
    setDuplicatingQuoteId(quote.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const duplicatedQuote = await duplicateQuote(quote.id);

      setSuccessMessage(
        `Cotización ${quote.quote_number} duplicada correctamente.`
      );

      await loadQuotes();

      navigate(`/admin/quotes/${duplicatedQuote.id}`);
    } catch (error) {
      const currentError = error as Error;

      setErrorMessage(
        `No fue posible duplicar la cotización: ${currentError.message}`
      );
    } finally {
      setDuplicatingQuoteId(null);
    }
  };


  const handleCreateQuoteVersion = async (quote: Quote) => {
    setVersioningQuoteId(quote.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const versionQuote = await createQuoteVersion(quote.id);

      setSuccessMessage(
        `Versión ${versionQuote.version_label ?? `V${versionQuote.version_number}`} creada correctamente desde ${quote.quote_number}.`
      );

      await loadQuotes();

      navigate(`/admin/quotes/${versionQuote.id}`);
    } catch (error) {
      const currentError = error as Error;

      setErrorMessage(
        `No fue posible crear la versión de la cotización: ${currentError.message}`
      );
    } finally {
      setVersioningQuoteId(null);
    }
  };

  const statusLabels = {
    draft: "Borrador",
    sent: "Enviada",
    viewed: "Vista",
    approved: "Aprobada",
    rejected: "Rechazada",
    expired: "Vencida",
  };

  return (
    <section className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2D5398]">
              ADDA Seguridad
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-800">
              Cotizaciones PRO
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Gestión profesional de cotizaciones técnicas y comerciales para
              proyectos CCTV, alarmas, redes y servicios especializados.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684]"
          >
            <span className="text-lg leading-none">+</span>
            Nueva cotización
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {successMessage}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Cotizaciones totales</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-800">{totalQuotes}</h2>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Aprobadas</p>
            <h2 className="mt-3 text-3xl font-bold text-emerald-600">
              {approvedQuotes}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Pendientes</p>
            <h2 className="mt-3 text-3xl font-bold text-amber-500">{pendingQuotes}</h2>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Valor proyectado</p>
            <h2 className="mt-3 text-3xl font-bold text-[#2D5398]">
              {moneyFormatter.format(projectedValue)}
            </h2>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-xl">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔎
              </span>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar cotización, cliente o proyecto..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#2D5398] focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: "Todas", value: "todas" },
                { label: "Borrador", value: "draft" },
                { label: "Enviadas", value: "sent" },
                { label: "Aprobadas", value: "approved" },
                { label: "Rechazadas", value: "rejected" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={
                    statusFilter === filter.value
                      ? "rounded-2xl bg-[#2D5398] px-4 py-2 text-sm font-semibold text-white"
                      : "rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                  }
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          {loading ? (
            <p className="py-10 text-center text-sm font-medium text-slate-500">
              Cargando cotizaciones...
            </p>
          ) : filteredQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2D5398]/10 text-4xl">
                📄
              </div>

              <h2 className="mt-6 text-2xl font-bold text-slate-800">
                No hay cotizaciones registradas
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
                Crea tu primera cotización profesional para proyectos CCTV, alarmas,
                mantenimiento, redes o servicios técnicos especializados.
              </p>

              <button
                type="button"
                onClick={handleOpenModal}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684]"
              >
                <span className="text-lg leading-none">+</span>
                Crear primera cotización
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Proyecto</th>
                    <th className="px-4 py-3">Ciudad</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Vence</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="border-b border-slate-100">
                      <td className="px-4 py-4">
                        <p className="font-bold text-[#2D5398]">
                          {quote.quote_number}
                        </p>
                        {quote.version_number && quote.version_number > 1 && (
                          <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
                            {quote.version_label ?? `V${quote.version_number}`}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-800">
                          {quote.customer_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {quote.customer_phone ?? "Sin teléfono"}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {quote.technical_scope ?? "Sin proyecto"}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {quote.customer_city ?? "Sin ciudad"}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {statusLabels[quote.status]}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-bold text-slate-800">
                        {moneyFormatter.format(Number(quote.total ?? 0))}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {quote.expiration_date}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/quotes/${quote.id}`)}
                            className="rounded-xl bg-[#2D5398]/10 px-3 py-2 text-xs font-bold text-[#2D5398] transition hover:bg-[#2D5398]/20"
                          >
                            Abrir
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicateQuote(quote)}
                            disabled={duplicatingQuoteId === quote.id}
                            className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                          >
                            {duplicatingQuoteId === quote.id
                              ? "Duplicando..."
                              : "Duplicar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCreateQuoteVersion(quote)}
                            disabled={versioningQuoteId === quote.id}
                            className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60"
                          >
                            {versioningQuoteId === quote.id
                              ? "Creando..."
                              : "Crear versión"}
                          </button>

                          {quote.status === "draft" ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteDraftQuote(quote)}
                              className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                            >
                              Eliminar
                            </button>
                          ) : (
                            <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-400">
                              Protegida
                            </span>
                          )}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Nueva cotización
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Registra la información inicial del cliente y del proyecto.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateQuote} className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Cliente *
                </label>

                <input
                  value={form.customer_name}
                  onChange={(event) => handleChange("customer_name", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Nombre del cliente"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Teléfono
                </label>

                <input
                  value={form.customer_phone}
                  onChange={(event) => handleChange("customer_phone", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="3000000000"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Correo
                </label>

                <input
                  value={form.customer_email}
                  onChange={(event) => handleChange("customer_email", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="cliente@correo.com"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Ciudad
                </label>

                <input
                  value={form.city}
                  onChange={(event) => handleChange("city", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Bogotá"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">
                  Nombre del proyecto
                </label>

                <input
                  value={form.project_name}
                  onChange={(event) => handleChange("project_name", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Instalación CCTV local comercial"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">
                  Dirección del proyecto
                </label>

                <input
                  value={form.project_address}
                  onChange={(event) => handleChange("project_address", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Dirección de instalación"
                />
              </div>

              <div className="flex justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar cotización"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};