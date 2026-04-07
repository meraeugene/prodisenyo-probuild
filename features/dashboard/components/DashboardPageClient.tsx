"use client";

import { DashboardOverviewSkeleton } from "@/components/DashboardLoadingSkeleton";
import CeoDepartmentReview from "@/features/dashboard/components/CeoDepartmentReview";
import DashboardAnalyticsSection from "@/features/dashboard/components/DashboardAnalyticsSection";
import DashboardHeroSection from "@/features/dashboard/components/DashboardHeroSection";
import DashboardRecentActivitySection from "@/features/dashboard/components/DashboardRecentActivitySection";
import DashboardSelectedRunSection from "@/features/dashboard/components/DashboardSelectedRunSection";
import DashboardSummaryCardsSection from "@/features/dashboard/components/DashboardSummaryCardsSection";
import DashboardTrendSection from "@/features/dashboard/components/DashboardTrendSection";
import SummaryFormulaModal from "@/features/dashboard/components/SummaryFormulaModal";
import { useDashboardPage } from "@/features/dashboard/hooks/useDashboardPage";

export default function DashboardPageClient() {
  const state = useDashboardPage();

  if (state.shouldShowSkeleton || state.shouldWaitForCeoDashboard) {
    return <DashboardOverviewSkeleton />;
  }

  return (
    <div className="p-6">
      <DashboardHeroSection
        totalPayroll={state.ceoOverallSubmittedPayroll}
        reportCount={state.ceoSubmittedReportCount}
        isRefreshing={state.isRefreshing}
        isTrendLoading={state.ceoTrendLoading}
        onSync={state.handleSync}
      />

      <DashboardTrendSection
        trendRange={state.ceoTrendRange}
        onRangeChange={state.setCeoTrendRange}
        loading={state.ceoTrendLoading}
        trendPoints={state.ceoPayrollTrend}
        trendPercent={state.ceoTrendPercent}
        latestTrendPoint={state.ceoLatestTrendPoint}
      />

      <DashboardSelectedRunSection
        selectedRun={state.selectedRun}
        employeeCount={state.selectedPayrollItems.length}
      />

      <DashboardAnalyticsSection
        periodOptions={state.periodOptions}
        selectedPeriodKey={state.selectedPeriodKey}
        onSelectPeriod={state.setSelectedPeriodKey}
        workforceByBranch={state.workforceByBranch}
        payrollDistributionData={state.payrollDistributionData}
      />

      <DashboardSummaryCardsSection
        cards={state.summaryCards}
        onSelectCard={state.setActiveSummaryCard}
      />

      <CeoDepartmentReview
        attendancePeriod={state.attendancePeriod}
        payrollItems={state.selectedPayrollItems}
        attendanceLogs={state.selectedAttendanceLogs}
        dailyTotals={state.selectedPayrollDailyTotals}
      />

      <DashboardRecentActivitySection
        activityRows={state.activityRows}
        attendancePeriod={state.attendancePeriod}
      />

      {state.error ? (
        <section className="mt-5 rounded-[12px] border border-red-100 bg-red-50 p-4 text-sm text-red-700 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
          {state.error}
        </section>
      ) : null}

      <SummaryFormulaModal
        card={state.activeSummaryCardDetails}
        onClose={() => state.setActiveSummaryCard(null)}
      />
    </div>
  );
}
