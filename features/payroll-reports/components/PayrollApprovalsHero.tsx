import { CheckCircle2, Clock3 } from "lucide-react";
import CeoBannerStatusCard from "@/components/CeoBannerStatusCard";
import DashboardPageHero from "@/components/DashboardPageHero";

export default function PayrollApprovalsHero({ pending }: { pending: number }) {
  return (
    <DashboardPageHero
      eyebrow="Prodisenyo / Payroll" title="Payroll"
      description="Review payroll runs, approve submissions, and explore payroll costs across project sites."
      actions={<CeoBannerStatusCard icon={pending ? Clock3 : CheckCircle2} label="Awaiting review" value={pending} />}
    />
  );
}
