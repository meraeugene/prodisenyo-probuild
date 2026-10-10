"use client";

import { useState, useTransition } from "react";
import useSWR from "swr";
import {
  getGmeaRentalEquipmentAction,
  getGmeaRentalOperationsAction,
  getGmeaRentalsAction,
  saveGmeaRentalEquipmentAction,
} from "@/actions/gmeaRentals";
import type { GmeaRental, RentalEquipment, RentalOperationsData } from "../types";
import GmeaEquipmentFormDialog, {
  blankEquipmentForm,
  type EquipmentFormState,
} from "./GmeaEquipmentFormDialog";


import GmeaRentalCreateForm from "./GmeaRentalCreateForm";
import GmeaRentalsHeader from "./GmeaRentalsHeader";
import RentalRecordsWorkspace from "./RentalRecordsWorkspace";
import CeoPageHeader from "@/features/ceo-workspace/components/CeoPageHeader";

export default function GmeaRentalsPage({
  equipment,
  rentals,
  canEdit,
  initialOperations,
}: {
  equipment: RentalEquipment[];
  rentals: GmeaRental[];
  canEdit: boolean;
  initialOperations: RentalOperationsData;
}) {
  const { data: items = equipment, mutate } = useSWR(
    "gmea-rentals:equipment",
    getGmeaRentalEquipmentAction,
    {
      fallbackData: equipment,
      revalidateOnFocus: false,
      refreshInterval: canEdit ? 0 : 30000,
    },
  );
  const { data: rentalRows = rentals } = useSWR(
    "gmea-rentals:list",
    getGmeaRentalsAction,
    { fallbackData: rentals, refreshInterval: canEdit ? 0 : 30000 },
  );
  const { data: operations = initialOperations, error: operationsError } = useSWR("gmea-rentals:operations", getGmeaRentalOperationsAction, {
    fallbackData: initialOperations, revalidateOnFocus: !canEdit, refreshInterval: canEdit ? 0 : 30000,
  });
  const [selected, setSelected] = useState<
    RentalEquipment | null | undefined
  >();
  const [form, setForm] = useState<EquipmentFormState>(blankEquipmentForm);
  const [error, setError] = useState("");
  const [creatingRental, setCreatingRental] = useState(false);
  const [pending, startTransition] = useTransition();

  function updateForm<K extends keyof EquipmentFormState>(
    key: K,
    value: EquipmentFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openEquipment(item?: RentalEquipment) {
    setError("");
    setSelected(item ?? null);
    setForm(
      item
        ? {
            code: item.code,
            name: item.name,
            equipment_type: item.equipment_type,
            plate_number: item.plate_number,
            default_rate: item.default_rate?.toString() ?? "",
            rate_unit: item.rate_unit ?? "",
            notes: item.notes,
            status: item.status,
            is_active: item.is_active,
          }
        : blankEquipmentForm(),
    );
  }

  function saveEquipment() {
    startTransition(async () => {
      try {
        await saveGmeaRentalEquipmentAction(
          selected?.id ?? null,
          selected?.version ?? null,
          {
            kind: selected ? "update" : "create",
            value: {
              ...form,
              default_rate: form.default_rate
                ? Number(form.default_rate)
                : null,
              rate_unit: (form.rate_unit ||
                null) as RentalEquipment["rate_unit"],
              status: form.status as RentalEquipment["status"],
            },
          },
        );
        await mutate();
        setSelected(undefined);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Unable to save equipment.",
        );
      }
    });
  }

  async function deactivateEquipment(item: RentalEquipment) {
    await saveGmeaRentalEquipmentAction(item.id, item.version, { kind: "deactivate" });
    await mutate();
  }

  return (
    <main className={`min-h-full ${canEdit ? "bg-white" : "bg-[#f5f6f8]"} px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8`}>
      <div className="mx-auto max-w-[1440px] space-y-4">
        {canEdit ? <GmeaRentalsHeader
          canEdit={canEdit}
          onAddEquipment={() => openEquipment()}
          onCreateRental={() => setCreatingRental(true)}
        /> : <CeoPageHeader eyebrow="GMEA / Rentals" title="Rentals" description="Review weekly and monthly expenses, rental schedules, and equipment." />}

        {error && selected === undefined && (
          <p
            role="alert"
            className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
          >
            {error}
          </p>
        )}

        {operationsError && <p role="alert" className="rounded bg-rose-50 p-3 text-sm text-rose-700">Unable to refresh rental expenses. Reload to try again.</p>}
        <RentalRecordsWorkspace rentals={rentalRows} equipment={items} operations={{ ...operations, equipment: items }} pending={pending}
          onEditEquipment={canEdit ? openEquipment : undefined}
          onDeactivateEquipment={canEdit ? deactivateEquipment : undefined} />
      </div>

      {selected !== undefined && (
        <GmeaEquipmentFormDialog
          equipment={selected}
          form={form}
          onChange={updateForm}
          onClose={() => setSelected(undefined)}
          onSave={saveEquipment}
          pending={pending}
          error={error}
        />
      )}
      {creatingRental && (
        <GmeaRentalCreateForm
          equipment={items}
          onClose={() => setCreatingRental(false)}
        />
      )}
    </main>
  );
}
