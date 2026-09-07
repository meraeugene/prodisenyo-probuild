"use client";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { saveGmeaProjectAction } from "@/actions/gmeaProjects";
import type { GmeaMutation, GmeaProject } from "../types";
export function useGmeaMutation(project?: GmeaProject) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  return async (command: GmeaMutation) => {
    const id = await saveGmeaProjectAction(
      project?.id ?? null,
      project?.version ?? null,
      command,
    );
    if (command.kind === "delete_project") {
      await mutate("gmea-projects:list");
      toast.success("Project deleted.");
      router.push("/gmea-projects");
      router.refresh();
      return id;
    }
    if (project) await mutate(["gmea-project", project.id]);
    else await mutate("gmea-projects:list");
    toast.success("Saved successfully.");
    if (!project) router.push("/gmea-projects/" + id);
    router.refresh();
    return id;
  };
}
