"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ParseResult } from "@/lib/parser";
import type {
  AttendanceRecord,
  Employee,
  ThemeMode,
  UploadedFileItem,
} from "@/types";
import {
  useAttendanceReview,
  type UseAttendanceReviewResult,
} from "@/features/attendance/hooks/useAttendanceReview";
import {
  usePayrollState,
  type UsePayrollStateResult,
} from "@/features/payroll/hooks/usePayrollState";

const STORAGE_KEY = "prodisenyo-dashboard-state-v1";

interface PersistedDashboardState {
  uploadedFiles: Array<{
    name: string;
    size: number;
    lastModified: number;
  }>;
  records: AttendanceRecord[];
  site: string;
  attendancePeriod: string;
  employees: Employee[];
  theme: ThemeMode;
  attendanceUi: {
    step2View: UseAttendanceReviewResult["step2View"];
    step2Sort: UseAttendanceReviewResult["step2Sort"];
    recordsPage: number;
    step2SiteFilter: string;
    step2NameFilter: string;
    step2DateFilter: string;
  };
  payrollUi: {
    payrollRoleRates: UsePayrollStateResult["payrollRoleRates"];
    payrollGenerated: boolean;
    payrollTab: UsePayrollStateResult["payrollTab"];
    payrollPage: number;
    payrollSiteFilter: string;
    payrollNameFilter: string;
    payrollDateFilter: string;
    payrollSort: UsePayrollStateResult["payrollSort"];
    payrollRoleFilter: UsePayrollStateResult["payrollRoleFilter"];
    paidHolidays: UsePayrollStateResult["paidHolidays"];
    payrollOverrides: UsePayrollStateResult["payrollOverrides"];
  };
}

interface AppStateContextValue {
  hydrated: boolean;
  uploadedFiles: UploadedFileItem[];
  records: AttendanceRecord[];
  site: string;
  attendancePeriod: string;
  employees: Employee[];
  theme: ThemeMode;
  attendance: UseAttendanceReviewResult;
  payroll: UsePayrollStateResult;
  hasAttendanceData: boolean;
  overviewStats: {
    employees: number;
    records: number;
    reviewRows: number;
    payrollRows: number;
    payrollTotal: number;
  };
  setTheme: (nextTheme: ThemeMode) => void;
  setUploadedFiles: (
    value:
      | UploadedFileItem[]
      | ((prev: UploadedFileItem[]) => UploadedFileItem[]),
  ) => void;
  handleParsed: (result: ParseResult) => void;
  handleClearAttendanceData: () => void;
  handleReset: () => void;
  handleGeneratePayroll: () => boolean;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

function isThemeMode(value: string): value is ThemeMode {
  return value === "prodisenyo";
}

function normalizeThemeMode(value: string | null): ThemeMode | null {
  if (!value || !isThemeMode(value)) return null;
  return value;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [site, setSite] = useState("Unknown Site");
  const [attendancePeriod, setAttendancePeriod] = useState("Current Period");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [theme, setTheme] = useState<ThemeMode>("prodisenyo");

  const attendance = useAttendanceReview(records);
  const payroll = usePayrollState({
    dailyRows: attendance.dailyRows,
    attendancePeriod,
    availableSites: attendance.availableSites,
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setHydrated(true);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<PersistedDashboardState>;
      setUploadedFiles(
        (parsed.uploadedFiles ?? []).map((file) => ({
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          file: null,
          persisted: true,
        })),
      );
      setRecords(parsed.records ?? []);
      setSite(parsed.site ?? "Unknown Site");
      setAttendancePeriod(parsed.attendancePeriod ?? "Current Period");
      setEmployees(parsed.employees ?? []);

      const persistedTheme = normalizeThemeMode(parsed.theme ?? null);
      if (persistedTheme) {
        setTheme(persistedTheme);
      }

      if (parsed.attendanceUi) {
        attendance.setStep2View(parsed.attendanceUi.step2View ?? "daily");
        attendance.setStep2Sort(parsed.attendanceUi.step2Sort ?? "date-asc");
        attendance.setRecordsPage(parsed.attendanceUi.recordsPage ?? 1);
        attendance.setStep2SiteFilter(parsed.attendanceUi.step2SiteFilter ?? "ALL");
        attendance.setStep2NameFilter(parsed.attendanceUi.step2NameFilter ?? "");
        attendance.setStep2DateFilter(parsed.attendanceUi.step2DateFilter ?? "");
      }

      if (parsed.payrollUi) {
        payroll.setPayrollRoleRates(
          parsed.payrollUi.payrollRoleRates ?? payroll.payrollRoleRates,
        );
        payroll.setPayrollGenerated(parsed.payrollUi.payrollGenerated ?? false);
        payroll.setPayrollTab(parsed.payrollUi.payrollTab ?? "payroll");
        payroll.setPayrollPage(parsed.payrollUi.payrollPage ?? 1);
        payroll.setPayrollSiteFilter(parsed.payrollUi.payrollSiteFilter ?? "ALL");
        payroll.setPayrollNameFilter(parsed.payrollUi.payrollNameFilter ?? "");
        payroll.setPayrollDateFilter(parsed.payrollUi.payrollDateFilter ?? "");
        payroll.setPayrollSort(parsed.payrollUi.payrollSort ?? "date-asc");
        payroll.setPayrollRoleFilter(parsed.payrollUi.payrollRoleFilter ?? "ALL");
        payroll.setPaidHolidays(parsed.payrollUi.paidHolidays ?? []);
        payroll.setPayrollOverrides(parsed.payrollUi.payrollOverrides ?? {});
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!hydrated) return;

    const payload: PersistedDashboardState = {
      uploadedFiles: uploadedFiles.map((file) => ({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
      })),
      records,
      site,
      attendancePeriod,
      employees,
      theme,
      attendanceUi: {
        step2View: attendance.step2View,
        step2Sort: attendance.step2Sort,
        recordsPage: attendance.recordsPage,
        step2SiteFilter: attendance.step2SiteFilter,
        step2NameFilter: attendance.step2NameFilter,
        step2DateFilter: attendance.step2DateFilter,
      },
      payrollUi: {
        payrollRoleRates: payroll.payrollRoleRates,
        payrollGenerated: payroll.payrollGenerated,
        payrollTab: payroll.payrollTab,
        payrollPage: payroll.payrollPage,
        payrollSiteFilter: payroll.payrollSiteFilter,
        payrollNameFilter: payroll.payrollNameFilter,
        payrollDateFilter: payroll.payrollDateFilter,
        payrollSort: payroll.payrollSort,
        payrollRoleFilter: payroll.payrollRoleFilter,
        paidHolidays: payroll.paidHolidays,
        payrollOverrides: payroll.payrollOverrides,
      },
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    hydrated,
    uploadedFiles,
    records,
    site,
    attendancePeriod,
    employees,
    theme,
    attendance.step2View,
    attendance.step2Sort,
    attendance.recordsPage,
    attendance.step2SiteFilter,
    attendance.step2NameFilter,
    attendance.step2DateFilter,
    payroll.payrollRoleRates,
    payroll.payrollGenerated,
    payroll.payrollTab,
    payroll.payrollPage,
    payroll.payrollSiteFilter,
    payroll.payrollNameFilter,
    payroll.payrollDateFilter,
    payroll.payrollSort,
    payroll.payrollRoleFilter,
    payroll.paidHolidays,
    payroll.payrollOverrides,
  ]);

  const handleParsed = useCallback(
    (result: ParseResult) => {
      setEmployees(result.employees);
      setRecords(result.records);
      setAttendancePeriod(result.period);
      setSite(result.site);
      attendance.resetAttendanceReview();
      payroll.resetPayrollState();
    },
    [attendance, payroll],
  );

  const handleClearAttendanceData = useCallback(() => {
    setUploadedFiles([]);
    setRecords([]);
    setEmployees([]);
    setSite("Unknown Site");
    setAttendancePeriod("Current Period");
    attendance.resetAttendanceReview();
    payroll.resetPayrollState();
  }, [attendance, payroll]);

  const handleReset = useCallback(() => {
    handleClearAttendanceData();
    window.localStorage.removeItem(STORAGE_KEY);
  }, [handleClearAttendanceData]);

  const handleGeneratePayroll = useCallback(() => {
    return payroll.handleGeneratePayroll();
  }, [payroll]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      hydrated,
      uploadedFiles,
      records,
      site,
      attendancePeriod,
      employees,
      theme,
      attendance,
      payroll,
      hasAttendanceData: records.length > 0,
      overviewStats: {
        employees: employees.length,
        records: records.length,
        reviewRows: attendance.dailyRows.length,
        payrollRows: payroll.filteredPayrollRows.length,
        payrollTotal: payroll.payrollTotals.pay,
      },
      setTheme,
      setUploadedFiles,
      handleParsed,
      handleClearAttendanceData,
      handleReset,
      handleGeneratePayroll,
    }),
    [
      hydrated,
      uploadedFiles,
      records,
      site,
      attendancePeriod,
      employees,
      theme,
      attendance,
      payroll,
      handleParsed,
      handleClearAttendanceData,
      handleReset,
      handleGeneratePayroll,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider.");
  }
  return context;
}
