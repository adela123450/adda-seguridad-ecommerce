import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabase";

interface IssuerProfile {
  id: string;
  profile_name: string;
  issuer_type: string;
  legal_name: string;
  commercial_name: string | null;
  document_type: string | null;
  document_number: string | null;
  tax_responsibility: string | null;
  city: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  bank_name: string | null;
  bank_account_type: string | null;
  bank_account_number: string | null;
  footer_notes: string | null;
  logo_url: string | null;
  is_default: boolean;
  is_active: boolean;
}

type IssuerProfileForm = {
  profile_name: string;
  issuer_type: string;
  legal_name: string;
  commercial_name: string;
  document_type: string;
  document_number: string;
  tax_responsibility: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  bank_name: string;
  bank_account_type: string;
  bank_account_number: string;
  footer_notes: string;
  logo_url: string;
  is_active: boolean;
};

const initialForm: IssuerProfileForm = {
  profile_name: "",
  issuer_type: "persona_natural",
  legal_name: "",
  commercial_name: "ADDA SEGURIDAD",
  document_type: "CC",
  document_number: "",
  tax_responsibility: "No responsable de IVA",
  city: "Villeta Cundinamarca",
  address: "",
  email: "addaseguridad23@gmail.com",
  phone: "",
  bank_name: "",
  bank_account_type: "Ahorros",
  bank_account_number: "",
  footer_notes:
    "Cotización válida por 7 días calendario. Sujeta a disponibilidad de inventario y variación de precios.",
  logo_url: "",
  is_active: true,
};

const buildFormFromProfile = (profile: IssuerProfile): IssuerProfileForm => ({
  profile_name: profile.profile_name ?? "",
  issuer_type: profile.issuer_type ?? "persona_natural",
  legal_name: profile.legal_name ?? "",
  commercial_name: profile.commercial_name ?? "",
  document_type: profile.document_type ?? "CC",
  document_number: profile.document_number ?? "",
  tax_responsibility: profile.tax_responsibility ?? "",
  city: profile.city ?? "",
  address: profile.address ?? "",
  email: profile.email ?? "",
  phone: profile.phone ?? "",
  bank_name: profile.bank_name ?? "",
  bank_account_type: profile.bank_account_type ?? "",
  bank_account_number: profile.bank_account_number ?? "",
  footer_notes: profile.footer_notes ?? "",
  logo_url: profile.logo_url ?? "",
  is_active: profile.is_active,
});

const cleanText = (value: string) => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

export const AdminIssuerProfilesPage = () => {
  const [profiles, setProfiles] = useState<IssuerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<IssuerProfile | null>(
    null,
  );
  const [form, setForm] = useState<IssuerProfileForm>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchProfiles = async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("quote_issuer_profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      setErrorMessage(`No fue posible cargar los perfiles: ${error.message}`);
      setProfiles([]);
    } else {
      setProfiles((data || []) as IssuerProfile[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleChange = (
    field: keyof IssuerProfileForm,
    value: string | boolean,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleOpenCreateModal = () => {
    setEditingProfile(null);
    setForm(initialForm);
    setErrorMessage("");
    setSuccessMessage("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (profile: IssuerProfile) => {
    setEditingProfile(profile);
    setForm(buildFormFromProfile(profile));
    setErrorMessage("");
    setSuccessMessage("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    setEditingProfile(null);
    setForm(initialForm);
    setErrorMessage("");
  };

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("quote_issuer_profiles")
      .update({
        is_active: !currentValue,
      })
      .eq("id", id);

    if (error) {
      setErrorMessage(`No fue posible actualizar el estado: ${error.message}`);
      return;
    }

    setSuccessMessage("Estado del perfil actualizado correctamente.");
    await fetchProfiles();
  };

  const handleSetDefault = async (id: string) => {
    setErrorMessage("");
    setSuccessMessage("");

    const { error: resetError } = await supabase
      .from("quote_issuer_profiles")
      .update({
        is_default: false,
      })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (resetError) {
      setErrorMessage(
        `No fue posible limpiar el perfil predeterminado: ${resetError.message}`,
      );
      return;
    }

    const { error } = await supabase
      .from("quote_issuer_profiles")
      .update({
        is_default: true,
        is_active: true,
      })
      .eq("id", id);

    if (error) {
      setErrorMessage(`No fue posible marcar como predeterminado: ${error.message}`);
      return;
    }

    setSuccessMessage("Perfil marcado como predeterminado correctamente.");
    await fetchProfiles();
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.profile_name.trim()) {
      setErrorMessage("El nombre de la plantilla es obligatorio.");
      return;
    }

    if (!form.legal_name.trim()) {
      setErrorMessage("La razón social o nombre legal es obligatorio.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      profile_name: form.profile_name.trim(),
      issuer_type: form.issuer_type.trim() || "persona_natural",
      legal_name: form.legal_name.trim(),
      commercial_name: cleanText(form.commercial_name),
      document_type: cleanText(form.document_type),
      document_number: cleanText(form.document_number),
      tax_responsibility: cleanText(form.tax_responsibility),
      city: cleanText(form.city),
      address: cleanText(form.address),
      email: cleanText(form.email),
      phone: cleanText(form.phone),
      bank_name: cleanText(form.bank_name),
      bank_account_type: cleanText(form.bank_account_type),
      bank_account_number: cleanText(form.bank_account_number),
      footer_notes: cleanText(form.footer_notes),
      logo_url: cleanText(form.logo_url),
      is_active: form.is_active,
    };

    try {
      if (editingProfile) {
        const { error } = await supabase
          .from("quote_issuer_profiles")
          .update(payload)
          .eq("id", editingProfile.id);

        if (error) throw error;

        setSuccessMessage("Perfil emisor actualizado correctamente.");
      } else {
        const { error } = await supabase
          .from("quote_issuer_profiles")
          .insert({
            ...payload,
            is_default: false,
          });

        if (error) throw error;

        setSuccessMessage("Perfil emisor creado correctamente.");
      }

      setIsModalOpen(false);
      setEditingProfile(null);
      setForm(initialForm);
      await fetchProfiles();
    } catch (error) {
      const currentError = error as Error;
      setErrorMessage(`No fue posible guardar el perfil: ${currentError.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-7xl rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Cargando perfiles emisores...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] p-6 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
            Centro de emisores
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Perfiles emisores ADDA
          </h2>

          <p className="mt-2 max-w-3xl text-blue-100">
            Administra las razones sociales, perfiles comerciales y
            configuraciones fiscales utilizadas en las cotizaciones.
          </p>

          <div className="mt-5">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              + Nuevo emisor
            </button>
          </div>
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

        <div className="grid gap-6 lg:grid-cols-2">
          {profiles.map((profile) => (
            <article
              key={profile.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-800">
                      {profile.profile_name}
                    </h2>

                    {profile.is_default && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Predeterminada
                      </span>
                    )}

                    {!profile.is_active && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        Inactiva
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {profile.issuer_type}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(profile)}
                    className="rounded-xl border border-[#2D5398]/30 px-4 py-2 text-sm font-semibold text-[#2D5398] transition hover:bg-[#2D5398]/10"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleToggleActive(profile.id, profile.is_active)
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    {profile.is_active ? "Desactivar" : "Activar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetDefault(profile.id)}
                    className="rounded-xl bg-[#2D5398] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#234684]"
                  >
                    Predeterminada
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Razón social
                  </p>

                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {profile.legal_name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {profile.commercial_name ?? "Sin nombre comercial"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Documento
                  </p>

                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {profile.document_type ?? "Documento"} •{" "}
                    {profile.document_number ?? "Sin número"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {profile.tax_responsibility ?? "Sin responsabilidad fiscal"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Contacto
                  </p>

                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {profile.phone ?? "Sin teléfono"}
                  </p>

                  <p className="text-sm text-slate-500">
                    {profile.email ?? "Sin correo"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Banco
                  </p>

                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {profile.bank_name ?? "Sin banco"}
                  </p>

                  <p className="text-sm text-slate-500">
                    {profile.bank_account_type ?? "Tipo de cuenta"} •{" "}
                    {profile.bank_account_number ?? "Sin número"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Nota comercial
                </p>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {profile.footer_notes ?? "Sin nota comercial registrada."}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D5398]">
                  {editingProfile ? "Editar emisor" : "Nuevo emisor"}
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-800">
                  {editingProfile
                    ? "Actualizar perfil emisor"
                    : "Crear perfil emisor"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Estos datos serán usados como datos maestros para nuevas
                  cotizaciones. Las cotizaciones antiguas conservarán su
                  snapshot histórico.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="w-fit rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Nombre de plantilla
                </label>
                <input
                  value={form.profile_name}
                  onChange={(event) =>
                    handleChange("profile_name", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Ej: Plantilla Adela"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Tipo de emisor
                </label>
                <select
                  value={form.issuer_type}
                  onChange={(event) =>
                    handleChange("issuer_type", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                >
                  <option value="persona_natural">Persona natural</option>
                  <option value="sas">S.A.S.</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Razón social / nombre legal
                </label>
                <input
                  value={form.legal_name}
                  onChange={(event) =>
                    handleChange("legal_name", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Nombre legal"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Nombre comercial
                </label>
                <input
                  value={form.commercial_name}
                  onChange={(event) =>
                    handleChange("commercial_name", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="ADDA Seguridad"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Tipo de documento
                </label>
                <input
                  value={form.document_type}
                  onChange={(event) =>
                    handleChange("document_type", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="CC / NIT"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Número de documento
                </label>
                <input
                  value={form.document_number}
                  onChange={(event) =>
                    handleChange("document_number", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Documento o NIT"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Responsabilidad fiscal
                </label>
                <input
                  value={form.tax_responsibility}
                  onChange={(event) =>
                    handleChange("tax_responsibility", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Responsable de IVA / No responsable de IVA"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Ciudad
                </label>
                <input
                  value={form.city}
                  onChange={(event) => handleChange("city", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Ciudad"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Dirección
                </label>
                <input
                  value={form.address}
                  onChange={(event) =>
                    handleChange("address", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Dirección comercial"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Teléfono
                </label>
                <input
                  value={form.phone}
                  onChange={(event) => handleChange("phone", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Teléfono"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Correo
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Correo"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Banco
                </label>
                <input
                  value={form.bank_name}
                  onChange={(event) =>
                    handleChange("bank_name", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Banco"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Tipo de cuenta
                </label>
                <input
                  value={form.bank_account_type}
                  onChange={(event) =>
                    handleChange("bank_account_type", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Ahorros / Corriente"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Número de cuenta
                </label>
                <input
                  value={form.bank_account_number}
                  onChange={(event) =>
                    handleChange("bank_account_number", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Número de cuenta"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  URL del logo
                </label>
                <input
                  value={form.logo_url}
                  onChange={(event) =>
                    handleChange("logo_url", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="URL pública del logo"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Nota comercial / footer
                </label>
                <textarea
                  value={form.footer_notes}
                  onChange={(event) =>
                    handleChange("footer_notes", event.target.value)
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2D5398] focus:bg-white"
                  placeholder="Condiciones comerciales"
                />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    handleChange("is_active", event.target.checked)
                  }
                  className="h-4 w-4 accent-[#2D5398]"
                />
                Perfil activo para nuevas cotizaciones
              </label>

              <div className="flex justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:opacity-60"
                >
                  {saving
                    ? "Guardando..."
                    : editingProfile
                      ? "Guardar cambios"
                      : "Crear emisor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
