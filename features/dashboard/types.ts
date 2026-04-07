export type PayrollSummaryCardKey = "gross" | "deductions" | "net";

export interface PayrollSummaryCardDefinition {
  key: PayrollSummaryCardKey;
  title: string;
  badge: string;
  helper: string;
  formula: string;
  amount: number;
  steps: string[];
}

export interface DashboardWorkforceDatum {
  branch: string;
  employees: number;
  shortBranch: string;
  fill: string;
}

export interface DashboardPayrollDistributionDatum {
  name: string;
  value: number;
  shortName: string;
  fill: string;
}
