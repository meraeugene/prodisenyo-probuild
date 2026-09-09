"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CEO_PROJECT_WORKSPACE_TABS, ENGINEER_PROJECT_WORKSPACE_TABS, resolveProjectWorkspaceTab, type ProjectWorkspaceTab } from "../utils/workspaceTabs";

export function useProjectWorkspaceTabs(projectId: string, canReviewEstimates: boolean, canCreateEstimate: boolean) {
  const router = useRouter();
  const params = useSearchParams();
  const tabs = canReviewEstimates ? CEO_PROJECT_WORKSPACE_TABS : ENGINEER_PROJECT_WORKSPACE_TABS;
  const selected = params.get("tab");
  const [tab, setTab] = useState(() => resolveProjectWorkspaceTab(selected, tabs));

  useEffect(() => {
    setTab(resolveProjectWorkspaceTab(selected, tabs));
  }, [selected, tabs, projectId]);

  useEffect(() => {
    if (selected === "estimates" && canCreateEstimate && !canReviewEstimates) {
      router.replace(`/cost-estimator?projectId=${projectId}`);
    }
    if (selected === "purchasing") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "materials");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  }, [selected, canCreateEstimate, canReviewEstimates, projectId, router]);

  function switchTab(nextTab: ProjectWorkspaceTab) {
    if (nextTab === "estimates" && canCreateEstimate && !canReviewEstimates) {
      router.push(`/cost-estimator?projectId=${projectId}`);
      return;
    }
    if (nextTab === tab || !tabs.some((item) => item === nextTab)) return;
    setTab(nextTab);
    // All panels use the workspace data already loaded on this page.
    // Native history updates the URL and Back/Forward without a server navigation.
    const url = new URL(window.location.href);
    url.searchParams.set("tab", nextTab);
    window.history.pushState(null, "", url.pathname + url.search + url.hash);
  }

  return { tabs, tab, switchTab };
}
