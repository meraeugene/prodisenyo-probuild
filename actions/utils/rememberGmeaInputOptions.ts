import "server-only";
import { gmeaWriter } from "@/features/gmea-projects/server/gmeaDatabase";
import { normalizeGmeaSavedOptions } from "@/features/gmea-inputs/utils/gmeaInputOptions";
import type { GmeaSavedOptionField } from "@/features/gmea-inputs/types";

// Call only after authorization/input validation and before the financial write,
// so a suggestion-storage failure cannot make a completed payment look unsaved.
export async function rememberGmeaInputOptions(input: Partial<Record<GmeaSavedOptionField, string>>) {
  const options = normalizeGmeaSavedOptions(input);
  if (!options.length) return;
  const db = gmeaWriter();
  for (const option of options) {
    const { error } = await db.from("gmea_expense_options").insert(option);
    // The existing unique index deduplicates field/value without case sensitivity.
    if (error && error.code !== "23505") throw new Error("Unable to save the reusable input value. Please try again.");
  }
}
