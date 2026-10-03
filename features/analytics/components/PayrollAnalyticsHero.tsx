import { BarChart3 } from "lucide-react";
import CeoBannerStatusCard from "@/components/CeoBannerStatusCard";
import DashboardPageHero from "@/components/DashboardPageHero";

export default function PayrollAnalyticsHero({ periodLabel }: { periodLabel?: string }) {
  return (
    <DashboardPageHero
      eyebrow="Data analytics" title="Payroll analytics"
      description="Follow payroll costs, workforce distribution, overtime, and project spending across every saved pay period."
      actions={<CeoBannerStatusCard icon={BarChart3} label="Selected period" value={periodLabel || "No saved period"} valueClassName="max-w-64 text-xs" />}
    />
  );
}
