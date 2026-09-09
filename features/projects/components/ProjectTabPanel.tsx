"use client";

import { useState, type ReactNode } from "react";

export default function ProjectTabPanel({ active, children }: { active: boolean; children: ReactNode }) {
  const [visited, setVisited] = useState(active);
  if (active && !visited) setVisited(true);
  if (!active && !visited) return null;
  // Keep visited panels mounted so filters and expensive derived data survive tab changes.
  return <div hidden={!active} className={active ? undefined : "hidden"}>{children}</div>;
}
