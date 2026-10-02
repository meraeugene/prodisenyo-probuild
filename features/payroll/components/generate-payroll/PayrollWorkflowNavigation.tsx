import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Step } from "@/types";

const steps = [
  { label: "Upload Attendance", href: "/upload-attendance" },
  { label: "Review Attendance", href: "/review-attendance" },
  { label: "Generate Payroll", href: "/generate-payroll" },
];

export default function PayrollWorkflowNavigation({ current, canReview = true }: { current: Step; canReview?: boolean }) {
  return (
    <nav aria-label="Payroll workflow" className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-white px-4 py-5 sm:px-6 xl:px-7">
      <ol className="flex flex-wrap items-center gap-x-4 gap-y-3 sm:gap-x-6">
        {steps.map((step, index) => {
          const number = index + 1;
          const active = number === current;
          const disabled = number > 1 && !canReview;
          const content = <><span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold", active ? "bg-[#076d69] text-white" : "bg-slate-100 text-slate-500")}>{number}</span><span>{step.label}</span></>;
          const className = cn("inline-flex items-center gap-2 rounded-lg text-xs font-semibold sm:text-sm", active ? "text-[#076d69]" : "text-slate-500");
          return (
            <li key={step.href}>
              {active || disabled ? <span className={className} aria-current={active ? "step" : undefined} aria-disabled={disabled || undefined}>{content}</span> : <Link href={step.href} className={cn(className, "transition hover:text-[#076d69] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-4")}>{content}</Link>}
            </li>
          );
        })}
      </ol>
      {current === 3 ? <Link href="/payroll-workspace" className="inline-flex items-center gap-2 rounded-lg border border-teal-200 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50"><ArrowLeft size={15} />Back to all drafts</Link> : null}
    </nav>
  );
}
