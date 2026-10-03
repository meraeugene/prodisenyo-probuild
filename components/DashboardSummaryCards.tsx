import WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";
import type { LucideIcon } from "lucide-react";

export type DashboardSummaryCard = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
};

export default function DashboardSummaryCards({
  ariaLabel,
  cards,
  columnsClassName = "2xl:grid-cols-4",
}: {
  ariaLabel: string;
  cards: DashboardSummaryCard[];
  columnsClassName?: string;
}) {
  return <WorkspaceSummaryCards ariaLabel={ariaLabel} cards={cards.map(({ label, value }) => ({ label, value }))} className={columnsClassName} />;
}
