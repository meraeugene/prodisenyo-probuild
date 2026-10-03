"use client";

import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import { Users, Calendar, Clock, Banknote } from "lucide-react";
import type { PayrollSummary } from "@/types";
import { formatNumber } from "@/lib/payroll";

interface SummaryCardsProps {
  summary: PayrollSummary;
  period: string;
}

export default function SummaryCards({ summary, period }: SummaryCardsProps) {
  const cards = [
    {
      label: "Employees Processed",
      value: summary.totalEmployees.toString(),
      sub: "Included in this payroll",
      icon: Users,
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
      value: `₱${formatNumber(summary.totalGross, 2)}`,
      sub: period,
      icon: Banknote,
      highlight: true,
    },
  ];

  return <WorkspaceSummaryCards ariaLabel="Payroll calculation summary" cards={cards.map(card => ({ label: card.label, value: card.value, hint: card.sub }))} className="lg:grid-cols-4" />;
}
