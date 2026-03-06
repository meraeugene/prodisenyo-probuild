"use client";

import { useMemo, useState, useEffect } from "react";
import { UserCheck, UserX, Calendar, Clock, Banknote, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { EmployeeCalculated, PayrollSummary } from "@/app/types";
import { capitalize, formatNumber } from "@/app/lib/payroll";

interface SummaryCardsProps {
  summary: PayrollSummary;
  period: string;
  employees: EmployeeCalculated[];
}

type MemberGroup = "active" | "inactive" | null;

export default function SummaryCards({
  summary,
  period,
  employees,
}: SummaryCardsProps) {
  const [openGroup, setOpenGroup] = useState<MemberGroup>(null);

  const { activeMembers, inactiveMembers } = useMemo(() => {
    const active = employees.filter(
      (e) => e.days > 0 || e.regularHours > 0 || e.otHours > 0,
    );
    const inactive = employees.filter(
      (e) => !(e.days > 0 || e.regularHours > 0 || e.otHours > 0),
    );

    return {
      activeMembers: active,
      inactiveMembers: inactive,
    };
  }, [employees]);

  const groupMembers = openGroup === "active" ? activeMembers : inactiveMembers;

  useEffect(() => {
    if (!openGroup) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenGroup(null);
      }
    };

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openGroup]);

  const cards = [
    {
      label: "Active",
      value: activeMembers.length.toString(),
      sub: "Click to view names",
      icon: UserCheck,
      clickable: true,
      onClick: () => setOpenGroup("active" as const),
    },
    {
      label: "Inactive",
      value: inactiveMembers.length.toString(),
      sub: "Click to view names",
      icon: UserX,
      clickable: true,
      onClick: () => setOpenGroup("inactive" as const),
    },
    {
      label: "Total Days",
      value: formatNumber(summary.totalDays, 0),
      sub: "Across all staff",
      icon: Calendar,
    },
    {
      label: "Total Hours",
      value: formatNumber(summary.totalHours, 1),
      sub: "Regular + overtime",
      icon: Clock,
    },
    {
      label: "Gross Payroll",
      value: `\u20B1${formatNumber(summary.totalGross, 2)}`,
      sub: period,
      icon: Banknote,
      highlight: true,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {cards.map((card, i) => (
          <button
            key={i}
            onClick={card.onClick}
            disabled={!card.clickable}
            className={`
              text-left rounded-3xl p-5 border transition-all duration-200
              animate-fade-up
              ${
                card.highlight
                  ? "bg-apple-charcoal border-apple-charcoal text-white shadow-apple-lg"
                  : "bg-white border-apple-mist text-apple-charcoal shadow-apple-xs"
              }
              ${card.clickable ? "hover:-translate-y-0.5 hover:shadow-apple-lg cursor-pointer" : "cursor-default"}
            `}
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center
                  ${card.highlight ? "bg-white/10" : "bg-apple-snow"}`}
              >
                <card.icon
                  size={17}
                  className={
                    card.highlight ? "text-white" : "text-apple-charcoal"
                  }
                  strokeWidth={1.75}
                />
              </div>
              {card.clickable && (
                <span className="text-2xs font-semibold text-apple-steel">
                  View
                </span>
              )}
            </div>
            <p
              className={`text-2xs uppercase tracking-widest font-semibold mb-1
                ${card.highlight ? "text-white/70" : "text-apple-steel"}`}
            >
              {card.label}
            </p>
            <p
              className={`text-2xl font-bold tracking-tight mb-0.5
                ${card.highlight ? "text-white" : "text-apple-charcoal"}`}
            >
              {card.value}
            </p>
            <p
              className={`text-xs font-medium
                ${card.highlight ? "text-white/60" : "text-apple-steel"}`}
            >
              {card.sub}
            </p>
          </button>
        ))}
      </div>

      {openGroup &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/45 backdrop-blur-[1px] p-4 sm:p-8 overflow-hidden animate-overlay-in"
            onClick={() => setOpenGroup(null)}
          >
            <div
              className="max-w-2xl mx-auto my-4 bg-white rounded-lg border border-apple-mist shadow-apple-lg max-h-[85vh] overflow-y-auto animate-modal-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-apple-mist flex items-center justify-between sticky top-0 bg-white">
                <div>
                  <p className="text-2xs uppercase tracking-widest text-apple-steel font-semibold">
                    Employee List
                  </p>
                  <h3 className="text-lg font-bold text-apple-charcoal">
                    {openGroup === "active"
                      ? "Active Members"
                      : "Inactive Members"}
                  </h3>
                </div>
                <button
                  onClick={() => setOpenGroup(null)}
                  className="w-8 h-8 rounded-full border border-apple-silver flex items-center justify-center text-apple-steel hover:text-apple-charcoal hover:bg-apple-snow transition-colors"
                  aria-label="Close list"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-5">
                {groupMembers.length > 0 ? (
                  <ul className="space-y-2">
                    {groupMembers.map((member) => (
                      <li
                        key={member.id}
                        className="px-3 py-2 rounded-xl border border-apple-mist bg-apple-snow/40 text-sm text-apple-charcoal"
                      >
                        <span className="font-mono text-apple-steel mr-2">
                          #{member.id}
                        </span>
                        {capitalize(member.name)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-apple-steel">
                    No members in this group.
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
