import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Step } from "@/types";

const steps = [
  { label: "Review Attendance", href: "/review-attendance", step: 2 },
  { label: "Generate Payroll", href: "/generate-payroll", step: 3 },
];

export default function PayrollWorkflowNavigation({ current, canReview = true }: { current: Step; canReview?: boolean }) {
  return (
    <nav aria-label="Payroll workflow" className="flex min-h-[54px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 xl:px-7">
      <ol className="flex flex-wrap items-center gap-2 text-[13px]">
        {steps.map((step, index) => {
          const active = step.step === current;
          const disabled = !active && !canReview;
          const className = cn("rounded text-[13px]", active ? "font-semibold text-[#076d69]" : "text-slate-600");
          return (
            <li key={step.href} className="flex items-center gap-2">
              {index > 0 && <ChevronRight size={14} className="text-slate-400" aria-hidden="true" />}
              {active || disabled ? <span className={className} aria-current={active ? "page" : undefined} aria-disabled={disabled || undefined}>{step.label}</span> : <Link href={step.href} className={cn(className, "transition hover:text-[#076d69] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-4")}>{step.label}</Link>}
            </li>
          );
        })}
      </ol>
      <Link href="/payroll-workspace" className="inline-flex shrink-0 items-center gap-2 rounded py-1 text-[13px] font-medium text-[#076d69] hover:underline"><ArrowLeft size={15} aria-hidden="true" />Back to all drafts</Link>
    </nav>
  );
}
