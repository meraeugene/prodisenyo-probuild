"use client";
import { useState } from "react";
import type { GmeaRental, RentalEquipment, RentalExpense, RentalExpenseCategory, RentalVatMode } from "../types";
import { rentalVatBreakdown } from "../utils/expenseCalculations";
import { encodeRentalWeekNotes, rentalExpenseUserNotes, rentalWeekMetadata, type RentalWeekMetadata } from "../utils/rentalReportingWeeks";
import { useGmeaRentalOperationsMutation } from "./useGmeaRentalOperationsMutation";
export type Scope = "rental" | "equipment" | "general";
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
export function useGmeaRentalExpenseForm({ rental, equipment, categories, expense, weekContext, onClose, onSaved }: {
  rental?: GmeaRental; equipment: RentalEquipment[]; categories: RentalExpenseCategory[]; expense?: RentalExpense;
  weekContext?: RentalWeekMetadata; onClose: () => void; onSaved?: (week: RentalWeekMetadata) => void;
}) {
  const [week, setWeek] = useState(() => expense ? rentalWeekMetadata(expense.notes) : weekContext || null);
  const initialScope: Scope = expense?.rental_id
    ? "rental"
    : expense?.equipment_id || week?.section === "equipment"
      ? "equipment"
      : "general";
  const [scope, setScope] = useState<Scope>(initialScope);
  const [localError, setLocalError] = useState("");
  const [form, setForm] = useState({
    id: expense?.id ?? crypto.randomUUID(),
    equipment_id: expense?.equipment_id ?? "",
    category_id: expense?.category_id ?? categories.find(item => item.name === (week?.section === "salary" ? "Driver" : week?.section === "cash-advance" ? "Cash Advance" : "Diesel/Fuel"))?.id ?? categories[0]?.id ?? "",
    date: expense?.date ?? week?.start ?? today(),
    description: expense?.description ?? (week?.section === "salary" ? "Salary" : week?.section === "cash-advance" ? "Cash advance" : ""),
    supplier: expense?.supplier ?? (week && week.section !== "equipment" ? "Drivers" : ""),
    method: expense?.method ?? "",
    invoice_number: expense?.invoice_number ?? "",
    amount: expense?.amount.toString() ?? "",
    refunded_amount: expense?.refunded_amount.toString() ?? "0",
    vat_mode: expense?.vat_mode ?? ("off" as RentalVatMode),
    notes: rentalExpenseUserNotes(expense?.notes ?? ""),
    version: expense?.version ?? 1,
  });
  const { saveExpense, pending, error } =
    useGmeaRentalOperationsMutation(rental);
  const rentalEquipment = equipment.filter((item) =>
    rental?.items.some((row) => row.equipment_id === item.id),
  );
  const choices = scope === "rental" ? rentalEquipment : equipment;
  const vatRate = form.vat_mode === "off" ? 0 : 12;
  let totals = { base: 0, vat: 0, gross: 0 };
  try {
    totals = rentalVatBreakdown(
      Number(form.amount || 0),
      form.vat_mode,
      vatRate,
    );
  } catch {}
  const set = (key: keyof typeof form, value: string | number) =>
    setForm((current) => ({ ...current, [key]: value }));
  function changeScope(next: Scope) {
    setScope(next);
    setForm((current) => ({ ...current, equipment_id: "" }));
  }
  function submit() {
    if (scope === "rental" && !rental?.id && !expense?.rental_id) {
      setLocalError("Open a rental before linking an expense to it.");
      return;
    }
    if (scope === "equipment" && !form.equipment_id) {
      setLocalError("Select equipment for an equipment-only expense.");
      return;
    }
    let notes = form.notes;
    if (week) {
      try {
        if (form.date < week.start || form.date > week.end) throw new Error("Expense date must be within the selected week.");
        if (week.section === "equipment" && scope !== "equipment") throw new Error("Equipment expenses require related equipment.");
        if (week.section !== "equipment" && scope !== "general") throw new Error("Cash advances and salaries use general operations scope.");
        const original = expense ? rentalWeekMetadata(expense.notes) : null;
        const party = week.section === "equipment" ? original && expense?.equipment_id === form.equipment_id ? original.party : equipment.find(item => item.id === form.equipment_id)?.name || "" : form.supplier;
        notes = encodeRentalWeekNotes(form.notes, { ...week, party });
      } catch (cause) { setLocalError(cause instanceof Error ? cause.message : "Check the week dates and payee."); return; }
    }
    setLocalError("");
    void saveExpense(expense ?? null, {
      kind: expense ? "update" : "create",
      value: {
        ...form,
        notes,
        rental_id: scope === "rental" ? rental?.id ?? expense?.rental_id ?? null : null,
        equipment_id: scope === "general" ? null : form.equipment_id || null,
        amount: Number(form.amount),
        refunded_amount: Number(form.refunded_amount),
        vat_rate: vatRate,
      },
    })
      .then(() => { if (week) onSaved?.(week); onClose(); })
      .catch(() => undefined);
  }
  function changeWeek(next: RentalWeekMetadata) {
    setWeek(next);
    if (next.section !== week?.section) {
      changeScope(next.section === "equipment" ? "equipment" : "general");
      setForm(current => ({ ...current, description: next.section === "salary" ? "Salary" : next.section === "cash-advance" ? "Cash advance" : "", supplier: next.section === "equipment" ? "" : "Drivers", category_id: categories.find(item => item.name === (next.section === "salary" ? "Driver" : next.section === "cash-advance" ? "Cash Advance" : "Diesel/Fuel"))?.id || current.category_id }));
    }
  }
  return { week, scope, form, choices, totals, pending, error: localError || error, set, changeScope, changeWeek, submit };
}
