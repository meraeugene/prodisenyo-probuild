import type { ProjectRecord } from "../types";

export function buildCeoProjectsAnalytics(
  projects: ProjectRecord[],
  months = 6,
  now = new Date(),
) {
  const trend = Array.from({ length: months }, (_, index) => {
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth() - months + index + 1,
      1,
    );
    const monthEnd = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const activeByMonth = projects.filter((project) => {
      const startedAt = Date.parse(`${project.startDate}T00:00:00`);
      return Number.isFinite(startedAt) && startedAt <= monthEnd.getTime();
    });
    return {
      month: monthStart.toLocaleDateString("en", {
        month: "short",
        year: "numeric",
      }),
      budget: activeByMonth.reduce((sum, project) => sum + project.budget, 0),
      spent: activeByMonth.reduce((sum, project) => sum + project.spent, 0),
    };
  });
  const statuses = [
    {
      name: "Active",
      value: projects.filter((project) => project.status === "active").length,
      color: "#159447",
    },
    {
      name: "Pending Estimates",
      value: projects.filter((project) => project.status === "planning").length,
      color: "#1673ea",
    },
    {
      name: "Completed",
      value: projects.filter((project) => project.status === "completed").length,
      color: "#93c5fd",
    },
    {
      name: "On Hold",
      value: projects.filter((project) => project.status === "on_hold").length,
      color: "#94a3b8",
    },
  ];
  const delayedProjects = projects.filter((project) => {
    const endAt = Date.parse(`${project.endDate}T23:59:59`);
    return (
      project.status !== "completed" &&
      project.progress < 100 &&
      Number.isFinite(endAt) &&
      endAt < now.getTime()
    );
  });
  const delayedIds = new Set(delayedProjects.map((project) => project.id));
  const delayed = delayedProjects.length;
  const atRisk = projects.filter(
    (project) => project.status === "on_hold" && !delayedIds.has(project.id),
  ).length;
  const onTrack = Math.max(0, projects.length - delayed - atRisk);

  return {
    trend,
    statuses,
    risks: [
      { name: "On Track", value: onTrack, color: "#159447" },
      { name: "At Risk", value: atRisk, color: "#f5ad19" },
      { name: "Delayed", value: delayed, color: "#f43f5e" },
    ],
    totalBudget: projects.reduce((sum, project) => sum + project.budget, 0),
    totalSpent: projects.reduce((sum, project) => sum + project.spent, 0),
    overallProgress: projects.length
      ? Math.round(
          projects.reduce((sum, project) => sum + project.progress, 0) /
            projects.length,
        )
      : 0,
  };
}
