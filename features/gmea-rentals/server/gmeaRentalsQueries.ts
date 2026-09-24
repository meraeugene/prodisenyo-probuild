import "server-only";
import { APP_ROLES, requireRole } from "@/lib/auth";
import type {
  GmeaRental,
  RentalEquipment,
  RentalExpense,
  RentalOperationsData,
  RentalPayment,
  RentalWorkerAssignment,
} from "../types";
import { gmeaRentalsReader } from "./gmeaRentalsDatabase";
import type { RentalAnalyticsData } from "../utils/rentalAnalytics";

export async function requireGmeaRentalsAccess(write = false) {
  return requireRole(write ? APP_ROLES.GMEA : [APP_ROLES.GMEA, APP_ROLES.CEO]);
}

export async function getGmeaRentalEquipment(): Promise<RentalEquipment[]> {
  await requireGmeaRentalsAccess();
  const db = await gmeaRentalsReader();
  const { data, error } = await db
    .from("gmea_rental_equipment")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name")
    .order("id");
  if (error) throw new Error("Unable to load equipment. " + error.message);
  return (data ?? []).map((row) => ({
    ...row,
    default_rate: row.default_rate === null ? null : Number(row.default_rate),
  })) as RentalEquipment[];
}

export async function getGmeaRentals(id?: string): Promise<GmeaRental[]> {
  await requireGmeaRentalsAccess();
  const db = await gmeaRentalsReader();
  let query = db
    .from("gmea_rentals")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id");
  if (id) query = query.eq("id", id);
  const { data: rentals, error } = await query;
  if (error) throw new Error("Unable to load rentals. " + error.message);
  const ids = (rentals ?? []).map((r) => r.id);
  const { data: items, error: itemError } = ids.length
    ? await db
        .from("gmea_rental_items")
        .select("*")
        .in("rental_id", ids)
        .order("created_at")
        .order("id")
    : { data: [], error: null };
  if (itemError)
    throw new Error("Unable to load rental equipment. " + itemError.message);
  const payments: RentalPayment[] = [];
  let assignments: RentalWorkerAssignment[] = [];
  if (id) {
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data: page, error: paymentError } = await db
        .from("gmea_rental_payments")
        .select("*")
        .eq("rental_id", id)
        .order("payment_date", { ascending: false })
        .order("recorded_at", { ascending: false })
        .order("id")
        .range(from, from + pageSize - 1);
      if (paymentError) {
        throw new Error(
          "Unable to load rental payments. " + paymentError.message,
        );
      }
      const rows = (page ?? []).map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
      })) as RentalPayment[];
      payments.push(...rows);
      if (rows.length < pageSize) break;
    }
    const { data: assignmentRows, error: assignmentError } = await db
      .from("gmea_rental_worker_assignments")
      .select("*")
      .eq("rental_id", id)
      .order("created_at")
      .order("id");
    if (assignmentError) {
      throw new Error(
        "Unable to load rental assignments. " + assignmentError.message,
      );
    }
    assignments = (assignmentRows ?? []) as RentalWorkerAssignment[];
  }
  return (rentals ?? []).map((r) => ({
    id: r.id,
    rental_number: r.rental_number,
    client: r.customer_name,
    location: r.site_location,
    start_date: r.start_date,
    end_date: r.expected_return_date ?? r.start_date,
    notes: r.notes,
    status: r.status,
    version: r.version,
    created_at: r.created_at,
    updated_at: r.updated_at,
    items: (items ?? [])
      .filter((item) => item.rental_id === r.id)
      .map((item) => {
        const unit_rate = Number(item.rate),
          quantity = Number(item.quantity);
        return {
          id: item.id,
          equipment_id: item.equipment_id,
          equipment_name: item.equipment_name,
          rate_type: item.rate_unit,
          unit_rate,
          quantity,
          subtotal: Math.round(unit_rate * quantity * 100) / 100,
        };
      }),
    payments: payments
      .filter((payment) => payment.rental_id === r.id)
      .map((payment) => ({ ...payment })),
    assignments: assignments.filter(
      (assignment) => assignment.rental_id === r.id,
    ),
  })) as GmeaRental[];
}

export async function getGmeaRentalOperations(): Promise<RentalOperationsData> {
  await requireGmeaRentalsAccess();
  const db = await gmeaRentalsReader();
  const [workerResult, categoryResult, equipment] = await Promise.all([
    db
      .from("gmea_rental_workers")
      .select("*")
      .order("status")
      .order("full_name")
      .order("id"),
    db
      .from("gmea_rental_expense_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    getGmeaRentalEquipment(),
  ]);
  if (workerResult.error) {
    throw new Error(
      "Unable to load rental workers. " + workerResult.error.message,
    );
  }
  if (categoryResult.error) {
    throw new Error(
      "Unable to load rental expense categories. " +
        categoryResult.error.message,
    );
  }
  const expenses: RentalExpense[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data: page, error } = await db
      .from("gmea_rental_expenses")
      .select("*")
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, from + pageSize - 1);
    if (error)
      throw new Error("Unable to load rental expenses. " + error.message);
    const rows = (page ?? []).map((expense) => ({
      id: expense.id,
      rental_id: expense.rental_id,
      equipment_id: expense.equipment_id,
      category_id: expense.category_id,
      date: expense.expense_date,
      description: expense.description,
      supplier: expense.supplier,
      method: expense.method,
      invoice_number: expense.invoice_number,
      amount: Number(expense.amount),
      refunded_amount: Number(expense.refunded_amount),
      vat_mode: expense.vat_mode,
      vat_rate: Number(expense.vat_rate),
      notes: expense.notes,
      version: expense.version,
      created_at: expense.created_at,
      updated_at: expense.updated_at,
    })) as RentalExpense[];
    expenses.push(...rows);
    if (rows.length < pageSize) break;
  }
  return {
    workers: (workerResult.data ?? []).map((worker) => ({
      id: worker.id,
      name: worker.full_name,
      role: worker.role_name,
      phone: worker.contact_number,
      is_active: worker.status === "active",
      version: worker.version,
      created_at: worker.created_at,
      updated_at: worker.updated_at,
    })) as RentalOperationsData["workers"],
    categories: categoryResult.data ?? [],
    expenses,
    equipment,
  };
}

export async function getGmeaRentalAnalytics(): Promise<RentalAnalyticsData> {
  await requireGmeaRentalsAccess();
  const [rentals, equipment, operations] = await Promise.all([
    getGmeaRentals(),
    getGmeaRentalEquipment(),
    getGmeaRentalOperations(),
  ]);
  const db = await gmeaRentalsReader();
  const payments: RentalPayment[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data: page, error } = await db
      .from("gmea_rental_payments")
      .select("*")
      .order("payment_date", { ascending: false })
      .order("recorded_at", { ascending: false })
      .order("id")
      .range(from, from + pageSize - 1);
    if (error)
      throw new Error("Unable to load rental payments. " + error.message);
    const rows = (page ?? []).map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
    })) as RentalPayment[];
    payments.push(...rows);
    if (rows.length < pageSize) break;
  }
  return {
    rentals,
    equipment,
    expenses: operations.expenses,
    categories: operations.categories,
    payments,
  };
}
