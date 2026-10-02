import type { AttendanceRecordInput } from "@/lib/payrollEngine";
import { extractSiteName, formatPayrollNumber } from "@/features/payroll/utils/payrollFormatters";

export default function PayrollLogsTable({ logs }: { logs: AttendanceRecordInput[] }) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-[#dce6ea] bg-white">
      <table className="min-w-[820px] w-full text-left text-sm">
        <thead className="bg-[#f6f9fa]">
          <tr className="border-b border-[#dfe8ec]">
            {["Employee", "Site", "Date", "Regular Hours", "OT Hours", "Total Hours"].map((label) => (
              <th key={label} className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.06em] text-[#697c91]">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr><td colSpan={6} className="h-56 text-center">
              <p className="mt-3 text-sm font-semibold text-[#20354d]">No attendance logs found</p>
              <p className="mt-1 text-xs text-[#7b8da0]">Try changing or clearing the active filters.</p>
            </td></tr>
          ) : logs.map((record, index) => (
            <tr key={record.name + record.date + record.site + index} className="border-b border-[#e4ebee] last:border-0 transition hover:bg-[#f8fbfb]">
              <td className="px-4 py-3 text-[13px] font-semibold text-[#132842]">{record.name}</td>
              <td className="px-4 py-3 text-xs text-[#455c73]">{extractSiteName(record.site)}</td>
              <td className="px-4 py-3 text-xs text-[#455c73]">{record.date}</td>
              <td className="px-4 py-3 text-xs tabular-nums text-[#30465c]">{formatPayrollNumber(record.hours)}</td>
              <td className="px-4 py-3 text-xs tabular-nums text-[#30465c]">{formatPayrollNumber(record.overtimeHours ?? 0)}</td>
              <td className="px-4 py-3 text-xs font-semibold tabular-nums text-[#132842]">{formatPayrollNumber(record.totalHours ?? record.hours)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
