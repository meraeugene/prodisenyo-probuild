"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveGmeaProjectAction } from "@/actions/gmeaProjects";
import type { GmeaMutation, GmeaProject } from "../types";
export function useGmeaMutation(project?: GmeaProject) {
  const router = useRouter();
  return async (command: GmeaMutation) => {
    const id = await saveGmeaProjectAction(
      project?.id ?? null,
      project?.version ?? null,
      command,
    );
    toast.success("Saved successfully.");
    if (!project) router.push("/gmea-projects/" + id);
    router.refresh();
    return id;
  };
}
