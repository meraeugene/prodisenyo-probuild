"use client";

import { useMemo, useState, useTransition } from "react";
import useSWR from "swr";
import {
  getGmeaRentalEquipmentAction,
  saveGmeaRentalEquipmentAction,
} from "@/actions/gmeaRentals";
import type { GmeaRental, RentalEquipment } from "../types";
import GmeaEquipmentFormDialog, {
  blankEquipmentForm,
  type EquipmentFormState,
} from "./GmeaEquipmentFormDialog";
import GmeaEquipmentSection from "./GmeaEquipmentSection";
import GmeaRentalPortfolioCard from "./GmeaRentalPortfolioCard";
import GmeaRentalCreateForm from "./GmeaRentalCreateForm";
import GmeaRentalsHeader from "./GmeaRentalsHeader";
import GmeaRentalsSummary from "./GmeaRentalsSummary";
import GmeaRentalsAnalyticsNav from "./GmeaRentalsAnalyticsNav";

export default function GmeaRentalsPage({
  equipment,
  rentals,
  canEdit,
}: {
  equipment: RentalEquipment[];
  rentals: GmeaRental[];
  canEdit: boolean;
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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [activity, setActivity] = useState("all");
  const [selected, setSelected] = useState<
    RentalEquipment | null | undefined
  >();
  const [form, setForm] = useState<EquipmentFormState>(blankEquipmentForm);
  const [error, setError] = useState("");
  const [creatingRental, setCreatingRental] = useState(false);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(
    () =>
      items.filter((item) => {
        const found = [
          item.name,
          item.equipment_type,
          item.code,
          item.plate_number,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());
        return (
          found &&
          (status === "all" || item.status === status) &&
          (activity === "all" || String(item.is_active) === activity)
        );
      }),
    [activity, items, query, status],
  );

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

  function deactivateEquipment(item: RentalEquipment) {
    startTransition(async () => {
      if (!window.confirm("Deactivate " + item.name + "?")) return;
      try {
        await saveGmeaRentalEquipmentAction(item.id, item.version, {
          kind: "deactivate",
        });
        await mutate();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to deactivate equipment.",
        );
      }
    });
  }

  return (
    <main className="min-h-full bg-white px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8">
      <div className="mx-auto max-w-[1440px] space-y-4">
        <GmeaRentalsHeader
          canEdit={canEdit}
          onAddEquipment={() => openEquipment()}
          onCreateRental={() => setCreatingRental(true)}
        />
        <GmeaRentalsAnalyticsNav />
        <GmeaRentalsSummary rentals={rentals} equipment={items} />

        {error && selected === undefined && (
          <p
            role="alert"
            className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
          >
            {error}
          </p>
        )}

        <section className="pt-3" aria-labelledby="rentals-heading">
          <div>
            <h2
              id="rentals-heading"
              className="text-[20px] font-bold tracking-[-0.035em] text-slate-950"
            >
              All rentals
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {rentals.length} {rentals.length === 1 ? "rental" : "rentals"} in
              your workspace
            </p>
          </div>
          {rentals.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {rentals.map((rental) => (
                <GmeaRentalPortfolioCard key={rental.id} rental={rental} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[16px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <p className="text-sm font-semibold text-slate-900">
                No rentals yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Your rental workspace is ready for its first rental.
              </p>
            </div>
          )}
        </section>

        <GmeaEquipmentSection
          items={visible}
          total={items.length}
          query={query}
          status={status}
          activity={activity}
          canEdit={canEdit}
          pending={pending}
          onQueryChange={setQuery}
          onStatusChange={setStatus}
          onActivityChange={setActivity}
          onEdit={openEquipment}
          onDeactivate={deactivateEquipment}
          onClear={() => {
            setQuery("");
            setStatus("all");
            setActivity("all");
          }}
        />
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
