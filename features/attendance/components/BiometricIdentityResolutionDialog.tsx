"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { confirmBiometricAliasAction } from "@/actions/biometricAliases";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatLogTime } from "@/features/payroll/utils/payrollFormatters";
import { normalizeBiometricAlias } from "@/features/attendance/utils/biometricIdentity";
import type { AttendanceRecord, DailyLogRow } from "@/types";

interface EmployeeOption {
  id: string;
  full_name: string;
}

interface Props {
  rawAlias: string;
  records?: AttendanceRecord[];
  dailyLogs?: DailyLogRow[];
  onClose: () => void;
}

export function BiometricIdentityResolutionDialog({
  rawAlias,
  records = [],
  dailyLogs = [],
  onClose,
}: Props) {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();
    Promise.all([
      supabase.from("employees").select("id, full_name").order("full_name"),
      supabase
        .from("employee_biometric_aliases")
        .select("employee_id")
        .eq("normalized_alias", normalizeBiometricAlias(rawAlias))
        .maybeSingle(),
    ]).then(([employeeResult, aliasResult]) => {
        if (!active) return;
        if (employeeResult.error) toast.error("Unable to load canonical employees.");
        setEmployees((employeeResult.data ?? []) as EmployeeOption[]);
        const aliasCandidate = aliasResult.data as { employee_id: string } | null;
        if (aliasCandidate?.employee_id) {
          setSelectedId(aliasCandidate.employee_id);
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [rawAlias]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees
      .filter((employee) => employee.full_name.toLowerCase().includes(query))
      .slice(0, 12);
  }, [employees, search]);
  const aliasRecords = records.filter(
    (record) =>
      (record.rawBiometricName ?? record.employee).trim().toLowerCase() ===
      rawAlias.trim().toLowerCase(),
  );
  const aliasLogs = dailyLogs.filter((log) =>
    (log.rawBiometricNames ?? [log.employee]).some(
      (name) => name.trim().toLowerCase() === rawAlias.trim().toLowerCase(),
    ),
  );
  const sites = Array.from(new Set([
    ...aliasRecords.map((record) => record.site),
    ...aliasLogs.flatMap((log) => log.sitePath?.length ? log.sitePath : [log.site]),
  ].filter(Boolean)));
  const punches = [
    ...aliasRecords.map((record) => record.logTime),
    ...aliasLogs.flatMap((log) => [log.time1In, log.time1Out, log.time2In, log.time2Out, log.otIn, log.otOut]),
  ].filter(Boolean);

  async function confirm() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const result = await confirmBiometricAliasAction({
        rawAlias,
        employeeId: selectedId,
      });
      toast.success(`${rawAlias} is now matched to ${result.officialName}.`);
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to confirm alias.",
      );
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/45 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 p-4">
          <div>
            <h3 className="text-sm font-bold text-slate-950">Resolve biometric name</h3>
            <p className="mt-1 text-xs text-slate-500">
              Raw name: <span className="font-mono font-semibold">{rawAlias}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100">
            <X size={16} />
          </button>
        </header>

        <div className="space-y-4 p-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <p>Source sites: {sites.join(", ") || "-"}</p>
            <p className="mt-1">
              Punches: {punches.slice(0, 8).map(formatLogTime).join(", ") || "-"}
            </p>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search canonical employee..."
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
          />
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {loading ? (
              <LoaderCircle className="mx-auto my-8 animate-spin text-teal-700" size={20} />
            ) : (
              filtered.map((employee) => (
                <label key={employee.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50">
                  <input type="radio" name="employee" value={employee.id} checked={selectedId === employee.id} onChange={() => setSelectedId(employee.id)} />
                  <span className="text-sm font-semibold text-slate-800">{employee.full_name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 p-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-700">Cancel</button>
          <button type="button" onClick={confirm} disabled={!selectedId || saving} className="h-9 rounded-lg bg-teal-700 px-4 text-xs font-bold text-white disabled:opacity-50">
            {saving ? "Saving..." : "Confirm Alias"}
          </button>
        </footer>
      </div>
    </div>
  );
}
