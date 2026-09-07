"use client";
import { useState } from "react";
import type { GmeaProject, Quotation } from "../types";
import { buttonClass, secondaryClass } from "../utils/gmeaConstants";
import { formatMoney, quotationTotals } from "../utils/gmeaCalculations";
import { useGmeaMutation } from "../hooks/useGmeaMutation";
import GmeaQuotationForm from "./GmeaQuotationForm";
import GmeaConfirmButton from "./GmeaConfirmButton";

export default function GmeaQuotationsSection({
  project,
  canEdit,
}: {
  project: GmeaProject;
  canEdit: boolean;
}) {
  const [editor, setEditor] = useState<{
    quote?: Quotation;
    readOnly: boolean;
  } | null>(null);
  const save = useGmeaMutation(project);
  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Quotations</h2>
          <p className="mt-1 text-sm text-slate-500">
            One accepted quotation sets the contract value. Previous versions
            stay in history.
          </p>
        </div>
        {canEdit && (
          <button
            className={buttonClass}
            onClick={() => setEditor({ readOnly: false })}
          >
            New quotation
          </button>
        )}
      </header>
      {!project.quotations.length && (
        <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
          No quotations yet. Add items and accept a quotation when the client
          agrees.
        </p>
      )}
      {project.quotations.map((quote) => (
        <article
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
          key={quote.id}
        >
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-semibold">{quote.reference}</h3>
              <span
                className={
                  "rounded-full px-2.5 py-1 text-xs capitalize " +
                  (quote.status === "accepted"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600")
                }
              >
                {quote.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {quote.date} · {quote.items.length} items
            </p>
            <p className="mt-2 text-lg font-semibold">
              {formatMoney(quotationTotals(quote).gross)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={secondaryClass}
              onClick={() =>
                setEditor({
                  quote,
                  readOnly: !canEdit || quote.status !== "draft",
                })
              }
            >
              {canEdit && quote.status === "draft" ? "Edit" : "Details"}
            </button>
            {canEdit && (
              <button
                className={secondaryClass}
                onClick={() =>
                  setEditor({
                    quote: {
                      ...quote,
                      id: crypto.randomUUID(),
                      reference: quote.reference.slice(0, 90) + " Rev",
                      status: "draft",
                    },
                    readOnly: false,
                  })
                }
              >
                Create revision
              </button>
            )}
            {canEdit && quote.status === "draft" && (
              <>
                <GmeaConfirmButton
                  label="Accept quotation"
                  description="This quotation will become the current contract. The previous accepted version will remain in history. Payment milestone amounts will recalculate using the new contract."
                  onConfirm={() => save({ kind: "accept", id: quote.id })}
                />
                <GmeaConfirmButton
                  label="Delete draft"
                  danger
                  description="Remove this draft and its items? Accepted quotations are kept in history."
                  onConfirm={() =>
                    save({ kind: "delete", entity: "quotation", id: quote.id })
                  }
                />
              </>
            )}
          </div>
        </article>
      ))}
      {editor && (
        <GmeaQuotationForm
          project={project}
          quotation={editor.quote}
          readOnly={editor.readOnly}
          onClose={() => setEditor(null)}
        />
      )}
    </section>
  );
}
