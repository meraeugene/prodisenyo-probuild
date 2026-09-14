"use server";

import { requireRole } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { normalizeBiometricAlias } from "@/features/attendance/utils/biometricIdentity";

interface ConfirmBiometricAliasInput {
  rawAlias: string;
  employeeId: string;
}

export async function confirmBiometricAliasAction(
  input: ConfirmBiometricAliasInput,
) {
  const { user } = await requireRole(["ceo", "payroll_manager"]);
  const database = createSupabaseAdminClient() as any;
  const rawAlias = input.rawAlias.trim();
  const normalizedAlias = normalizeBiometricAlias(rawAlias);
  if (!rawAlias || !normalizedAlias || !input.employeeId) {
    throw new Error("A raw biometric name and employee are required.");
  }

  const { data: employee, error: employeeError } = await database
    .from("employees")
    .select("id, full_name")
    .eq("id", input.employeeId)
    .maybeSingle();
  if (employeeError || !employee) {
    throw new Error("The selected canonical employee no longer exists.");
  }

  const { data: existingAlias, error: aliasLookupError } = await database
    .from("employee_biometric_aliases")
    .select("id, employee_id, confirmed")
    .eq("normalized_alias", normalizedAlias)
    .maybeSingle();
  if (aliasLookupError) {
    throw new Error("Unable to check the biometric alias mapping.");
  }
  if (
    existingAlias?.confirmed &&
    existingAlias.employee_id !== input.employeeId
  ) {
    throw new Error(
      "This biometric alias is already confirmed for another employee.",
    );
  }

  const confirmedAt = new Date().toISOString();
  const payload = {
    employee_id: input.employeeId,
    raw_alias: rawAlias,
    normalized_alias: normalizedAlias,
    match_source: "MANUAL",
    confidence: 1,
    confirmed: true,
    confirmed_by: user.id,
    confirmed_at: confirmedAt,
    updated_at: confirmedAt,
  };
  const aliasMutation = existingAlias
    ? database
        .from("employee_biometric_aliases")
        .update(payload)
        .eq("id", existingAlias.id)
    : database.from("employee_biometric_aliases").insert(payload);
  const { error: aliasError } = await aliasMutation;
  if (aliasError) {
    throw new Error(`Failed to confirm biometric alias. ${aliasError.message}`);
  }

  const { error: recordsError } = await database
    .from("attendance_records")
    .update({
      employee_id: employee.id,
      employee_name: employee.full_name,
      match_status: "MATCHED",
      match_source: "MANUAL",
    })
    .eq("normalized_biometric_name", normalizedAlias);
  if (recordsError) {
    throw new Error(`Alias saved, but attendance refresh failed. ${recordsError.message}`);
  }
  const { error: legacyRecordsError } = await database
    .from("attendance_records")
    .update({
      employee_id: employee.id,
      employee_name: employee.full_name,
      normalized_biometric_name: normalizedAlias,
      match_status: "MATCHED",
      match_source: "MANUAL",
    })
    .eq("raw_biometric_name", rawAlias);
  if (legacyRecordsError) {
    throw new Error(
      `Alias saved, but legacy attendance refresh failed. ${legacyRecordsError.message}`,
    );
  }

  await database.from("audit_logs").insert({
    actor_id: user.id,
    action: "CONFIRM_BIOMETRIC_ALIAS",
    entity_type: "employee_biometric_alias",
    entity_id: existingAlias?.id ?? employee.id,
    payload: {
      raw_alias: rawAlias,
      normalized_alias: normalizedAlias,
      employee_id: employee.id,
      official_employee_name: employee.full_name,
    },
  });

  return {
    employeeId: employee.id as string,
    officialName: employee.full_name as string,
  };
}
