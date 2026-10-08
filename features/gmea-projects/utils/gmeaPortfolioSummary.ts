import type { GmeaProject } from "../types";
import { projectSummary, sumMoney } from "./gmeaCalculations";

export function buildGmeaPortfolioSummary(projects: GmeaProject[]) {
  const summaries = projects.map(projectSummary);
  return {
    ongoingCount: projects.filter((project) => project.status === "active").length,
    completedCount: projects.filter((project) => project.status === "completed").length,
    contractTotal: sumMoney(summaries.map((summary) => summary.contract)),
    expenseTotal: sumMoney(summaries.map((summary) => summary.expenses)),
  };
}
