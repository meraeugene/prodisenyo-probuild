import "server-only";
import { getGmeaProjects } from "@/features/gmea-projects/server/gmeaQueries";
import { getGmeaRentalAnalytics } from "@/features/gmea-rentals/server/gmeaRentalsQueries";
import { APP_ROLES, requireRole } from "@/lib/auth";
import type { GmeaOverviewData } from "../types";

export async function getGmeaOverviewData(): Promise<GmeaOverviewData> {
  await requireRole([APP_ROLES.GMEA, APP_ROLES.CEO]);
  const [projects, rentals] = await Promise.all([
    getGmeaProjects(),
    getGmeaRentalAnalytics(),
  ]);
  return { projects, rentals };
}
