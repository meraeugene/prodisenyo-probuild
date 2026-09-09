"use client";

import Image from "next/image";
import type { ReactNode } from "react";

interface DashboardPageHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
  isUploadAttendance?: boolean;
  actions?: ReactNode;
}

export default function DashboardPageHero({
  eyebrow,
  title,
  description,
  actions,
}: DashboardPageHeroProps) {
  return (
    <header className="relative isolate flex min-h-[190px] flex-wrap items-center justify-between gap-5 overflow-hidden rounded-[22px] bg-[#075e5b] px-6 py-7 text-white shadow-[0_20px_55px_rgba(7,83,80,0.16)] sm:min-h-[210px] sm:px-8 sm:py-8">
      <Image src="/gmea-portfolio-architecture.png" alt="" fill priority sizes="(min-width:1024px) calc(100vw - 320px), 100vw" className="-z-20 object-cover object-right" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,79,76,.98)_0%,rgba(3,91,87,.9)_42%,rgba(3,79,76,.48)_78%,rgba(3,68,65,.62)_100%)]" />
      <div className="min-w-0 max-w-3xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/[0.65]">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-white sm:text-[38px]">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-[15px]">
          {description}
        </p>
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 rounded-2xl border border-white/20 bg-white/10 p-2.5 shadow-inner backdrop-blur-xl sm:w-auto">{actions}</div>
      )}
    </header>
  );
}
