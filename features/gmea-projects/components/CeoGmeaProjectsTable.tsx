import Link from "next/link";
import type { GmeaProject } from "../types";
import type { CeoGmeaSort } from "../utils/ceoPortfolioSorting";
import styles from "@/components/workspace/workspace.module.css";
import GmeaProjectSummaryTable from "./GmeaProjectSummaryTable";

export default function CeoGmeaProjectsTable({ projects, totalProjects = projects, sort, direction, onSort }: {
  projects: GmeaProject[]; totalProjects?: GmeaProject[];
  sort?: CeoGmeaSort; direction?: "asc" | "desc"; onSort?: (value: CeoGmeaSort) => void;
}) {
  return <>
    <GmeaProjectSummaryTable projects={projects} totalProjects={totalProjects} sort={sort} direction={direction} onSort={onSort} renderActions={project => <Link href={`/gmea-projects/${project.id}`} aria-label={`View details for ${project.title}`} className={styles.button}>View</Link>} />
  </>;
}
