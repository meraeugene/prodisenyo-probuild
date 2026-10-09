import { CheckCircle2, Clock3 } from "lucide-react";
import DashboardPageHero from "@/components/DashboardPageHero";

export default function OvertimeApprovalsHero({ pending }: { pending: number }) {
  const Icon = pending ? Clock3 : CheckCircle2;
  return (
    <DashboardPageHero
      eyebrow="Executive approvals" title="Overtime approvals"
      description="Review overtime requests before cutoff."
      actions={<div role="status" aria-live="polite" className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-[5px] bg-[#eaf5f3] px-3 text-sm text-[#065c59]">
        <Icon size={15} aria-hidden="true" />
        <span>Awaiting decision: <strong className="font-semibold tabular-nums">{pending}</strong></span>
      </div>}
    />
  );
}
