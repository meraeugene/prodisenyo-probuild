import { getCurrentProfile } from "@/lib/auth";
import ProjectWorkspaceSkeleton from "@/features/projects/components/ProjectWorkspaceSkeleton";

export default async function Loading() {
  const profile = await getCurrentProfile();
  return <ProjectWorkspaceSkeleton role={profile?.role === "engineer" ? "engineer" : "ceo"} />;
}
