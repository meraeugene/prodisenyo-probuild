"use server";
import { revalidatePath } from "next/cache";
import type { Json } from "@/types/database";
import { requireGmeaAccess } from "@/features/gmea-projects/server/gmeaQueries";
import { gmeaWriter } from "@/features/gmea-projects/server/gmeaDatabase";
import {
  normalizeMutation,
  validId,
} from "@/features/gmea-projects/utils/gmeaValidation";
import type { GmeaMutation } from "@/features/gmea-projects/types";

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
