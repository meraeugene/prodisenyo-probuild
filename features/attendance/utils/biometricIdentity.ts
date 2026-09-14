import type { BiometricMatchSource, BiometricMatchStatus } from "@/types";

const PREFIXES = new Set([
  "l", "s", "e", "p", "pa", "labor", "skilled", "electrician", "elec",
  "engineer", "engr", "installer", "leadman", "foreman", "fore", "welder",
  "driver", "ojt",
]);
const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv"]);

export interface BiometricEmployeeIdentity {
  id: string;
  full_name: string;
}

export interface BiometricAliasIdentity {
  employee_id: string;
  normalized_alias: string;
  confirmed: boolean;
  match_source: BiometricMatchSource;
}

export interface BiometricIdentityResolution {
  employeeId: string | null;
  officialName: string | null;
  suggestedEmployeeId: string | null;
  suggestedOfficialName: string | null;
  rawName: string;
  normalizedAlias: string;
  normalizedComparison: string;
  status: BiometricMatchStatus;
  source: BiometricMatchSource | null;
}

export function normalizeBiometricAlias(value: string): string {
  return value
    .replace(/^([lsep])(?=[A-Z][a-z])/u, "$1 ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeBiometricComparison(value: string): string {
  const values = normalizeBiometricAlias(value).split(" ").filter(Boolean);
  while (values.length > 1 && PREFIXES.has(values[0])) values.shift();
  return values.join(" ");
}

function tokens(value: string): string[] {
  return normalizeBiometricAlias(value).split(" ").filter(Boolean);
}

function signature(value: string): string {
  return tokens(value).sort((a, b) => a.localeCompare(b)).join("|");
}

function canonicalLooking(value: string): boolean {
  const primary = tokens(value).filter((token) => !SUFFIXES.has(token));
  return primary.length >= 2 && primary.every((token) => token.length > 1);
}

function tokenEditDistance(left: string, right: string): number {
  if (Math.abs(left.length - right.length) > 1) {
    return Math.max(left.length, right.length);
  }
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function isCloseToken(left: string, right: string): boolean {
  if (left === right || left.startsWith(right) || right.startsWith(left)) {
    return true;
  }
  const distance = tokenEditDistance(left, right);
  return distance <= Math.max(1, Math.floor(right.length / 5));
}

function isStrongUniqueFullNameVariant(
  raw: string,
  employeeName: string,
): boolean {
  const rawTokens = tokens(raw)
    .filter((token) => !SUFFIXES.has(token))
    .sort((a, b) => a.localeCompare(b));
  const employeeTokens = tokens(employeeName)
    .filter((token) => !SUFFIXES.has(token))
    .sort((a, b) => a.localeCompare(b));

  if (rawTokens.length < 2 || rawTokens.length !== employeeTokens.length) {
    return false;
  }

  let changedTokens = 0;
  for (let index = 0; index < rawTokens.length; index += 1) {
    if (rawTokens[index] === employeeTokens[index]) continue;
    if (tokenEditDistance(rawTokens[index], employeeTokens[index]) !== 1) {
      return false;
    }
    changedTokens += 1;
  }

  return changedTokens === 1;
}

function reasonableCandidate(raw: string, employeeName: string): boolean {
  const rawTokens = tokens(raw).filter((token) => !SUFFIXES.has(token));
  const employeeTokens = tokens(employeeName).filter(
    (token) => !SUFFIXES.has(token),
  );
  if (!rawTokens.length || !employeeTokens.length) return false;
  return rawTokens.every((token) =>
    employeeTokens.some((candidate) => isCloseToken(candidate, token)),
  );
}

export function resolveBiometricIdentity(
  rawName: string,
  employees: BiometricEmployeeIdentity[],
  aliases: BiometricAliasIdentity[],
): BiometricIdentityResolution {
  const normalizedAlias = normalizeBiometricAlias(rawName);
  const normalizedComparison = normalizeBiometricComparison(rawName);
  const base = {
    rawName,
    normalizedAlias,
    normalizedComparison,
    suggestedEmployeeId: null,
    suggestedOfficialName: null,
  };
  const confirmed = aliases.filter(
    (alias) => alias.confirmed && alias.normalized_alias === normalizedAlias,
  );
  const confirmedIds = new Set(confirmed.map((alias) => alias.employee_id));

  if (confirmedIds.size === 1) {
    const employee = employees.find(
      (candidate) => candidate.id === confirmed[0].employee_id,
    );
    if (employee) {
      return {
        ...base,
        employeeId: employee.id,
        officialName: employee.full_name,
        status: "MATCHED",
        source: "EXISTING_ALIAS",
      };
    }
  }

  if (confirmedIds.size > 1) {
    return {
      ...base, employeeId: null, officialName: null,
      status: "NEEDS_REVIEW", source: null,
    };
  }

  if (
    aliases.some(
      (alias) =>
        !alias.confirmed && alias.normalized_alias === normalizedAlias,
    )
  ) {
    const candidateAliases = aliases.filter(
      (alias) =>
        !alias.confirmed && alias.normalized_alias === normalizedAlias,
    );
    const candidateIds = new Set(
      candidateAliases.map((alias) => alias.employee_id),
    );
    const candidate =
      candidateIds.size === 1
        ? employees.find(
            (employee) => employee.id === candidateAliases[0].employee_id,
          )
        : null;
    return {
      ...base,
      employeeId: null,
      officialName: null,
      suggestedEmployeeId: candidate?.id ?? null,
      suggestedOfficialName: candidate?.full_name ?? null,
      status: "NEEDS_REVIEW",
      source: candidate ? candidateAliases[0].match_source : null,
    };
  }

  const exact = employees.filter(
    (employee) =>
      canonicalLooking(employee.full_name) &&
      normalizeBiometricAlias(employee.full_name) === normalizedComparison,
  );
  if (exact.length === 1) {
    return {
      ...base,
      employeeId: exact[0].id,
      officialName: exact[0].full_name,
      status: "MATCHED",
      source: "EXACT_NAME",
    };
  }

  if (tokens(normalizedComparison).length >= 2) {
    const normalized = employees.filter(
      (employee) =>
        canonicalLooking(employee.full_name) &&
        signature(employee.full_name) === signature(normalizedComparison),
    );
    if (normalized.length === 1) {
      return {
        ...base,
        employeeId: normalized[0].id,
        officialName: normalized[0].full_name,
        status: "MATCHED",
        source: "NORMALIZED_MATCH",
      };
    }
  }

  const strongVariants = employees.filter(
    (employee) =>
      canonicalLooking(employee.full_name) &&
      isStrongUniqueFullNameVariant(normalizedComparison, employee.full_name),
  );
  if (strongVariants.length === 1) {
    return {
      ...base,
      employeeId: strongVariants[0].id,
      officialName: strongVariants[0].full_name,
      status: "MATCHED",
      source: "NORMALIZED_MATCH",
    };
  }

  const candidates = employees.filter(
    (employee) =>
      canonicalLooking(employee.full_name) &&
      reasonableCandidate(normalizedComparison, employee.full_name),
  );
  if (candidates.length === 1) {
    return {
      ...base,
      employeeId: null,
      officialName: null,
      suggestedEmployeeId: candidates[0].id,
      suggestedOfficialName: candidates[0].full_name,
      status: "NEEDS_REVIEW",
      source: "NORMALIZED_MATCH",
    };
  }

  return {
    ...base,
    employeeId: null,
    officialName: null,
    status: candidates.length > 1 ? "NEEDS_REVIEW" : "UNMATCHED",
    source: null,
  };
}
