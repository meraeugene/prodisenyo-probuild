"use server";

import type { ParseResult } from "@/lib/parser";
import type { Database } from "@/types/database";
import { resolveBiometricIdentity } from "@/features/attendance/utils/biometricIdentity";
import { requireRole } from "@/lib/auth";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

const INSERT_CHUNK_SIZE = 500;

type SiteRow = Database["public"]["Tables"]["sites"]["Row"];
type SiteInsert = Database["public"]["Tables"]["sites"]["Insert"];
type AttendanceImportInsert =
  Database["public"]["Tables"]["attendance_imports"]["Insert"];
type AttendanceRecordInsert =
  Database["public"]["Tables"]["attendance_records"]["Insert"];

interface SaveAttendanceImportInput {
  fileNames: string[];
  result: ParseResult;
}

function getFileBaseName(filename: string): string {
  const trimmed = filename.trim();
  const dotIndex = trimmed.lastIndexOf(".");
  return (dotIndex > 0 ? trimmed.slice(0, dotIndex) : trimmed).trim();
}

function normalizeSiteName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "Unknown Site";
  if (/^Multiple Sites/i.test(trimmed)) return trimmed;

  return trimmed
    .replace(/\.[^.]+$/i, "")
    .replace(/\s+\d{4}\s*to\s*\d{4}$/i, "")
    .replace(/\s+\d{4}to\d{4}$/i, "")
    .trim();
}

function collectNormalizedSiteNames(
  fileNames: string[],
  result: ParseResult,
): string[] {
  const names = new Set<string>();

  for (const fileName of fileNames) {
    const normalized = normalizeSiteName(getFileBaseName(fileName));
    if (normalized && !/^Multiple Sites/i.test(normalized)) {
      names.add(normalized);
    }
  }

  for (const record of result.records) {
    const normalized = normalizeSiteName(record.site);
    if (normalized && !/^Multiple Sites/i.test(normalized)) {
      names.add(normalized);
    }
  }

  const mergedSite = normalizeSiteName(result.site);
  if (mergedSite && !/^Multiple Sites/i.test(mergedSite)) {
    names.add(mergedSite);
  }

  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

function toSiteCode(siteName: string): string {
  return siteName
    .trim()
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase() || "UNKNOWN_SITE";
}

function parsePeriodRange(label: string): { start: string | null; end: string | null } {
  const match = label.match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/);
  if (!match) {
    return { start: null, end: null };
  }

  return {
    start: match[1] ?? null,
    end: match[2] ?? null,
  };
}

function buildRecordPeriodRange(
  records: ParseResult["records"],
): { start: string | null; end: string | null } {
  let start: string | null = null;
  let end: string | null = null;

  for (const record of records) {
    const date = record.date?.trim();
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (!start || date < start) start = date;
    if (!end || date > end) end = date;
  }

  return { start, end };
}

function resolveAttendanceImportPeriod(result: ParseResult): {
  label: string;
  start: string | null;
  end: string | null;
} {
  const parsedLabelRange = parsePeriodRange(result.period);
  const recordRange = buildRecordPeriodRange(result.records);

  const hasParsedLabelRange =
    parsedLabelRange.start !== null && parsedLabelRange.end !== null;
  const hasRecordRange = recordRange.start !== null && recordRange.end !== null;

  if (
    hasParsedLabelRange &&
    hasRecordRange &&
    recordRange.start! >= parsedLabelRange.start! &&
    recordRange.end! <= parsedLabelRange.end!
  ) {
    return {
      label: `${recordRange.start} to ${recordRange.end}`,
      start: recordRange.start,
      end: recordRange.end,
    };
  }

  if (hasParsedLabelRange) {
    return {
      label: `${parsedLabelRange.start} to ${parsedLabelRange.end}`,
      start: parsedLabelRange.start,
      end: parsedLabelRange.end,
    };
  }

  if (hasRecordRange) {
    return {
      label: `${recordRange.start} to ${recordRange.end}`,
      start: recordRange.start,
      end: recordRange.end,
    };
  }

  return {
    label: result.period,
    start: null,
    end: null,
  };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function upsertSite(
  supabase:
    | Awaited<ReturnType<typeof createSupabaseServerClient>>
    | ReturnType<typeof createSupabaseAdminClient>,
  siteName: string,
): Promise<Pick<SiteRow, "id" | "code" | "name"> | null> {
  if (/^Multiple Sites/i.test(siteName)) {
    return null;
  }

  const siteCode = toSiteCode(siteName);
  const sitePayload: SiteInsert = {
    code: siteCode,
    name: siteName,
  };
  const database = supabase as any;
  const { data, error } = await database
    .from("sites")
    .upsert(sitePayload, { onConflict: "code" })
    .select("id, code, name")
    .single();

  if (error) {
    throw new Error(`Failed to save site. ${error.message}`);
  }

  return data;
}

export async function saveAttendanceImportAction({
  fileNames,
  result,
}: SaveAttendanceImportInput) {
  const { user } = await requireRole(["ceo", "payroll_manager"]);
  const database = createSupabaseAdminClient() as any;

  const normalizedImportSite = normalizeSiteName(result.site);
  const resolvedPeriod = resolveAttendanceImportPeriod(result);
  const normalizedSiteNames = collectNormalizedSiteNames(fileNames, result);
  const fileLabel =
    fileNames.length <= 1 ? fileNames[0] ?? "attendance-upload" : fileNames.join(" | ");

  const savedSites = await Promise.all(
    normalizedSiteNames.map((siteName) => upsertSite(database, siteName)),
  );
  const siteByName = new Map(
    savedSites
      .filter((site): site is NonNullable<typeof site> => Boolean(site))
      .map((site) => [site.name.trim().toLowerCase(), site]),
  );
  const site =
    /^Multiple Sites/i.test(normalizedImportSite)
      ? null
      : siteByName.get(normalizedImportSite.trim().toLowerCase()) ?? null;
  const { data: employeeRows, error: employeeError } = await database
    .from("employees")
    .select("id, full_name, default_role_code");
  if (employeeError) throw new Error(`Failed to load employees. ${employeeError.message}`);
  const { data: aliasRows, error: aliasError } = await database
    .from("employee_biometric_aliases")
    .select("employee_id, normalized_alias, confirmed, match_source");
  if (aliasError) throw new Error(`Failed to load biometric aliases. ${aliasError.message}`);
  const canonicalEmployees = (employeeRows ?? []) as Array<{ id: string; full_name: string; default_role_code: string | null }>;
  const resolutions = new Map(
    Array.from(new Set(result.records.map((record) => record.employee))).map((rawName) => [
      rawName,
      resolveBiometricIdentity(rawName, canonicalEmployees, aliasRows ?? []),
    ]),
  );
  const resolvedRecords = result.records.map((record) => {
    const resolution = resolutions.get(record.employee)!;
    const employee = canonicalEmployees.find((candidate) => candidate.id === resolution.employeeId);
    return {
      ...record,
      employee: resolution.officialName ?? record.employee,
      employeeId: resolution.employeeId,
      role: employee?.default_role_code ?? undefined,
      rawBiometricName: record.employee,
      normalizedBiometricName: resolution.normalizedAlias,
      matchStatus: resolution.status,
      matchSource: resolution.source,
    };
  });

  const attendanceImportPayload: AttendanceImportInsert = {
    original_filename: fileLabel,
    site_id: site?.id ?? null,
    site_name: normalizedImportSite,
    period_label: resolvedPeriod.label,
    period_start: resolvedPeriod.start,
    period_end: resolvedPeriod.end,
    storage_path: null,
    uploaded_by: user.id,
    raw_rows: result.rawRows,
    removed_entries: result.removedEntries,
  };
  const { data: savedImport, error: importError } = await database
    .from("attendance_imports")
    .insert(attendanceImportPayload)
    .select("id")
    .single();

  if (importError || !savedImport) {
    throw new Error(
      `Failed to save attendance import.${importError ? ` ${importError.message}` : ""}`,
    );
  }

  const recordPayload = resolvedRecords.map((record) => ({
    import_id: savedImport.id,
    employee_id: record.employeeId ?? null,
    employee_name: record.employee,
    raw_biometric_name: record.rawBiometricName,
    normalized_biometric_name: record.normalizedBiometricName,
    match_status: record.matchStatus,
    match_source: record.matchSource,
    log_date: record.date,
    log_time: record.logTime.replace(/\+$/, ""),
    is_next_day: record.nextDay ?? record.logTime.endsWith("+"),
    log_type: record.type,
    log_source: record.source,
    site_name: normalizeSiteName(record.site),
  })) as AttendanceRecordInsert[];

  for (const chunk of chunkArray(recordPayload, INSERT_CHUNK_SIZE)) {
    if (chunk.length === 0) continue;

    const { error } = await database.from("attendance_records").insert(chunk);
    if (error) {
      throw new Error(`Failed to save attendance records. ${error.message}`);
    }
  }

  return {
    importId: savedImport.id,
    siteName: normalizedImportSite,
    recordsSaved: recordPayload.length,
    resolvedResult: { ...result, records: resolvedRecords },
  };
}
