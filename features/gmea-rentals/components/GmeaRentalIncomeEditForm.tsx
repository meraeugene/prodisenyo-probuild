"use client";
import { useState } from "react";
import { useGmeaCacheRefresh } from "@/features/gmea-forms/hooks/useGmeaCacheRefresh";
import { toast } from "sonner";
import { editGmeaRentalIncomeRecordAction } from "@/actions/gmeaRentalRecords";
import type { RentalIncomeRecord } from "../incomeTypes";
import { normalizeRentalIncomeRecordEdit, rentalIncomeRecordEdit } from "../utils/rentalIncomeRecordEditing";
import GmeaDialog from "@/features/gmea-projects/components/GmeaDialog";
import styles from "@/components/workspace/workspace.module.css";
import { withGmeaEntrySession } from "@/features/gmea-forms/components/GmeaEntrySession";
import GmeaCustomerIncomeForm from "./GmeaCustomerIncomeForm";

function GmeaRentalIncomeEditForm({ record, onClose }: { record: RentalIncomeRecord; onClose: () => void }) {
  const initial = rentalIncomeRecordEdit(record);
  const [form, setForm] = useState({ ...initial, amount: initial.charge?.toString() ?? "" });
  const refresh = useGmeaCacheRefresh();
  async function save() {
    const value = normalizeRentalIncomeRecordEdit({ ...form, charge: form.amount === "" ? null : Number(form.amount) });
    await editGmeaRentalIncomeRecordAction(value);
    toast.success("Rental income updated successfully.");
    refresh([["gmea-rental", record.id], "gmea-rentals:income-history", "gmea-rentals:list", "gmea-dashboard:overview"],
      { clients: value.client, locations: value.location, services: value.service });
  }
  return <GmeaDialog title="Edit rental income" description="Update the company, location, service, and rental amount." onClose={onClose} onSave={save} compact>
    <div className="grid gap-4">
      <label className={styles.field}>Company *<input required maxLength={200} className={styles.control} value={form.client} onChange={event => setForm({ ...form, client: event.target.value })} /></label>
      <label className={styles.field}>Location<input required={initial.origin === "customer"} maxLength={200} className={styles.control} value={form.location} onChange={event => setForm({ ...form, location: event.target.value })} /></label>
      <label className={styles.field}>Rental service<input readOnly={initial.origin === "booking"} maxLength={200} className={styles.control} value={form.service} onChange={event => setForm({ ...form, service: event.target.value })} /></label>
      <label className={styles.field}>Rental amount<input type="number" required={initial.origin === "customer"} readOnly={initial.origin === "booking"} min={initial.origin === "customer" ? "0.01" : "0"} max="10000000000" step="0.01" className={styles.control} value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} /></label>
    </div>
  </GmeaDialog>;
}

function IncomeEditorEntry({ record, onClose }: { record?: RentalIncomeRecord; onClose: () => void }) {
  return record ? <GmeaRentalIncomeEditForm record={record} onClose={onClose} /> : <GmeaCustomerIncomeForm onClose={onClose} />;
}
export default withGmeaEntrySession(IncomeEditorEntry, ["record"]);
