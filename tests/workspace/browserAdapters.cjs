const fs = require("node:fs");
const path = require("node:path");
module.exports = {
  name: "workspace-offline-actions",
  setup(build) {
    build.onResolve({ filter: /^@\/features\/dashboard\/hooks\/useHistoricalDashboardData$/ }, args => ({ path: args.path, namespace: "workspace-history" }));
    build.onLoad({ filter: /.*/, namespace: "workspace-history" }, () => ({ loader: "js", resolveDir: process.cwd(), contents: `
      import {useState} from 'react';
      export function useHistoricalDashboardData(){
        const [selectedPeriodKey,setSelectedPeriodKey]=useState('payroll-1');
        return {loading:false,error:null,selectedPeriodKey,setSelectedPeriodKey,data:{
          payrollRows:window.__payrollInsightRows || [],payrollAttendanceInputs:window.__payrollInsightAttendance || [],
          payrollDailyPaidPoints:[{date:'2026-09-01',total:5150},{date:'2026-09-02',total:5150}],
          periodOptions:(window.__payrollReports || []).map(run=>({key:run.id,label:run.period_label,siteName:run.site_name}))
        }};
      }
    ` }));
    build.onResolve({ filter: /^@\/actions\// }, (args) => ({ path: args.path, namespace: "workspace-actions" }));
    build.onLoad({ filter: /.*/, namespace: "workspace-actions" }, (args) => {
      const source = fs.readFileSync(path.join(process.cwd(), args.path.replace("@/", "") + ".ts"), "utf8");
      const reads = { getPayrollReportsDataAction: "{reports:window.__payrollReports || []}", getHistoricalRentalIncomeAction: "window.__historicalIncome || []", getGmeaProjectsDataAction: "window.__gmeaProjects", getGmeaProjectDataAction: "null", getGmeaRentalEquipmentAction: "window.__equipment", getGmeaRentalsAction: "window.__rentals", getGmeaRentalOperationsAction: "window.__rentalOperations", getPurchasingRecordsAction: "window.__purchases" };
      const approvalMocks = {
        approveOvertimeRequestFormAction: "window.__approvedRequest=args[0];return {approvedAt:'2026-10-07T08:00:00Z'}",
        approvePayrollReportAction: "window.__approvedPayroll=args[0];window.__payrollReports=window.__payrollReports.map(run=>run.id===args[0]?{...run,status:'approved'}:run);return {approvedAt:'2026-10-07T08:00:00Z'}",
      };
      const contents = [...source.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)].map((match) =>
        `export async function ${match[1]}(...args){${approvalMocks[match[1]] || (reads[match[1]] ? `return ${reads[match[1]]}` : 'throw new Error("Mutation disabled in offline UI check")')}}`,
      ).join("\n");
      return { loader: "js", contents };
    });
  },
};
