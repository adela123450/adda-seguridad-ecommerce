import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { supabaseAdmin } from "../lib/supabase";

type BusinessExpense = {
  id: string;
  expense_date: string;
  category: string;
  description: string | null;
  amount: number | string;
  created_at: string;
};

type ExpenseFormData = {
  expense_date: string;
  category: string;
  description: string;
  amount: string;
};

type CategoryFilter = "all" | string;

const EXPENSE_CATEGORIES = [
  "Publicidad y mercadeo",
  "Transporte y logística",
  "Comisiones de pasarela",
  "Comisiones bancarias",
  "Instalación y mano de obra",
  "Herramientas y consumibles",
  "Garantías y devoluciones",
  "Servicios públicos",
  "Arriendo",
  "Nómina y honorarios",
  "Software y suscripciones",
  "Mantenimiento de equipos",
  "Impuestos y tasas",
  "Gastos administrativos",
  "Otros gastos operativos",
];

const todayIso = () => new Date().toISOString().slice(0, 10);

const formatPrice = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

export const AdminExpensesPage = () => {
  const [expenses, setExpenses] = useState<BusinessExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseMessage, setExpenseMessage] = useState<string | null>(null);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const [expenseForm, setExpenseForm] = useState<ExpenseFormData>({
    expense_date: todayIso(),
    category: EXPENSE_CATEGORIES[0],
    description: "",
    amount: "",
  });

  useEffect(() => {
    const loadExpenses = async () => {
      setLoading(true);

      const { data, error } = await supabaseAdmin
        .from("business_expenses")
        .select("id, expense_date, category, description, amount, created_at")
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error cargando gastos operativos:", error.message);
        setExpenses([]);
        setExpenseError("No fue posible cargar los gastos operativos.");
      } else {
        setExpenses((data ?? []) as BusinessExpense[]);
      }

      setLoading(false);
    };

    loadExpenses();
  }, []);

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === "all") return expenses;

    return expenses.filter((expense) => expense.category === categoryFilter);
  }, [expenses, categoryFilter]);

  const totalExpenses = filteredExpenses.reduce(
    (total, expense) => total + Number(expense.amount ?? 0),
    0
  );

  const categorySummary = useMemo(() => {
    const rows = new Map<string, number>();

    expenses.forEach((expense) => {
      rows.set(
        expense.category,
        (rows.get(expense.category) ?? 0) + Number(expense.amount ?? 0)
      );
    });

    return Array.from(rows.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const handleExpenseChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setExpenseForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setExpenseMessage(null);
    setExpenseError(null);
  };

  const handleExpenseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number(expenseForm.amount);

    if (!expenseForm.expense_date) {
      setExpenseError("Debes seleccionar la fecha del gasto.");
      return;
    }

    if (!expenseForm.category) {
      setExpenseError("Debes seleccionar una categoría contable.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setExpenseError("El valor del gasto debe ser mayor a cero.");
      return;
    }

    try {
      setSavingExpense(true);
      setExpenseError(null);
      setExpenseMessage(null);

      const { data, error } = await supabaseAdmin
        .from("business_expenses")
        .insert([
          {
            expense_date: expenseForm.expense_date,
            category: expenseForm.category,
            description: expenseForm.description.trim() || null,
            amount,
          },
        ])
        .select("id, expense_date, category, description, amount, created_at")
        .single();

      if (error) throw error;

      setExpenses((prev) => [data as BusinessExpense, ...prev]);

      setExpenseForm({
        expense_date: todayIso(),
        category: EXPENSE_CATEGORIES[0],
        description: "",
        amount: "",
      });

      setExpenseMessage("Gasto registrado correctamente.");
    } catch (error) {
      console.error("Error registrando gasto:", error);
      setExpenseError(
        error instanceof Error
          ? error.message
          : "No fue posible registrar el gasto."
      );
    } finally {
      setSavingExpense(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] p-6 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
          Gastos operativos
        </p>

        <h1 className="mt-2 text-3xl font-bold">Gestión de gastos ADDA</h1>

        <p className="mt-2 max-w-3xl text-blue-100">
          Registra y consulta gastos operativos para alimentar la utilidad neta
          del panel financiero.
        </p>
      </div>

      <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            Registrar gasto operativo
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Usa categorías contables consistentes para medir rentabilidad real.
          </p>
        </div>

        <form
          onSubmit={handleExpenseSubmit}
          className="grid gap-4 md:grid-cols-[0.8fr_1.2fr_1.5fr_0.9fr_auto]"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Fecha
            </label>
            <input
              type="date"
              name="expense_date"
              value={expenseForm.expense_date}
              onChange={handleExpenseChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Categoría
            </label>
            <select
              name="category"
              value={expenseForm.category}
              onChange={handleExpenseChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Descripción
            </label>
            <input
              type="text"
              name="description"
              value={expenseForm.description}
              onChange={handleExpenseChange}
              placeholder="Ej. Meta Ads campaña CCTV"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Valor
            </label>
            <input
              type="number"
              name="amount"
              value={expenseForm.amount}
              onChange={handleExpenseChange}
              min="0"
              step="100"
              placeholder="200000"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={savingExpense}
              className="w-full rounded-xl bg-[#2D5398] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234684] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingExpense ? "Guardando..." : "Guardar gasto"}
            </button>
          </div>
        </form>

        {expenseMessage && (
          <p className="mt-4 rounded-2xl bg-green-50 p-4 text-sm font-medium text-green-700">
            {expenseMessage}
          </p>
        )}

        {expenseError && (
          <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
            {expenseError}
          </p>
        )}
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-red-200">
          <p className="text-sm font-semibold text-slate-500">
            Total gastos filtrados
          </p>
          <h2 className="mt-3 text-3xl font-bold text-red-700">
            {formatPrice(totalExpenses)}
          </h2>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-200">
          <p className="text-sm font-semibold text-slate-500">
            Registros filtrados
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[#2D5398]">
            {filteredExpenses.length}
          </h2>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-slate-500">
            Categorías usadas
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">
            {categorySummary.length}
          </h2>
        </article>
      </div>

      <div className="mb-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Filtrar por categoría
        </label>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="w-full max-w-md rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2D5398]"
        >
          <option value="all">Todas las categorías</option>
          {EXPENSE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            Resumen por categoría
          </h2>

          <div className="mt-5 space-y-3">
            {categorySummary.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                Aún no hay gastos registrados.
              </p>
            ) : (
              categorySummary.map((row) => (
                <div
                  key={row.category}
                  className="rounded-2xl bg-slate-50 p-4"
                >
                  <p className="font-semibold text-slate-900">{row.category}</p>
                  <p className="mt-1 text-sm font-bold text-red-700">
                    {formatPrice(row.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            Historial de gastos
          </h2>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                Cargando gastos...
              </p>
            ) : filteredExpenses.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                No hay gastos para mostrar.
              </p>
            ) : (
              filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_0.7fr]"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {expense.category}
                    </p>
                    <p className="text-sm text-slate-500">
                      {expense.description || "Sin descripción"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(expense.expense_date)}
                    </p>
                  </div>

                  <div className="md:text-right">
                    <p className="text-sm text-slate-500">Valor</p>
                    <p className="font-bold text-red-700">
                      {formatPrice(Number(expense.amount ?? 0))}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
};