import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function CeoDashboardBanner({ name, approvals, href }: {
  name: string; approvals: number; href: string;
}) {
  return (
    <header className="relative isolate overflow-hidden rounded-[22px] bg-[#075e5b] px-6 py-8 text-white sm:px-9">
      <Image src="/gmea-portfolio-architecture.png" alt="" fill priority sizes="(min-width: 1024px) calc(100vw - 320px), 100vw" className="-z-20 object-cover object-right" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,83,79,.98)_0%,rgba(3,91,87,.88)_38%,rgba(3,82,79,.44)_72%,rgba(3,74,71,.58)_100%)]" />
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/75">Prodisenyo Builders Corporation</p>
          <h1 className="mt-3 text-[34px] font-bold leading-tight tracking-[-0.045em] sm:text-[42px]">Executive dashboard</h1>
          <p className="mt-3 text-sm text-white/85">Good day, {name}. Your projects, finances, and decisions in one place.</p>
        </div>
        <Link href={href} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/70 bg-white px-4 py-3 text-xs font-bold text-[#076d69] shadow-sm transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          Review approvals
          {approvals > 0 && <span className="rounded-full bg-teal-50 px-2 py-0.5">{approvals}</span>}
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </header>
  );
}
