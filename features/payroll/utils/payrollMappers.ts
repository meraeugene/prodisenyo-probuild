import { normalizeRoleCode } from "@/lib/payrollConfig";
import type { DailyLogRow } from "@/types";

const EMPLOYEE_NAME_OVERRIDES: Record<string, string> = {
  pbryanm: "bryanmamerto",
};

export function parsePayrollIdentity(employeeText: string): {
  role: string;
  name: string;
} {
  const normalizedEmployee = employeeText.replace(/\s+/g, " ").trim();
  const [firstToken, ...rest] = normalizedEmployee.split(" ");
  const roleFromPrefix = normalizeRoleCode(firstToken);

  if (roleFromPrefix && rest.length > 0) {
    return {
      role: roleFromPrefix,
      name: rest.join(" ").trim(),
    };
  }

  return {
    role: "UNKNOWN",
    name: normalizedEmployee,
  };
}

export function getLogOverrideKey(log: DailyLogRow): string {
  return `${log.date}|||${log.employee}|||${log.site}`;
}

export function normalizeEmployeeNameKey(name: string): string {
  const normalized = name.trim().toLowerCase();
  const compact = normalized.replace(/[^a-z0-9]/g, "");
  return EMPLOYEE_NAME_OVERRIDES[compact] ?? compact;
}

function getEmployeeNameTokens(name: string): string[] {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

export function areLikelySameEmployeeName(a: string, b: string): boolean {
  const keyA = normalizeEmployeeNameKey(a);
  const keyB = normalizeEmployeeNameKey(b);
  if (!keyA || !keyB) return false;
  if (keyA === keyB) return true;

  const isPrefixMatch = keyA.startsWith(keyB) || keyB.startsWith(keyA);
  if (!isPrefixMatch) return false;

  const tokensA = getEmployeeNameTokens(a);
  const tokensB = getEmployeeNameTokens(b);
  if (tokensA.length === 0 || tokensB.length === 0) return false;

  return tokensA[0] === tokensB[0];
}

export function pickPreferredEmployeeDisplayName(
  currentName: string,
  candidateName: string,
): string {
  const currentTokens = getEmployeeNameTokens(currentName);
  const candidateTokens = getEmployeeNameTokens(candidateName);

  if (candidateTokens.length > currentTokens.length) return candidateName;
  if (candidateTokens.length < currentTokens.length) return currentName;
  if (candidateName.length > currentName.length) return candidateName;
  return currentName;
}

export function pickPreferredRoleCode(currentRole: string, nextRole: string): string {
  const normalizedCurrent = normalizeRoleCode(currentRole) ?? "UNKNOWN";
  const normalizedNext = normalizeRoleCode(nextRole) ?? "UNKNOWN";

  if (normalizedCurrent === "UNKNOWN" && normalizedNext !== "UNKNOWN") {
    return normalizedNext;
  }

  return normalizedCurrent;
}

export function parseTimeToDecimal(timeText: string): number | null {
  const match = timeText.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return Math.round((hours + minutes / 60) * 100) / 100;
}
