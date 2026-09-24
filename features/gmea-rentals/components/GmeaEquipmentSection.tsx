import { ListFilter, Pencil, Power, Search } from "lucide-react";
import { EQUIPMENT_STATUSES, type RentalEquipment } from "../types";
import {
  formatRentalMoney,
  rentalInputClass,
  rentalLabel,
} from "../utils/rentalUi";
import RentalStatusBadge from "./RentalStatusBadge";

function EquipmentActions({
  item,
  pending,
  onEdit,
  onDeactivate,
}: {
  item: RentalEquipment;
  pending: boolean;
  onEdit: (item: RentalEquipment) => void;
  onDeactivate: (item: RentalEquipment) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => onEdit(item)}
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
      >
        <Pencil size={14} aria-hidden="true" /> Edit
      </button>
      {item.is_active && (
        <button
          type="button"
          disabled={pending}
          onClick={() => onDeactivate(item)}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
        >
          <Power size={14} aria-hidden="true" /> Deactivate
        </button>
      )}
    </div>
  );
}

export default function GmeaEquipmentSection({
  items,
  total,
  query,
  status,
  activity,
  canEdit,
  pending,
  onQueryChange,
  onStatusChange,
  onActivityChange,
  onEdit,
  onDeactivate,
  onClear,
}: {
  items: RentalEquipment[];
  total: number;
  query: string;
  status: string;
  activity: string;
  canEdit: boolean;
  pending: boolean;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onActivityChange: (value: string) => void;
  onEdit: (item: RentalEquipment) => void;
  onDeactivate: (item: RentalEquipment) => void;
  onClear: () => void;
}) {
  const hasFilters =
    Boolean(query.trim()) || status !== "all" || activity !== "all";

  return (
    <section className="pt-3" aria-labelledby="equipment-heading">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2
            id="equipment-heading"
            className="text-[20px] font-bold tracking-[-0.035em] text-slate-950"
          >
            Equipment
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {items.length} {items.length === 1 ? "unit" : "units"}
            {hasFilters ? ` of ${total} shown` : " in inventory"}
            {hasFilters && (
              <button
                type="button"
                onClick={onClear}
                className="ml-3 text-teal-700 underline underline-offset-2 hover:text-teal-900"
              >
                Clear filters
              </button>
            )}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:max-w-3xl">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search equipment</span>
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search name, type, asset code, or plate..."
              className={rentalInputClass + " pl-11"}
            />
          </label>
          <label className="relative">
            <span className="sr-only">Filter equipment status</span>
            <ListFilter
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
              className={rentalInputClass + " pl-10 sm:w-44"}
            >
              <option value="all">All statuses</option>
              {EQUIPMENT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {rentalLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <select
            aria-label="Filter equipment activity"
            value={activity}
            onChange={(event) => onActivityChange(event.target.value)}
            className={rentalInputClass + " sm:w-44"}
          >
            <option value="all">Active and inactive</option>
            <option value="true">Active only</option>
            <option value="false">Inactive only</option>
          </select>
        </div>
      </div>

      {!items.length ? (
        <div className="mt-4 rounded-[16px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-900">
            No equipment found
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {total
              ? "Try a different search or filter."
              : "Add equipment to begin building the rental inventory."}
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-[16px] border border-slate-200/80 bg-white shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)]">
          <div className="divide-y divide-slate-100 sm:hidden">
            {items.map((item) => (
              <article key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">
                      {item.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.equipment_type} · {item.code}
                    </p>
                  </div>
                  <RentalStatusBadge status={item.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Plate</dt>
                    <dd className="mt-0.5">{item.plate_number || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Default rate</dt>
                    <dd className="mt-0.5">
                      {item.default_rate === null
                        ? "—"
                        : formatRentalMoney(item.default_rate)}
                      {item.rate_unit
                        ? ` / ${rentalLabel(item.rate_unit)}`
                        : ""}
                    </dd>
                  </div>
                </dl>
                {canEdit && (
                  <div className="mt-3 border-t border-slate-100 pt-2">
                    <EquipmentActions
                      item={item}
                      pending={pending}
                      onEdit={onEdit}
                      onDeactivate={onDeactivate}
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Equipment</th>
                  <th className="px-4 py-3.5">Asset code</th>
                  <th className="px-4 py-3.5">Plate</th>
                  <th className="px-4 py-3.5">Default rate</th>
                  <th className="px-4 py-3.5">Status</th>
                  {canEdit && (
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="text-slate-700 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-950">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.equipment_type}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-medium">{item.code}</td>
                    <td className="px-4 py-4">{item.plate_number || "—"}</td>
                    <td className="px-4 py-4">
                      {item.default_rate === null
                        ? "—"
                        : formatRentalMoney(item.default_rate)}
                      {item.rate_unit ? (
                        <span className="text-xs text-slate-500">
                          {" "}
                          / {rentalLabel(item.rate_unit)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <RentalStatusBadge status={item.status} />
                    </td>
                    {canEdit && (
                      <td className="px-5 py-4">
                        <EquipmentActions
                          item={item}
                          pending={pending}
                          onEdit={onEdit}
                          onDeactivate={onDeactivate}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
