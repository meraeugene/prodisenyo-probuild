"use server";
import { revalidatePath } from "next/cache";
import type { Json } from "@/types/database";
import {
  getGmeaExpenseOptions,
  getGmeaProjects,
  requireGmeaAccess,
} from "@/features/gmea-projects/server/gmeaQueries";
import { gmeaWriter } from "@/features/gmea-projects/server/gmeaDatabase";
import {
  normalizeMutation,
  validId,
} from "@/features/gmea-projects/utils/gmeaValidation";
import type { GmeaMutation } from "@/features/gmea-projects/types";
import { APP_ROLES, requireRole } from "@/lib/auth";

export async function getGmeaProjectsDataAction() {
  return getGmeaProjects();
}

export async function getGmeaProjectDataAction(projectId: string) {
  validId(projectId);
  const [[project], expenseOptions] = await Promise.all([
    getGmeaProjects(projectId),
    getGmeaExpenseOptions(),
  ]);
  return { project: project ?? null, expenseOptions };
}

export async function saveGmeaProjectAction(
  projectId: string | null,
  version: number | null,
  input: GmeaMutation,
) {
  const { user } = await requireGmeaAccess(true);
  const command = normalizeMutation(input);
  if (projectId) {
    validId(projectId);
    if (!Number.isInteger(version) || (version ?? 0) < 1)
      throw new Error("Reload this project before saving.");
  } else if (command.kind !== "project")
    throw new Error("Create a project first.");
  const { data, error } = await gmeaWriter().rpc("mutate_gmea_project", {
    p_actor: user.id,
    p_project: projectId,
    p_version: version,
    p_command: command as unknown as Json,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/gmea-projects");
  revalidatePath("/gmea-projects/" + data);
  return data;
}

export async function getUnreadGmeaExpenseCountAction() {
  const { user, profile } = await requireRole(APP_ROLES.CEO);
  if (!profile.is_active) throw new Error("This account is inactive.");
  const { count, error } = await gmeaWriter()
    .from("gmea_expense_notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .is("read_at", null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function markGmeaExpenseViewedAction(
  projectId: string,
  expenseId: string,
) {
  validId(projectId);
  validId(expenseId);
  const { user, profile } = await requireRole(APP_ROLES.CEO);
  if (!profile.is_active) throw new Error("This account is inactive.");
  const { error } = await gmeaWriter().rpc("mark_gmea_expense_viewed", {
    p_actor: user.id,
    p_project: projectId,
    p_expense: expenseId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/gmea-projects");
  revalidatePath("/gmea-projects/" + projectId);
}
