"use client";
import { useEffect } from "react";

// Portal dialogs and menus need the same theme as the workspace that opened them.
export function useWorkspaceTheme(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const previous = document.body.getAttribute("data-workspace-theme");
    document.body.setAttribute("data-workspace-theme", "compact");
    return () => {
      if (previous === null) document.body.removeAttribute("data-workspace-theme");
      else document.body.setAttribute("data-workspace-theme", previous);
    };
  }, [enabled]);
}
