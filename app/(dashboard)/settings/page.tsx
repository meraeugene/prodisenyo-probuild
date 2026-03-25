"use client";

import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import { useAppState } from "@/features/app/AppStateProvider";

export default function SettingsPage() {
  const { handleReset } = useAppState();

  return (
    <div className="space-y-4">
      <DashboardPageHero
        eyebrow="Workspace"
        title="Settings"
        description="Manage dashboard preferences and reset locally stored payroll workspace data."
      />

      <section className="rounded-[14px] border border-[#e7ecef] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex h-11 items-center rounded-[10px] bg-[#0d2e2b] px-4 text-sm font-semibold text-white transition hover:bg-[#123b37]"
        >
          Reset Workspace Data
        </button>
      </section>
    </div>
  );
}
