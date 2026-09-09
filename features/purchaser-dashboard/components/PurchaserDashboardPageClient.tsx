"use client";

import Link from "next/link";
import { ArrowRight, FolderKanban } from "lucide-react";
import { useMemo, useState } from "react";
import DashboardPageHero from "@/components/DashboardPageHero";
import PurchaserActivityPanel from "@/features/purchaser-dashboard/components/PurchaserActivityPanel";
import PurchaserDashboardSummary from "@/features/purchaser-dashboard/components/PurchaserDashboardSummary";
import PurchaserOrdersPanel from "@/features/purchaser-dashboard/components/PurchaserOrdersPanel";
import PurchaserPricingPanel from "@/features/purchaser-dashboard/components/PurchaserPricingPanel";
import PurchaserReceiptsPanel from "@/features/purchaser-dashboard/components/PurchaserReceiptsPanel";
import PurchaserRequestsPanel from "@/features/purchaser-dashboard/components/PurchaserRequestsPanel";
import type { PurchaserDashboardData } from "@/features/purchaser-dashboard/types";
import {
  buildPurchaserActivity,
  buildPurchaserSummary,
  filterPurchaserRecords,
} from "@/features/purchaser-dashboard/utils/purchaserDashboard";

export default function PurchaserDashboardPageClient({
  data,
  fullName,
}: {
  data: PurchaserDashboardData;
  fullName: string | null;
}) {
  const [projectId, setProjectId] = useState("all");
  const projects = useMemo(
    () =>
      Array.from(
        new Map(
          data.records.map((record) => [record.projectId, record.projectName]),
        ),
      ).sort((left, right) => left[1].localeCompare(right[1])),
    [data.records],
  );
  const records = useMemo(
    () => filterPurchaserRecords(data.records, projectId),
    [data.records, projectId],
  );
  const summary = useMemo(() => buildPurchaserSummary(records), [records]);
  const activity = useMemo(() => buildPurchaserActivity(records), [records]);

  return (
    <main className="min-h-full bg-white px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <DashboardPageHero eyebrow="Purchasing workspace" title="Purchaser Dashboard" description={`Welcome, ${fullName?.trim() || "Purchaser"}. Track requests, supplier pricing, orders, deliveries, and receipts.`} actions={<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <label className="relative">
            <span className="sr-only">Filter by project</span>
            <FolderKanban size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-11 w-full min-w-56 rounded-xl border border-white/80 bg-white pl-9 pr-9 text-sm font-semibold text-slate-700 outline-none focus:border-teal-300 focus:ring-2 focus:ring-white/50">
              <option value="all">All projects</option>
              {projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
          <Link href="/purchasing-approvals" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#076d69] shadow-sm transition hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-white">
            Manage purchases <ArrowRight size={15} />
          </Link>
        </div>} />

      <div className="mt-5"><PurchaserDashboardSummary summary={summary} /></div>
      <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,.8fr)]">
        <PurchaserRequestsPanel records={records} />
        <PurchaserPricingPanel records={records} />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <PurchaserOrdersPanel records={records} />
        <PurchaserActivityPanel items={activity} />
        <PurchaserReceiptsPanel records={records} />
      </div>
    </main>
  );
}
