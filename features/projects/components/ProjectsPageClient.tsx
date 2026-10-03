"use client";
import { useRouter } from "next/navigation";
import CeoProjectsOverview from "./CeoProjectsOverview";
import EngineerProjectPortfolio from "./EngineerProjectPortfolio";
import CreateProjectModal from "./CreateProjectModal";
import { useCreateProject } from "../hooks/useCreateProject";
import { getProjectEntryHref } from "../utils/projectLifecycle";
import type { EngineerOption, ProjectRecord } from "../types";
import styles from "./projects.module.css";
export default function ProjectsPageClient({ role, projects, engineers }: { role: "ceo" | "engineer"; fullName: string | null; projects: ProjectRecord[]; engineers: EngineerOption[] }) {
 const router = useRouter();
 const form = useCreateProject();
 function openProject(projectId: string) {
  const project = projects.find(entry => entry.id === projectId);
  if (project) router.push(getProjectEntryHref({ role, projectId, status: project.status }));
 }
 return <div className={styles.page}>
  {role === "ceo" ? <CeoProjectsOverview projects={projects} onCreateProject={form.openCreateModal} onOpenProject={openProject} /> : <EngineerProjectPortfolio projects={projects} onOpenProject={openProject} />}
  <CreateProjectModal form={form} engineers={engineers} />
 </div>;
}
