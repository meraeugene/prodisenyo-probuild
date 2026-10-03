import { getCurrentProfile } from "@/lib/auth";
import ProjectsPageSkeleton from "@/features/projects/components/ProjectsPageSkeleton";
import EngineerProjectsPageSkeleton from "@/features/projects/components/EngineerProjectsPageSkeleton";
export default async function Loading() { const profile = await getCurrentProfile(); return profile?.role === "engineer" ? <EngineerProjectsPageSkeleton /> : <ProjectsPageSkeleton />; }
