// Privileged maintenance entry point. Called by the local workbook import CLI,
// never exposed as a browser-callable action. All writes use the audited RPC.
import type { gmeaWriter } from "@/features/gmea-projects/server/gmeaDatabase";
import type { Json } from "@/types/database";
import type { GmeaMutation } from "@/features/gmea-projects/types";
import { validId } from "@/features/gmea-projects/utils/gmeaValidation";

export async function applyGmeaContractReconciliation(
  db: ReturnType<typeof gmeaWriter>, actor: string, plans: { id: string; title: string; version: number; commands: GmeaMutation[] }[],
  onApplied: (project: string, version: number) => void,
) {
  validId(actor);
  // Preflight all versions before the first write. Each RPC also locks and checks
  // the version inside its transaction; a concurrent edit stops the import.
  for (const plan of plans) {
    validId(plan.id);
    const { data, error } = await db.from("gmea_projects").select("version").eq("id", plan.id).single();
    if (error || data?.version !== plan.version) throw new Error(`Reload ${plan.title} before reconciliation.`);
  }
  for (const plan of plans) {
    let version = plan.version;
    for (const command of plan.commands) {
      const { error } = await db.rpc("mutate_gmea_project", {
        p_actor: actor, p_project: plan.id, p_version: version,
        p_command: command as unknown as Json,
      });
      if (error) throw new Error(`${plan.title}: ${error.message}. Check the saved import journal before retrying.`);
      onApplied(plan.id, ++version);
    }
  }
}
