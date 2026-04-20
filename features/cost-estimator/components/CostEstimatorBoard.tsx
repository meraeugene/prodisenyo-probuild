"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { formatBudgetMoney } from "@/features/cost-estimator/utils/costEstimatorFormatters";
import type {
  ProjectEstimateDraftForm,
  ProjectEstimateRow,
} from "@/features/cost-estimator/types";

export default function CostEstimatorBoard({
  estimate,
  form,
  readOnly,
  disabled,
  onAddCost,
  onViewItem,
  onEditItem,
  onDeleteItem,
}: {
  estimate: ProjectEstimateRow | null;
  form: ProjectEstimateDraftForm;
  readOnly: boolean;
  disabled?: boolean;
  onAddCost: () => void;
  onViewItem: (indices: number[]) => void;
  onEditItem: (indices: number[]) => void;
  onDeleteItem: (indices: number[]) => void;
}) {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  useEffect(() => {
    if (disabled) {
      setOpenMenuIndex(null);
    }
  }, [disabled]);

  const groupedItems = useMemo(() => {
    const groups: Array<{
      key: string;
      title: string;
      indices: number[];
      total: number;
    }> = [];
    const groupMap = new Map<string, (typeof groups)[number]>();

    form.items.forEach((item, index) => {
      const baseTitle = (item.displayName || `Item ${index + 1}`).trim();
      const key = baseTitle.toLowerCase();
      const existing = groupMap.get(key);

      if (existing) {
        existing.indices.push(index);
        existing.total += item.lineTotal;
        return;
      }

      const group = {
        key,
        title: baseTitle,
        indices: [index],
        total: item.lineTotal,
      };
      groupMap.set(key, group);
      groups.push(group);
    });

    return groups;
  }, [form.items]);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-apple-charcoal">
              Estimate Items
            </h2>
          </div>
          <p className="mt-2 text-sm text-apple-smoke">
            {groupedItems.length} item{groupedItems.length === 1 ? "" : "s"}
          </p>
        </div>
        {!readOnly ? (
          <button
            type="button"
            onClick={onAddCost}
            disabled={!estimate || disabled}
            className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-emerald-200 bg-emerald-50 px-5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={16} />
            Add item
          </button>
        ) : null}
      </div>

      <div className="min-h-[520px] py-3 ">
        {groupedItems.length === 0 ? (
          <div className="flex min-h-[470px] items-center justify-center rounded-[12px] px-6 text-center text-sm leading-8 text-apple-steel">
            Add costs you expect for this project estimate.
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {groupedItems.map((group, index) => {
              const menuOpen = openMenuIndex === index;

              return (
                <div
                  key={`${group.key}-${index}`}
                  className="rounded-[14px] border border-apple-mist bg-white p-4 shadow-[0_8px_20px_rgba(24,83,43,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_14px_30px_rgba(24,83,43,0.12)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-apple-steel">
                        Item no. {index + 1}
                      </p>
                      <div className="mt-2 w-full flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-[#1f6a37]">
                          <ReceiptText size={16} />
                        </div>
                        <p className="truncate text-[17px] font-semibold tracking-[-0.02em] text-apple-charcoal">
                          {group.title || "Item description"}
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuIndex((current) =>
                            current === index ? null : index,
                          )
                        }
                        disabled={disabled}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-apple-mist text-apple-smoke transition hover:bg-apple-mist/40 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {menuOpen ? (
                        <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-40 overflow-hidden rounded-[12px] border border-apple-mist bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                          <button
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              if (disabled) return;
                              setOpenMenuIndex(null);
                              onViewItem(group.indices);
                            }}
                            disabled={disabled}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-apple-charcoal transition hover:bg-emerald-50"
                          >
                            <Eye size={14} />
                            View item cost
                          </button>
                          {!readOnly ? (
                            <button
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                if (disabled) return;
                                setOpenMenuIndex(null);
                                onEditItem(group.indices);
                              }}
                              disabled={disabled}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-apple-charcoal transition hover:bg-emerald-50"
                            >
                              <Pencil size={14} />
                              Edit item cost
                            </button>
                          ) : null}
                          {!readOnly ? (
                            <button
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                if (disabled) return;
                                setOpenMenuIndex(null);
                                onDeleteItem(group.indices);
                              }}
                              disabled={disabled}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                            >
                              <Trash2 size={14} />
                              Delete item cost
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-apple-smoke">
                    <span>Total estimate</span>
                    <span className="font-semibold text-[#1f6a37]">
                      {formatBudgetMoney(group.total)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
