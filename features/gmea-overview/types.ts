import type { GmeaProject } from "@/features/gmea-projects/types";
import type { RentalAnalyticsData } from "@/features/gmea-rentals/utils/rentalAnalytics";

export type GmeaOverviewData = {
  projects: GmeaProject[];
  rentals: RentalAnalyticsData;
};

export type GmeaOverviewMetric =
  | "ongoing" | "revenue" | "expenses" | "profit" | "loss"
  | "collected" | "uncollected" | "collection-rate";

export type GmeaOverviewRecord = {
  id: string;
  name: string;
  client: string;
  division: "Projects Expenses" | "Rentals";
  kind: "project" | "rental" | "shared";
  status: "active" | "completed" | "draft" | "cancelled" | "shared";
  href: string;
  revenue: number;
  expenses: number;
  result: number;
  collected: number;
  notCollected: number;
  receivable: number;
  creditedCollection: number;
};

export type GmeaOverviewMetricTotals = Record<GmeaOverviewMetric, number>;

export type GmeaOverviewDivisionFinance = {
  name: "Projects Expenses" | "Rentals";
  revenue: number;
  expenses: number;
  profit: number;
};

export type GmeaOverviewActivity = {
  id: string;
  title: string;
  detail: string;
  date: string;
  href: string;
  division: "Projects Expenses" | "Rentals";
  kind: "project" | "payment" | "expense" | "rental";
};

export type GmeaOverviewAlert = {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: "amber" | "rose" | "sky";
};
