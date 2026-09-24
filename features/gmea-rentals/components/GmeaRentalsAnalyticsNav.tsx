"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/gmea-rentals", label: "Rentals" },
  { href: "/gmea-rentals/dashboard", label: "Dashboard" },
  { href: "/gmea-rentals/reports", label: "Reports" },
];

export default function GmeaRentalsAnalyticsNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="GMEA Rentals sections"
      className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-[0_8px_22px_-20px_rgba(15,23,42,.3)]"
    >
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition",
              active
                ? "bg-[#076d69] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
