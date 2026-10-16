import { useState } from "react";
import { gmeaProjects, equipment } from "../ceo/fixtures";
import { incomeRentals } from "./rentalIncomeFixtures";
import { rentalExpenseCategories, rentalExpenses } from "./rentalExpenseFixtures";
import GmeaProjectForm from "@/features/gmea-projects/components/GmeaProjectForm";
import GmeaExpenseForm from "@/features/gmea-projects/components/GmeaExpenseForm";
import GmeaCollectionForm from "@/features/gmea-projects/components/GmeaCollectionForm";
import GmeaReceiptForm from "@/features/gmea-projects/components/GmeaReceiptForm";
import GmeaVoidReceiptForm from "@/features/gmea-projects/components/GmeaVoidReceiptForm";
import GmeaPartnerForm from "@/features/gmea-projects/components/GmeaPartnerForm";
import GmeaCustomerIncomeForm from "@/features/gmea-rentals/components/GmeaCustomerIncomeForm";
import GmeaRentalExpenseEntry from "@/features/gmea-rentals/components/GmeaRentalExpenseEntry";
import GmeaRentalExpenseForm from "@/features/gmea-rentals/components/GmeaRentalExpenseForm";
import GmeaEquipmentFormDialog, { blankEquipmentForm } from "@/features/gmea-rentals/components/GmeaEquipmentFormDialog";
import GmeaRentalCreateForm from "@/features/gmea-rentals/components/GmeaRentalCreateForm";
import GmeaRentalPaymentForm from "@/features/gmea-rentals/components/GmeaRentalPaymentForm";
import GmeaRentalVoidPaymentForm from "@/features/gmea-rentals/components/GmeaRentalVoidPaymentForm";
import GmeaRentalWorkerForm from "@/features/gmea-rentals/components/GmeaRentalWorkerForm";
import GmeaRentalAssignmentForm from "@/features/gmea-rentals/components/GmeaRentalAssignmentForm";
import OperationExpenseForm from "@/features/gmea-operation-expenses/components/OperationExpenseForm";

export default function GmeaModalValidationHarness() {
  const [closed, setClosed] = useState(false);
  const [form, setForm] = useState(blankEquipmentForm);
  const name = new URLSearchParams(window.location.search).get("case");
  const onClose = () => setClosed(true);
  const project = gmeaProjects[0], rental = incomeRentals[0];
  const operations = { equipment, categories: rentalExpenseCategories, expenses: rentalExpenses, workers: [] };
  if (closed) return <p>Closed</p>;
  switch (name) {
    case "project-create": return <GmeaProjectForm onClose={onClose} />;
    case "project-edit": return <GmeaProjectForm project={project} onClose={onClose} />;
    case "project-expense": return <GmeaExpenseForm project={project} expenseOptions={{ suppliers: [], methods: [], invoiceNames: [] }} onClose={onClose} />;
    case "project-contract": return <GmeaCollectionForm project={project} onClose={onClose} />;
    case "project-payment": return <GmeaReceiptForm project={project} term={project.payment_terms[0]} onClose={onClose} />;
    case "project-void": return <GmeaVoidReceiptForm project={project} receipt={project.payment_terms[0].receipts[0]} onClose={onClose} />;
    case "project-partners": return <GmeaPartnerForm project={{ ...project, partners: [{ id: "partner", name: "", percentage: 0 }] }} onClose={onClose} />;
    case "rental-income": return <GmeaCustomerIncomeForm onClose={onClose} />;
    case "rental-expense-entry": return <GmeaRentalExpenseEntry operations={operations} onClose={onClose} />;
    case "rental-expense": return <GmeaRentalExpenseForm equipment={equipment} categories={rentalExpenseCategories} onClose={onClose} />;
    case "rental-week-expense": return <GmeaRentalExpenseForm equipment={equipment} categories={rentalExpenseCategories} weekContext={{ month: "2026-10", start: "2026-10-01", end: "2026-10-07", section: "equipment", party: "Equipment" }} onClose={onClose} />;
    case "equipment": return <GmeaEquipmentFormDialog equipment={null} form={form} onChange={(key, value) => setForm(current => ({ ...current, [key]: value }))} pending={false} error="" onClose={onClose} onSave={onClose} />;
    case "booking": return <GmeaRentalCreateForm equipment={equipment} onClose={onClose} />;
    case "rental-payment": return <GmeaRentalPaymentForm rental={rental} onClose={onClose} />;
    case "rental-void": return <GmeaRentalVoidPaymentForm rental={rental} payment={rental.payments[0]} onClose={onClose} />;
    case "worker": return <GmeaRentalWorkerForm rental={rental} onClose={onClose} />;
    case "assignment": return <GmeaRentalAssignmentForm rental={rental} workers={[]} onClose={onClose} />;
    case "operation-expense": return <OperationExpenseForm onClose={onClose} />;
    default: return <p>Unknown modal case</p>;
  }
}
