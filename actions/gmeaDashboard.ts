"use server";
import { getGmeaDashboardData } from "@/features/gmea-dashboard/server/gmeaDashboardQueries";

export async function getGmeaDashboardDataAction() { return getGmeaDashboardData(); }
