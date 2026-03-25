"use client";

interface DashboardPageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
}

export default function DashboardPageHero({
  eyebrow,
  title,
  description,
}: DashboardPageHeroProps) {
  return (
    <section className="rounded-[14px] bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] p-5 text-white shadow-[0_18px_36px_rgba(22,101,52,0.18)] sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.03em] text-white sm:text-[32px]">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-white/72 sm:text-[15px]">
        {description}
      </p>
    </section>
  );
}
