"use client";

import Image from "next/image";
import RoleHintTypewriter from "@/features/home/components/RoleHintTypewriter";

export default function RoleGreetingHero({
  dateLabel,
  title,
  messages,
  className = "",
}: {
  dateLabel: string;
  title: string;
  messages: string[];
  className?: string;
}) {
  return (
    <section
      className={`relative isolate min-h-[210px] overflow-hidden rounded-[22px] bg-[#075e5b] p-6 text-white shadow-[0_20px_55px_rgba(7,83,80,0.16)] sm:p-8 ${className}`}
    >
      <Image src="/gmea-portfolio-architecture.png" alt="" fill priority sizes="(min-width:1024px) calc(100vw - 320px), 100vw" className="-z-20 object-cover object-right" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,79,76,.98)_0%,rgba(3,91,87,.9)_42%,rgba(3,79,76,.48)_78%,rgba(3,68,65,.62)_100%)]" />

      <div className="max-w-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/[0.65] sm:text-[11px]">
          {dateLabel}
        </p>
        <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-white sm:text-[38px]">
          {title}
        </h1>

        <div className="relative mt-5 min-h-[68px] max-w-xl overflow-hidden rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white shadow-inner backdrop-blur-xl">
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/60">Today&apos;s focus</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/[0.85] sm:text-sm">
            <RoleHintTypewriter messages={messages} />
          </p>
        </div>
      </div>
    </section>
  );
}
