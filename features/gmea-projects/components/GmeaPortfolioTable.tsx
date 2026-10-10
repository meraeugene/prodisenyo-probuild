import Link from "next/link";
import styles from "@/components/workspace/workspace.module.css";
import type { GmeaProject } from "../types";
import GmeaProjectActionsMenu from "./GmeaProjectActionsMenu";
import GmeaProjectSummaryTable from "./GmeaProjectSummaryTable";

export default function GmeaPortfolioTable({ projects, totalProjects = projects, canEdit, onDetails }: {
  projects: GmeaProject[]; totalProjects?: GmeaProject[]; canEdit: boolean; onDetails: (project: GmeaProject) => void;
}) {
  return <GmeaProjectSummaryTable projects={projects} totalProjects={totalProjects} renderActions={(project) => <div className="flex items-center gap-2">
          <Link href={`/gmea-projects/${project.id}`} className={styles.button} aria-label={`Open project: ${project.title}`}>Open</Link>
          {canEdit ? <GmeaProjectActionsMenu project={project} onDetails={() => onDetails(project)} /> : <button className={styles.button} type="button" onClick={() => onDetails(project)}>Details</button>}
  </div>} />;
}
