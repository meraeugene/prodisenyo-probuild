import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import GmeaProjectsPageClient from "../../features/gmea-projects/components/GmeaProjectsPageClient";
import GmeaProjectWorkspace from "../../features/gmea-projects/components/GmeaProjectWorkspace";
import type { GmeaProject } from "../../features/gmea-projects/types";
import "../../app/globals.css";
function App() {
  const [projects, setProjects] = useState<GmeaProject[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const canEdit = new URLSearchParams(location.search).get("role") !== "ceo";
  useEffect(() => {
    async function refresh() {
      setProjects(await fetch("/state").then((r) => r.json()));
      const id = location.pathname.split("/")[2];
      setSelected(id ?? null);
    }
    void refresh();
    window.addEventListener("gmea-refresh", refresh);
    return () => window.removeEventListener("gmea-refresh", refresh);
  }, []);
  const project = projects.find((p) => p.id === selected);
  return (
    <>
      <Toaster />
      {project ? (
        <GmeaProjectWorkspace
          project={project}
          expenseOptions={{
            suppliers: ["B.S. Electrical", "Solarfy Corporation"],
            methods: ["Cash", "Cheque", "Bank transfer", "GCash"],
            invoiceNames: [
              "GMEA MARKETING CORP.",
              "Prodisenyo Builders Corp.",
            ],
          }}
          canEdit={canEdit}
        />
      ) : (
        <GmeaProjectsPageClient projects={projects} canEdit={canEdit} />
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
