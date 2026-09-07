import { notFound } from "next/navigation";
import {
  getGmeaProjects,
  requireGmeaAccess,
} from "@/features/gmea-projects/server/gmeaQueries";
import { validId } from "@/features/gmea-projects/utils/gmeaValidation";
import GmeaProjectWorkspace from "@/features/gmea-projects/components/GmeaProjectWorkspace";
export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { profile } = await requireGmeaAccess();
  const { projectId } = await params;
  try {
    validId(projectId);
  } catch {
    notFound();
  }
  const [project] = await getGmeaProjects(projectId);
  if (!project) notFound();
  return (
    <GmeaProjectWorkspace project={project} canEdit={profile.role === "gmea"} />
  );
}
