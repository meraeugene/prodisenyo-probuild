"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { getGmeaOverviewDataAction } from "@/actions/gmeaOverview";
import type { GmeaOverviewData } from "../types";
import {
  buildGmeaOverview,
  selectGmeaOverviewActivity,
  selectGmeaOverviewAlerts,
} from "../utils/gmeaOverviewSelectors";
import GmeaOverviewDivisions from "./GmeaOverviewDivisions";
import GmeaOverviewFinance from "./GmeaOverviewFinance";
import GmeaOverviewHeader from "./GmeaOverviewHeader";
import GmeaOverviewOperations from "./GmeaOverviewOperations";
import GmeaOverviewSummary from "./GmeaOverviewSummary";

export default function GmeaOverviewPage({
  initialData,
  canEdit,
}: {
  initialData: GmeaOverviewData;
  canEdit: boolean;
}) {
  const { data = initialData } = useSWR(
    "gmea-overview:data",
    getGmeaOverviewDataAction,
    {
      fallbackData: initialData,
      revalidateOnFocus: !canEdit,
      refreshInterval: canEdit ? 0 : 30000,
    },
  );
  const summary = useMemo(() => buildGmeaOverview(data), [data]);
  const activity = useMemo(() => selectGmeaOverviewActivity(data), [data]);
  const alerts = useMemo(
    () => selectGmeaOverviewAlerts(data, new Date().toISOString().slice(0, 10)),
    [data],
  );

  return (
    <main className="min-h-full bg-white px-4 py-5 sm:px-6 sm:py-6 lg:px-7 xl:px-8">
      <div className="mx-auto max-w-[1440px] space-y-4">
        <GmeaOverviewHeader />
        <GmeaOverviewSummary summary={summary} />
        <GmeaOverviewDivisions divisions={summary.divisions} />
        <GmeaOverviewOperations activity={activity} alerts={alerts} />
        <GmeaOverviewFinance divisions={summary.divisions} />
      </div>
    </main>
  );
}
