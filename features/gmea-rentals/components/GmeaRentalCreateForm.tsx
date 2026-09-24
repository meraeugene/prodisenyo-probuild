"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createGmeaRentalAction } from "@/actions/gmeaRentals";
import { RATE_UNITS, RENTAL_STATUSES, type RentalEquipment } from "../types";
import {
  formatRentalMoney,
  rentalInputClass,
  rentalLabel,
  rentalSecondaryButtonClass,
} from "../utils/rentalUi";
import GmeaRentalsDialog from "./GmeaRentalsDialog";

type Item = {
  id: string;
  equipment_id: string;
  rate_type: string;
  unit_rate: string;
  quantity: string;
};
const newItem = (): Item => ({
  id: crypto.randomUUID(),
  equipment_id: "",
  rate_type: "day",
  unit_rate: "",
  quantity: "1",
});
export default function GmeaRentalCreateForm({
  equipment,
  onClose,
}: {
  equipment: RentalEquipment[];
  onClose: () => void;
}) {
  const router = useRouter(),
    [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    rental_number: "",
    client: "",
    location: "",
    start_date: "",
    end_date: "",
    notes: "",
    status: "draft",
  });
  const [items, setItems] = useState<Item[]>([newItem()]),
    [error, setError] = useState("");
  const available = equipment.filter(
    (item) =>
      item.is_active && !["maintenance", "inactive"].includes(item.status),
  );
  const updateItem = (id: string, patch: Partial<Item>) =>
    setItems((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  const subtotal = (item: Item) =>
    Number(item.unit_rate || 0) *
    Number(item.rate_type === "fixed" ? 1 : item.quantity || 0);
  const submit = () =>
    startTransition(async () => {
      setError("");
      try {
        const id = await createGmeaRentalAction({
          kind: "create",
          value: {
            ...form,
            status: form.status as "draft",
            items: items.map((item) => ({
              id: item.id,
              equipment_id: item.equipment_id,
              rate_type: item.rate_type as "day",
              unit_rate: Number(item.unit_rate),
              quantity: item.rate_type === "fixed" ? 1 : Number(item.quantity),
            })),
          },
        });
        router.push("/gmea-rentals/" + id);
        router.refresh();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Unable to create rental.",
        );
      }
    });
  return (
    <GmeaRentalsDialog
      title="New GMEA rental"
      description="Rental details and equipment billing"
      onClose={onClose}
      onSave={submit}
      pending={pending}
      error={error}
      saveLabel="Create rental"
      wide
    >
      <div className="space-y-6">
        <section className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,.055)] sm:p-7">
          <h2 className="text-lg font-semibold text-slate-950">
            Rental details
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Client, location, and reservation period.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {(
              [
                ["rental_number", "Rental number *"],
                ["client", "Client *"],
                ["location", "Location *"],
                ["start_date", "Start date *"],
                ["end_date", "End date *"],
              ] as const
            ).map(([key, name]) => (
              <label
                key={key}
                className="space-y-1.5 text-sm font-medium text-slate-700"
              >
                <span className="block">{name}</span>
                <input
                  type={key.includes("date") ? "date" : "text"}
                  value={form[key]}
                  onChange={(event) =>
                    setForm({ ...form, [key]: event.target.value })
                  }
                  className={rentalInputClass}
                />
              </label>
            ))}
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              <span className="block">Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value })
                }
                className={rentalInputClass}
              >
                {RENTAL_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {rentalLabel(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
              <span className="block">Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
                className={rentalInputClass + " min-h-24 py-3"}
              />
            </label>
          </div>
        </section>
        <section className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,.055)] sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Equipment items
              </h2>
              <p className="text-sm text-slate-500">
                Unit rate × manually entered quantity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setItems([...items, newItem()])}
              className={rentalSecondaryButtonClass}
            >
              <Plus size={15} aria-hidden="true" />
              Add unit
            </button>
          </div>
          <div className="mt-5 space-y-4">
            {items.map((item, index) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/35 p-4 sm:p-5"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Equipment unit {index + 1}
                  </h3>
                  <button
                    type="button"
                    aria-label={"Remove item " + (index + 1)}
                    disabled={items.length === 1}
                    onClick={() =>
                      setItems(items.filter((row) => row.id !== item.id))
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-30"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Remove
                  </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-1.5 text-sm font-medium text-slate-700 md:col-span-2">
                    <span className="block">Equipment</span>
                    <select
                      value={item.equipment_id}
                      onChange={(event) => {
                        const chosen = equipment.find(
                          (row) => row.id === event.target.value,
                        );
                        updateItem(item.id, {
                          equipment_id: event.target.value,
                          unit_rate:
                            chosen?.default_rate?.toString() ?? item.unit_rate,
                        });
                      }}
                      className={rentalInputClass}
                    >
                      <option value="">Select equipment</option>
                      {available.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.code} - {row.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">
                    <span className="block">Rate type</span>
                    <select
                      value={item.rate_type}
                      onChange={(event) =>
                        updateItem(item.id, {
                          rate_type: event.target.value,
                          quantity:
                            event.target.value === "fixed"
                              ? "1"
                              : item.quantity,
                        })
                      }
                      className={rentalInputClass}
                    >
                      {RATE_UNITS.map((value) => (
                        <option key={value} value={value}>
                          {rentalLabel(value)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">
                    <span className="block">Rate</span>
                    <input
                      type="number"
                      min="0"
                      step=".01"
                      value={item.unit_rate}
                      onChange={(event) =>
                        updateItem(item.id, { unit_rate: event.target.value })
                      }
                      className={rentalInputClass}
                    />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">
                    <span className="block">Quantity</span>
                    <input
                      type="number"
                      min="0.01"
                      step=".01"
                      disabled={item.rate_type === "fixed"}
                      value={item.rate_type === "fixed" ? "1" : item.quantity}
                      onChange={(event) =>
                        updateItem(item.id, { quantity: event.target.value })
                      }
                      className={rentalInputClass}
                    />
                  </label>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 xl:col-start-4">
                    <p className="text-xs text-slate-500">Subtotal</p>
                    <p className="mt-1 text-base font-semibold text-slate-950 tabular-nums">
                      {formatRentalMoney(subtotal(item))}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-5 flex justify-end border-t border-slate-200 pt-5">
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500">Rental total</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 tabular-nums">
                {formatRentalMoney(
                  items.reduce((sum, item) => sum + subtotal(item), 0),
                )}
              </p>
            </div>
          </div>
        </section>
      </div>
    </GmeaRentalsDialog>
  );
}
