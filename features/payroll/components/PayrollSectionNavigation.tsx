"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { href: "/payroll-analytics", label: "Analytics", icon: BarChart3 },
  { href: "/payroll-approvals", label: "Approvals", icon: ClipboardCheck },
] as const;

export default function PayrollSectionNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Payroll sections" className="flex flex-wrap gap-1 border-b border-slate-200">
      {sections.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn(
            "inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-700",
            active ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900",
          )}>
            <Icon size={17} aria-hidden="true" />{label}
          </Link>
        );
      })}
    </nav>
  );
}
