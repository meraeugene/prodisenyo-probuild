"use server";

import { getGmeaOverviewData } from "@/features/gmea-overview/server/gmeaOverviewQueries";

export async function getGmeaOverviewDataAction() {
  return getGmeaOverviewData();
}
