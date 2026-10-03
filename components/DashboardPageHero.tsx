"use client";

import type { ReactNode } from "react";

interface DashboardPageHeroProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
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
    <header className="workspace-page-header flex flex-wrap items-start justify-between gap-4 bg-white pb-2">
      <div className="min-w-0 max-w-3xl">
        <p className="mb-5 text-xs leading-5 text-[#53736f]">
          Workspace <span aria-hidden="true" className="mx-2">/</span> {eyebrow}
        </p>
        <h1 className="break-words text-[28px] font-semibold leading-tight tracking-[-0.04em] text-[#1d1d1f] sm:text-[32px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm leading-6 text-[#53736f]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="workspace-header-actions flex max-w-full flex-wrap items-center gap-2 sm:mt-9">{actions}</div>
      )}
    </header>
  );
}
