import Link from "next/link";

export default function CeoDashboardBanner({ name, approvals, href }: {
  name: string; approvals: number; href: string;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.04em] text-[#1d1d1f] sm:text-[32px]">Executive Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#53736f]">Good day, {name}. Your projects, finances, and decisions in one place.</p>
      </div>
      <Link href={href} aria-label={`Review ${approvals} pending approvals`} className="inline-flex min-h-10 items-center justify-center rounded-[10px] bg-[#076d69] px-5 text-[13px] font-medium text-white shadow-[0_2px_6px_rgba(7,109,105,0.08)] transition-colors hover:bg-[#055f5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-4">Review approvals</Link>
    </header>
  );
}
