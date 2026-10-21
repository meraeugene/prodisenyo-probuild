"use client";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { saveGmeaProjectAction } from "@/actions/gmeaProjects";
import type { GmeaMutation, GmeaProject } from "../types";
import { useGmeaEntrySession } from "@/features/gmea-forms/components/GmeaEntrySession";
export function useGmeaMutation(project?: GmeaProject) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const session = useGmeaEntrySession();
  return async (command: GmeaMutation) => {
    const id = await saveGmeaProjectAction(
      project?.id ?? null,
      project?.version ?? null,
      command,
    );
    await Promise.allSettled([mutate("gmea-input-options"), mutate("gmea-dashboard:overview")]);
    if (command.kind === "delete_project") {
      await Promise.allSettled([mutate("gmea-projects:list")]);
      toast.success("Project deleted.");
      router.push("/gmea-projects");
      router.refresh();
      return id;
    }
    await Promise.allSettled([...(project ? [mutate(["gmea-project", project.id])] : []), mutate("gmea-projects:list")]);
    toast.success(
      command.kind === "project_status"
        ? command.value.status === "completed"
          ? "Project marked as completed."
          : "Project reopened."
        : "Saved successfully.",
    );
    if (!project && !session?.addingAgain()) router.push("/gmea-projects/" + id);
    router.refresh();
    return id;
  };
}
