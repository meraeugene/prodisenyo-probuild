import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

interface RawRunRow {
  id: string;
  period_label: string;
  month_label: string;
  week_label: string;
  site_scope: string | null;
  total_employees: number;
  total_hours: number;
  total_pay: number;
  created_at: string;
  saved_by_user:
    | {
        full_name: string | null;
        username: string;
      }
    | {
        full_name: string | null;
        username: string;
      }[]
    | null;
}

export interface SavedPayrollRunGroup {
  monthLabel: string;
  runs: Array<{
    id: string;
    periodLabel: string;
    weekLabel: string;
    siteScope: string | null;
    totalEmployees: number;
    totalHours: number;
    totalPay: number;
    savedAtLabel: string;
    savedBy: {
      fullName: string | null;
      username: string;
    };
  }>;
}

function normalizeSavedBy(value: RawRunRow["saved_by_user"]) {
  if (Array.isArray(value)) {
    return value[0] ?? { full_name: null, username: "unknown" };
  }

  return value ?? { full_name: null, username: "unknown" };
}

export async function getSavedPayrollRunsByMonth(): Promise<SavedPayrollRunGroup[]> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("payroll_runs")
    .select(
      "id, period_label, month_label, week_label, site_scope, total_employees, total_hours, total_pay, created_at, saved_by_user:app_users!payroll_runs_saved_by_fkey(full_name, username)",
    )
    .order("period_start", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const formatter = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const grouped = new Map<string, SavedPayrollRunGroup>();

  for (const row of data as RawRunRow[]) {
    const monthLabel = row.month_label;
    const savedBy = normalizeSavedBy(row.saved_by_user);
    const existing = grouped.get(monthLabel) ?? {
      monthLabel,
      runs: [],
    };

    existing.runs.push({
      id: row.id,
      periodLabel: row.period_label,
      weekLabel: row.week_label,
      siteScope: row.site_scope,
      totalEmployees: row.total_employees,
      totalHours: Number(row.total_hours ?? 0),
      totalPay: Number(row.total_pay ?? 0),
      savedAtLabel: formatter.format(new Date(row.created_at)),
      savedBy: {
        fullName: savedBy.full_name,
        username: savedBy.username,
      },
    });

    grouped.set(monthLabel, existing);
  }

  return Array.from(grouped.values());
}
