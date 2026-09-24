import type { GmeaProject } from "@/features/gmea-projects/types";
import type { RentalAnalyticsData } from "@/features/gmea-rentals/utils/rentalAnalytics";

export type GmeaOverviewData = {
  projects: GmeaProject[];
  rentals: RentalAnalyticsData;
};

export type GmeaOverviewActivity = {
  id: string;
  title: string;
  detail: string;
  date: string;
  href: string;
  division: "Electronics & Solar" | "Rentals";
  kind: "project" | "payment" | "expense" | "rental";
};

export type GmeaOverviewAlert = {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: "amber" | "rose" | "sky";
};
