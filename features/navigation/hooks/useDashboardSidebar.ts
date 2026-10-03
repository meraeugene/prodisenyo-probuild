"use client";

import { useEffect, useState } from "react";

export function useDashboardSidebar(pathname: string) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!open || !window.matchMedia("(max-width: 1023px)").matches) return;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    const sidebar = document.getElementById("dashboard-sidebar");
    const content = document.getElementById("dashboard-content");
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousInert = content?.inert ?? false;
    if (content) content.inert = true;
    sidebar?.querySelector<HTMLButtonElement>('button[aria-label="Close navigation"]')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab" || !sidebar) return;
      const controls = [...sidebar.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')].filter((element) => element.offsetParent !== null);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const media = window.matchMedia("(min-width: 1024px)");
    const handleResize = () => { if (media.matches) setOpen(false); };
    document.addEventListener("keydown", handleKey);
    media.addEventListener("change", handleResize);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
      if (content) content.inert = previousInert;
      if (previousFocus?.isConnected) previousFocus.focus();
      document.removeEventListener("keydown", handleKey);
      media.removeEventListener("change", handleResize);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setCollapsed(window.matchMedia("(min-width: 1024px)").matches && ["/budget-tracker", "/cost-estimator"].includes(pathname));
  }, [pathname]);

  return { open, setOpen, collapsed, setCollapsed };
}
