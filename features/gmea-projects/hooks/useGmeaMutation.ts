"use client";
import { useRouter } from "next/navigation";
import { useGmeaCacheRefresh } from "@/features/gmea-forms/hooks/useGmeaCacheRefresh";
import { toast } from "sonner";
import { saveGmeaProjectAction } from "@/actions/gmeaProjects";
import type { GmeaMutation, GmeaProject } from "../types";
import { useGmeaEntrySession } from "@/features/gmea-forms/components/GmeaEntrySession";
export function useGmeaMutation(project?: GmeaProject) {
  const router = useRouter();
  const refresh = useGmeaCacheRefresh();
  const session = useGmeaEntrySession();
  return async (command: GmeaMutation) => {
    const id = await saveGmeaProjectAction(
      project?.id ?? null,
      project?.version ?? null,
      command,
    );
    // Server actions already revalidate affected routes; avoid another route refresh.
    const details = command.kind === "create_project" ? command.value.details : command.kind === "project_details" ? command.value : undefined;
    const savedInputs = command.kind === "expense"
      ? { suppliers: command.value.supplier, methods: command.value.method, invoiceNames: command.value.invoice_name }
      : command.kind === "record_receipt" ? { methods: command.value.method }
      : details ? { clients: details.client, locations: details.location } : undefined;
    refresh([...(project && command.kind !== "delete_project" ? [["gmea-project", project.id]] : []),
      "gmea-projects:list", "gmea-dashboard:overview"], savedInputs);
    if (command.kind === "delete_project") {
      toast.success("Project deleted.");
      router.push("/gmea-projects");
      return id;
    }
    toast.success(
      command.kind === "project_status"
        ? command.value.status === "completed"
          ? "Project marked as completed."
          : "Project reopened."
        : "Saved successfully.",
    );
    if (!project && !session?.addingAgain()) router.push("/gmea-projects/" + id);
    return id;
  };
}
