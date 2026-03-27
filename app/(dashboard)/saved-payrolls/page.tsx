import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import { requireUser } from "@/lib/auth";
import { getSavedPayrollRunsByMonth } from "@/lib/payroll-history";

export const metadata = {
  title: "Saved Payrolls",
};

export default async function SavedPayrollsPage() {
  await requireUser(["admin"]);
  const payrollGroups = await getSavedPayrollRunsByMonth();

  return (
    <div className="space-y-4">
      <DashboardPageHero
        eyebrow="Admin"
        title="Saved Payroll History"
        description="Weekly payroll snapshots saved to Supabase, grouped by month for administrator review."
      />

      {payrollGroups.length === 0 ? (
        <section className="rounded-[14px] border border-apple-mist bg-white p-6 text-sm text-apple-steel shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          No payroll snapshots have been saved yet. Generate a payroll, then use
          the save button to store the weekly result in Supabase.
        </section>
      ) : (
        payrollGroups.map((group) => (
          <section
            key={group.monthLabel}
            className="rounded-[14px] border border-apple-mist bg-white shadow-[0_10px_30px_rgba(24,83,43,0.07)]"
          >
            <div className="border-b border-apple-mist px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                {group.monthLabel}
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-apple-charcoal">
                Weekly payroll saves
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[rgb(var(--apple-snow))] text-left text-[11px] uppercase tracking-[0.16em] text-apple-steel">
                    <th className="px-5 py-3">Week</th>
                    <th className="px-5 py-3">Period</th>
                    <th className="px-5 py-3">Employees</th>
                    <th className="px-5 py-3">Total Hours</th>
                    <th className="px-5 py-3">Total Pay</th>
                    <th className="px-5 py-3">Sites</th>
                    <th className="px-5 py-3">Saved By</th>
                    <th className="px-5 py-3">Saved At</th>
                  </tr>
                </thead>
                <tbody>
                  {group.runs.map((run) => (
                    <tr
                      key={run.id}
                      className="border-t border-apple-mist text-apple-charcoal"
                    >
                      <td className="px-5 py-4 font-semibold">{run.weekLabel}</td>
                      <td className="px-5 py-4">{run.periodLabel}</td>
                      <td className="px-5 py-4">{run.totalEmployees}</td>
                      <td className="px-5 py-4">{run.totalHours.toFixed(2)}</td>
                      <td className="px-5 py-4">
                        PHP {run.totalPay.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-5 py-4">{run.siteScope || "-"}</td>
                      <td className="px-5 py-4">
                        {run.savedBy.fullName || run.savedBy.username}
                      </td>
                      <td className="px-5 py-4">{run.savedAtLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
