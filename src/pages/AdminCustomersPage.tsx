import { useEffect, useMemo, useState } from "react";
import { supabaseAdmin } from "../lib/supabase";

type Customer = {
  id: string;
  auth_user_id: string | null;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

const formatDate = (value: string | null) => {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
};

const getInitials = (name?: string | null, email?: string | null) => {
  const source = name?.trim() || email?.trim() || "Cliente";
  return source.charAt(0).toUpperCase();
};

export const AdminCustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabaseAdmin
        .from("customers")
        .select(
          "id, auth_user_id, email, full_name, phone, city, address, is_active, created_at, updated_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setErrorMessage("No fue posible cargar los clientes.");
        setCustomers([]);
      } else {
        setCustomers((data ?? []) as Customer[]);
      }

      setLoading(false);
    };

    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return customers.filter((customer) => {
      const matchesSearch =
        !normalizedSearch ||
        customer.full_name?.toLowerCase().includes(normalizedSearch) ||
        customer.email?.toLowerCase().includes(normalizedSearch) ||
        customer.phone?.toLowerCase().includes(normalizedSearch) ||
        customer.city?.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && customer.is_active !== false) ||
        (statusFilter === "inactive" && customer.is_active === false);

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    (customer) => customer.is_active !== false
  ).length;

  const inactiveCustomers = customers.filter(
    (customer) => customer.is_active === false
  ).length;

  const citiesCount = new Set(
    customers.map((customer) => customer.city?.trim()).filter(Boolean)
  ).size;

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] p-6 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
          CRM / Clientes
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          Gestión de clientes
        </h2>

        <p className="mt-2 max-w-3xl text-blue-100">
          Administra los clientes registrados, consulta información comercial
          y prepara la base del CRM enterprise de ADDA Seguridad.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total clientes
          </p>

          <p className="mt-2 text-3xl font-black text-slate-900">
            {totalCustomers}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Activos
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-600">
            {activeCustomers}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Inactivos
          </p>

          <p className="mt-2 text-3xl font-black text-rose-600">
            {inactiveCustomers}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Ciudades
          </p>

          <p className="mt-2 text-3xl font-black text-[#2D5398]">
            {citiesCount}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Clientes registrados
            </h2>

            <p className="text-sm text-slate-500">
              Consulta, filtra y revisa la información base de cada cliente.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              placeholder="Buscar por nombre, correo, celular o ciudad..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398] focus:bg-white focus:ring-4 focus:ring-blue-100 sm:w-80"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "all" | "active" | "inactive"
                )
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#2D5398] focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Cliente
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Contacto
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Ciudad
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Estado
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Registro
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      Cargando clientes...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <p className="text-sm font-semibold text-slate-700">
                        No se encontraron clientes.
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Ajusta la búsqueda o revisa si ya existen registros en
                        Supabase.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2D5398] text-sm font-bold text-white shadow-sm">
                            {getInitials(
                              customer.full_name,
                              customer.email
                            )}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {customer.full_name ||
                                "Cliente sin nombre"}
                            </p>

                            <p className="text-xs text-slate-500">
                              Cliente registrado
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-800">
                          {customer.email || "Sin correo"}
                        </p>

                        <p className="text-xs text-slate-500">
                          {customer.phone || "Sin celular"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {customer.city || "Sin ciudad"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={[
                            "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                            customer.is_active === false
                              ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                              : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
                          ].join(" ")}
                        >
                          {customer.is_active === false
                            ? "Inactivo"
                            : "Activo"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(customer.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};