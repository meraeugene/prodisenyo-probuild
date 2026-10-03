import { CheckCircle2, Clock3 } from "lucide-react";
import CeoBannerStatusCard from "@/components/CeoBannerStatusCard";
import DashboardPageHero from "@/components/DashboardPageHero";

export default function OvertimeApprovalsHero({ pending }: { pending: number }) {
  return (
    <DashboardPageHero
      eyebrow="Executive approvals" title="Overtime approvals"
      description="Review overtime requests before cutoff."
      actions={<CeoBannerStatusCard icon={pending ? Clock3 : CheckCircle2} label="Awaiting decision" value={pending} />}
    />
  );
}
