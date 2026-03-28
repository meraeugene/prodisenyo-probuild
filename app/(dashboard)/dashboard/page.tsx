"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  BadgeCheck,
  Check,
  ChevronRight,
  RefreshCw,
  Receipt,
  Wallet,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartTooltip from "@/components/charts/ChartTooltip";
import { DashboardOverviewSkeleton } from "@/components/dashboard/DashboardLoadingSkeleton";
import { useAppState } from "@/features/app/AppStateProvider";
import { useHistoricalDashboardData } from "@/features/dashboard/hooks/useHistoricalDashboardData";
import { selectWorkforceByBranch } from "@/features/analytics/utils/analyticsSelectors";
import { formatPayrollNumber } from "@/features/payroll/utils/payrollFormatters";
import type { PayrollRow } from "@/lib/payrollEngine";
import { buildPayrollInsightsData } from "@/lib/payrollInsights";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const OVERVIEW_CHART_COLORS = [
  "rgb(var(--theme-chart-1))",
  "rgb(var(--theme-chart-2))",
  "rgb(var(--theme-chart-3))",
  "rgb(var(--theme-chart-4))",
  "rgb(var(--theme-chart-5))",
];
const PESO_SIGN = "\u20B1";

type PayrollSummaryCardKey = "gross" | "deductions" | "net";

interface PayrollSummaryCardDefinition {
  key: PayrollSummaryCardKey;
  title: string;
  badge: string;
  helper: string;
  formula: string;
  amount: number;
  steps: string[];
}

interface DashboardSiteCard {
  siteName: string;
  shortSite: string;
  employees: number;
  payrollTotal: number;
}

function extractBranchName(value: string): string {
  if (!value) return "";
  return value.trim().split(/\s+/)[0].toUpperCase();
}

function normalizeEmployeeName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function splitSiteNames(value: string): string[] {
  return value
    .split(",")
    .map((site) => site.trim())
    .filter((site) => site.length > 0);
}

function buildDepartmentCards(payrollRows: PayrollRow[]): DashboardSiteCard[] {
  const byEmployee = new Map<
    string,
    { name: string; totalPay: number; sites: Set<string> }
  >();

  for (const row of payrollRows) {
    const key = normalizeEmployeeName(row.worker);
    const current = byEmployee.get(key) ?? {
      name: row.worker,
      totalPay: 0,
      sites: new Set<string>(),
    };

    current.totalPay += row.totalPay;

    splitSiteNames(row.site || "Unknown Site").forEach((site) =>
      current.sites.add(site),
    );

    if (row.worker.length > current.name.length) {
      current.name = row.worker;
    }

    byEmployee.set(key, current);
  }

  const bySite = new Map<string, DashboardSiteCard>();

  for (const employee of byEmployee.values()) {
    employee.sites.forEach((siteName) => {
      const current = bySite.get(siteName) ?? {
        siteName,
        shortSite: extractBranchName(siteName),
        employees: 0,
        payrollTotal: 0,
      };

      current.employees += 1;
      current.payrollTotal += employee.totalPay;
      bySite.set(siteName, current);
    });
  }

  return Array.from(bySite.values()).sort((a, b) =>
    a.siteName.localeCompare(b.siteName),
  );
}

function SummaryFormulaModal({
  card,
  onClose,
}: {
  card: PayrollSummaryCardDefinition | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!card) return;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [card, onClose]);

  if (!card) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[28px]  bg-white shadow-[0_28px_90px_rgba(15,23,42,0.22)]">
        <div className="border-b border-apple-mist bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">
                How It Was Solved
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                {card.title}
              </h2>
              <p className="mt-2 text-sm text-white/75">{card.helper}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
              aria-label="Close payroll formula modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="rounded-[22px] border border-apple-mist bg-[rgb(var(--apple-snow))] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-apple-steel">
              Current Value
            </p>
            <p className="mt-3 text-[34px] font-semibold tracking-[-0.03em] text-apple-charcoal">
              {PESO_SIGN} {formatPayrollNumber(card.amount)}
            </p>
            <p className="mt-3 text-sm text-apple-smoke">{card.formula}</p>
          </div>

          <div className="grid gap-3">
            {card.steps.map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-3 rounded-[18px] border border-apple-mist bg-white px-4 py-3"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-apple-smoke">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const router = useRouter();
  const { currentPayrollRunId, workspaceReset } = useAppState();
  const {
    data,
    loading,
    error,
    selectedPeriodKey,
    setSelectedPeriodKey,
    refreshData,
  } = useHistoricalDashboardData();
  const [role, setRole] = useState<"ceo" | "payroll_manager" | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const payrollRows = data?.payrollRows ?? [];
  const payrollAttendanceInputs = data?.payrollAttendanceInputs ?? [];
  const attendancePeriod =
    data?.attendancePeriod ?? "No recorded payroll period yet";
  const records = data?.records ?? [];
  const activityRows = data?.recentActivity ?? [];
  const periodOptions = data?.periodOptions ?? [];

  const payrollInsights = useMemo(
    () => buildPayrollInsightsData(payrollRows, payrollAttendanceInputs),
    [payrollAttendanceInputs, payrollRows],
  );

  const totalPayroll = payrollInsights.kpis.totalPayroll;
  const grossPayroll = Math.round(totalPayroll * 1.12 * 100) / 100;
  const deductions =
    Math.round(Math.max(0, grossPayroll - totalPayroll) * 100) / 100;
  const netPayroll = Math.max(0, totalPayroll);
  const [activeSummaryCard, setActiveSummaryCard] =
    useState<PayrollSummaryCardKey | null>(null);

  const workforceByBranch = useMemo(
    () =>
      selectWorkforceByBranch(records).map((item, index) => ({
        ...item,
        shortBranch: extractBranchName(item.branch),
        fill: OVERVIEW_CHART_COLORS[index % OVERVIEW_CHART_COLORS.length],
      })),
    [records],
  );

  const payrollDistributionData = useMemo(
    () =>
      payrollInsights.payrollDistributionByProject.map((item, index) => ({
        ...item,
        shortName: extractBranchName(item.name),
        fill: OVERVIEW_CHART_COLORS[index % OVERVIEW_CHART_COLORS.length],
      })),
    [payrollInsights.payrollDistributionByProject],
  );

  const siteCards = useMemo(
    () => buildDepartmentCards(payrollRows),
    [payrollRows],
  );

  const summaryCards = useMemo<PayrollSummaryCardDefinition[]>(
    () => [
      {
        key: "gross",
        title: "Gross Payroll",
        badge: "Based on uploaded attendance",
        helper:
          "Starts from net payroll analytics, then applies the current 12% uplift used on the dashboard.",
        formula: `Gross payroll = Net payroll (${PESO_SIGN} ${formatPayrollNumber(netPayroll)}) x 1.12`,
        amount: grossPayroll,
        steps: [
          `The dashboard first reads the synced payroll analytics total of ${PESO_SIGN} ${formatPayrollNumber(netPayroll)}.`,
          "It applies the current dashboard gross-up rule of 12% to that synced payroll total.",
          `That gives ${PESO_SIGN} ${formatPayrollNumber(grossPayroll)} for the Gross Payroll card.`,
        ],
      },
      {
        key: "deductions",
        title: "Deductions",
        badge: "Derived from current payroll",
        helper:
          "This card shows the gap between the gross payroll card and the synced net payroll card.",
        formula: `Deductions = Gross payroll (${PESO_SIGN} ${formatPayrollNumber(grossPayroll)}) - Net payroll (${PESO_SIGN} ${formatPayrollNumber(netPayroll)})`,
        amount: deductions,
        steps: [
          `Gross payroll is currently ${PESO_SIGN} ${formatPayrollNumber(grossPayroll)}.`,
          `Net payroll released is currently ${PESO_SIGN} ${formatPayrollNumber(netPayroll)}.`,
          `Subtracting those values leaves ${PESO_SIGN} ${formatPayrollNumber(deductions)} in deductions.`,
        ],
      },
      {
        key: "net",
        title: "Net Payroll Released",
        badge: "Synced with payroll analytics",
        helper:
          "This card mirrors the net payroll total coming from the payroll analytics dataset for the selected period.",
        formula: `Net payroll released = Synced payroll analytics total (${PESO_SIGN} ${formatPayrollNumber(totalPayroll)})`,
        amount: netPayroll,
        steps: [
          "The selected payroll period is loaded from saved payroll run items.",
          "The payroll analytics total is summed from those payroll rows.",
          `That synced result is shown directly here as ${PESO_SIGN} ${formatPayrollNumber(netPayroll)}.`,
        ],
      },
    ],
    [deductions, grossPayroll, netPayroll, totalPayroll],
  );

  const activeSummaryCardDetails =
    summaryCards.find((card) => card.key === activeSummaryCard) ?? null;

  const shouldShowSkeleton = loading && !data && !error;

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        setRole(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      setRole(
        (data as { role: "ceo" | "payroll_manager" } | null)?.role ?? null,
      );
    }

    void loadRole();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (role !== "payroll_manager") return;
    if (!workspaceReset && currentPayrollRunId) return;
    router.replace("/upload-attendance");
  }, [currentPayrollRunId, role, router, workspaceReset]);

  if (shouldShowSkeleton) {
    return <DashboardOverviewSkeleton />;
  }

  if (role === "payroll_manager" && (workspaceReset || !currentPayrollRunId)) {
    return <DashboardOverviewSkeleton />;
  }

  async function handleSync() {
    setIsRefreshing(true);
    try {
      refreshData();
      router.refresh();
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div>
      <section className="rounded-[16px] bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] p-6 text-white shadow-[0_18px_36px_rgba(22,101,52,0.18)] mb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium text-white/65">
              Total Payroll This Period
            </p>
            <div className="mt-3 flex items-center gap-3">
              <h1 className="text-[40px] font-semibold tracking-[-0.03em]">
                {PESO_SIGN} {formatPayrollNumber(netPayroll)}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[rgb(var(--theme-chart-5))]">
                Synced <ArrowUp size={12} />
              </span>
            </div>
            <p className="mt-3 text-sm text-white/70">{attendancePeriod}</p>
          </div>

          {periodOptions.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedPeriodKey ?? ""}
                onChange={(event) =>
                  setSelectedPeriodKey(event.target.value || null)
                }
                className="h-10 min-w-[280px] rounded-xl border border-white/15 bg-white/10 px-3 text-sm font-medium text-white outline-none transition hover:bg-white/15 focus:border-white/30"
              >
                {periodOptions.map((option) => (
                  <option
                    key={option.key}
                    value={option.key}
                    className="text-apple-charcoal"
                  >
                    {option.label} - {option.siteName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSync}
                disabled={isRefreshing || loading}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-[rgb(var(--theme-chart-5))] px-4 text-sm font-semibold  transition  focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60  text-[rgb(var(--apple-black))] hover:bg-[rgb(var(--apple-silver))]"
              >
                <RefreshCw
                  size={16}
                  className={isRefreshing ? "animate-spin" : ""}
                />
                Sync
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mb-5">
        <div className="rounded-[12px] bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold text-apple-charcoal">
                Analytics Overview
              </p>
              <p className="mt-1 text-sm text-apple-steel">
                Historical charts from Supabase attendance and approved payroll.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="rounded-[12px] border border-apple-mist bg-[rgb(var(--apple-snow))] p-4">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                  Employees per Branch
                </p>
                <p className="mt-1 text-xs text-apple-steel">
                  Attendance Analytics
                </p>
              </div>

              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={workforceByBranch}
                    barCategoryGap="28%"
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgb(var(--theme-chart-grid))"
                    />
                    <XAxis
                      dataKey="shortBranch"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      tick={{
                        fill: "rgb(var(--theme-chart-axis))",
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "rgb(var(--theme-chart-axis))",
                        fontSize: 11,
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgb(var(--theme-chart-cursor))" }}
                      content={(props) => (
                        <ChartTooltip {...props} unit="employees" />
                      )}
                    />
                    <Bar dataKey="employees" radius={[6, 6, 6, 6]} barSize={38}>
                      {workforceByBranch.map((entry, index) => (
                        <Cell
                          key={`overview-workforce-${entry.shortBranch}-${index}`}
                          fill={entry.fill}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[12px] border border-apple-mist bg-[rgb(var(--apple-snow))] p-4">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-apple-charcoal">
                  Payroll Distribution by Project
                </p>
                <p className="mt-1 text-xs text-apple-steel">
                  Payroll Analytics
                </p>
              </div>

              <div className="grid h-[260px] grid-cols-[minmax(0,1fr)_160px] gap-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={payrollDistributionData}
                      dataKey="value"
                      nameKey="shortName"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={76}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {payrollDistributionData.map((entry, index) => (
                        <Cell
                          key={`overview-payroll-distribution-${entry.name}-${index}`}
                          fill={entry.fill}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;

                        const item = payload[0]?.payload as
                          | {
                              shortName?: string;
                              name?: string;
                              value?: number;
                            }
                          | undefined;

                        return (
                          <div className="rounded-xl border border-apple-mist bg-white p-3 text-apple-charcoal shadow-xl backdrop-blur-md">
                            <p className="mb-1 text-[10px] uppercase tracking-widest opacity-60">
                              Branch
                            </p>
                            <p className="max-w-[160px] truncate text-xs font-semibold text-apple-smoke">
                              {item?.shortName ?? item?.name ?? "Unknown"}
                            </p>
                            <div className="mt-1 flex items-baseline gap-1">
                              <span className="text-lg font-bold">
                                {PESO_SIGN}{" "}
                                {formatPayrollNumber(item?.value ?? 0)}
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-3 overflow-y-auto pr-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-apple-silver">
                    Branch
                  </p>
                  {payrollDistributionData.length > 0 ? (
                    payrollDistributionData.map((item, index) => (
                      <div
                        key={`overview-payroll-legend-${item.name}-${index}`}
                        className="flex items-start gap-2"
                      >
                        <span
                          className="mt-1 h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-medium text-apple-smoke">
                            {item.shortName}
                          </p>
                          <p className="truncate text-xs font-semibold text-apple-charcoal">
                            {PESO_SIGN} {formatPayrollNumber(item.value)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-apple-steel">
                      No saved payroll runs yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3 mb-5">
        {summaryCards.map((card) => {
          const iconWrapClass =
            card.key === "gross"
              ? "bg-emerald-50 text-emerald-700"
              : card.key === "deductions"
                ? "bg-red-50 text-red-700"
                : "bg-sky-50 text-sky-700";
          const Icon =
            card.key === "gross"
              ? Wallet
              : card.key === "deductions"
                ? Receipt
                : BadgeCheck;

          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setActiveSummaryCard(card.key)}
              className="rounded-[22px] bg-white p-6 text-left shadow-[0_18px_40px_rgba(24,83,43,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(24,83,43,0.12)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconWrapClass}`}
                  >
                    <Icon size={18} />
                  </div>
                  <p className="text-sm font-medium text-apple-steel">
                    {card.title}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs text-green-600">
                    Synced <ArrowUp size={12} />
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-apple-steel">
                    View math
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>
              <p className="mt-6 text-[32px] font-semibold tracking-[-0.03em] text-apple-charcoal">
                {PESO_SIGN} {formatPayrollNumber(card.amount)}
              </p>
              <p className="mt-3 text-sm font-medium text-apple-charcoal">
                {card.badge}
              </p>
            </button>
          );
        })}
      </section>

      <section className="rounded-[12px] bg-white p-5 mb-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[15px] font-semibold text-apple-charcoal">
            Department Cards
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {siteCards.length > 0 ? (
            siteCards.map((card) => (
              <div
                key={card.siteName}
                className="rounded-[16px] bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] p-5 text-white  shadow-[0_18px_36px_rgba(22,101,52,0.16)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{card.shortSite}</p>
                  <span className="text-[11px] text-white/65">SITE</span>
                </div>

                <p className="mt-6 text-[12px] uppercase tracking-[0.28em] text-white/55">
                  Employees
                </p>
                <p className="mt-2 text-[28px] font-semibold tracking-[-0.03em]">
                  {card.employees.toLocaleString("en-PH")}
                </p>

                <p className="mt-6 text-[12px] uppercase tracking-[0.28em] text-white/55">
                  Total Payroll
                </p>
                <p className="mt-2 text-[30px] font-semibold tracking-[-0.03em]">
                  {PESO_SIGN} {formatPayrollNumber(card.payrollTotal)}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-[16px] bg-[linear-gradient(135deg,#112e1a,#1f4f2c,#245f34)] p-5 text-white shadow-[0_18px_36px_rgba(22,101,52,0.16)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">OPERATIONS</p>
                <span className="text-[11px] text-white/65">DEPT</span>
              </div>
              <p className="mt-8 text-sm text-white/70">
                No sites uploaded yet.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[12px] bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[15px] font-semibold text-apple-charcoal">
            Recent Payroll Activity
          </p>
          <p className="text-xs text-emerald-500">{attendancePeriod}</p>
        </div>

        <div className="overflow-hidden rounded-[12px] border border-apple-mist">
          <div className="grid grid-cols-[1fr_1.2fr_1fr_0.9fr_1fr] bg-[rgb(var(--apple-snow))] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-500">
            <span>Type</span>
            <span>Employee</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Branch</span>
          </div>

          <div className="divide-y divide-apple-mist">
            {activityRows.length > 0 ? (
              activityRows.map((row) => (
                <div
                  key={`${row.type}-${row.employee}`}
                  className="grid grid-cols-[1fr_1.2fr_1fr_0.9fr_1fr] items-center px-4 py-4"
                >
                  <span className="text-sm font-medium text-apple-ash">
                    {row.type}
                  </span>
                  <span className="text-sm font-semibold text-apple-charcoal">
                    {row.employee}
                  </span>
                  <span className="text-sm text-apple-ash">{row.amount}</span>
                  <span
                    className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      row.status === "Success"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-[rgb(var(--apple-snow))] text-apple-charcoal"
                    }`}
                  >
                    {row.status === "Success" && <Check size={11} />}
                    {row.status}
                  </span>
                  <span className="text-sm text-apple-smoke">{row.method}</span>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-apple-steel">
                No saved payroll activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-[12px] border border-red-100 bg-red-50 p-4 text-sm text-red-700 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          {error}
        </section>
      ) : null}

      <SummaryFormulaModal
        card={activeSummaryCardDetails}
        onClose={() => setActiveSummaryCard(null)}
      />
    </div>
  );
}
