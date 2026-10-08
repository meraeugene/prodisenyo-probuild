import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
import type { ReactNode } from "react";
import styles from "./workspace/workspace.module.css";

export default function CeoPageHeroSkeleton({ action = "status", actions, titleWidth = "w-80", descriptionLines = 1, variant = "dashboard" }: { action?: "status" | "button" | "none"; actions?: ReactNode; titleWidth?: string; descriptionLines?: number; variant?: "dashboard" | "workspace" }) {
  const workspace = variant === "workspace";
  return <header role="status" aria-busy="true" aria-label="Loading content" className={workspace ? styles.header : "workspace-page-header flex flex-wrap items-start justify-between gap-4 pb-2"}>
    <div className="min-w-0 max-w-3xl flex-1"><div className={workspace ? "mb-3 flex h-4 items-center" : "mb-5 flex h-5 items-center"}><Block className="h-3 w-44" /></div><Block className={`h-[33px] ${titleWidth}`} />{descriptionLines > 0 && <div className={workspace ? "mt-1.5 space-y-1.5" : "mt-1 space-y-1.5"}>{Array.from({ length: descriptionLines }, (_, line) => <div key={line} className={workspace ? "flex h-[21px] items-center" : "flex h-6 items-center"}><Block className="h-3.5 w-full max-w-xl" /></div>)}</div>}</div>
    {(actions || action !== "none") && <div className={workspace ? styles.headerActions : "flex max-w-full flex-wrap items-center gap-2 sm:mt-9"}>{actions ?? <Block className={action === "status" ? "h-16 w-44 !rounded-[5px]" : "h-9 w-40 !rounded-[5px]"} />}</div>}
  </header>;
}
