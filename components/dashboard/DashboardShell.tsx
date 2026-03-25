"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Upload,
  UserRoundSearch,
  Wallet,
} from "lucide-react";
import { useAppState } from "@/features/app/AppStateProvider";
import { cn } from "@/lib/utils";

const PRIMARY_NAV_ITEMS = [
  { href: "/upload-attendance", label: "Upload Attendance", icon: Upload },
];

const ATTENDANCE_READY_GENERAL_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const GENERAL_WORKFLOW_ITEMS = [
  {
    href: "/review-attendance",
    label: "Review Attendance",
    icon: UserRoundSearch,
  },
  { href: "/generate-payroll", label: "Generate Payroll", icon: Wallet },
] as const;

const ANALYTICS_NAV_ITEMS = [
  {
    href: "/attendance-analytics",
    label: "Attendance Analytics",
    icon: Activity,
  },
  { href: "/payroll-analytics", label: "Payroll Analytics", icon: BarChart3 },
] as const;

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { hasAttendanceData } = useAppState();
  const sidebarWidth = "258px";
  const headerHeight = "69px";
  const settingsActive = pathname === "/settings";

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen">
        <aside
          className={cn(
            "fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden border-r border-apple-mist bg-white transition-transform duration-300 lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          style={{ width: sidebarWidth }}
        >
          <div
            className="flex shrink-0 items-center justify-between border-b border-apple-mist px-5"
            style={{ height: headerHeight }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-apple-charcoal/10 text-apple-charcoal">
                <div className="grid h-4 w-4 grid-cols-2 gap-0.5">
                  <span className="rounded-full bg-current" />
                  <span className="rounded-full bg-current/70" />
                  <span className="rounded-full bg-current/70" />
                  <span className="rounded-full bg-current" />
                </div>
              </div>
              <p className="text-lg font-semibold tracking-[-0.04em] text-apple-charcoal">
                Prodisenyo PayRoll
              </p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-3 pt-5">
            <div className="px-3 pb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-apple-silver">
                General
              </p>
            </div>

            <nav className="space-y-3">
              {PRIMARY_NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-all border border-apple-mist/60 ",
                      active
                        ? " bg-apple-mist/40 text-apple-charcoal shadow-sm "
                        : "text-apple-smoke hover:bg-apple-mist/40  hover:shadow-sm hover:text-apple-charcoal",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                        active
                          ? "bg-[#1f6a37] text-white "
                          : "text-apple-smoke group-hover:text-apple-charcoal",
                      )}
                    >
                      <item.icon size={15} />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}

              <AnimatePresence initial={false}>
                {hasAttendanceData ? (
                  <motion.div
                    key="attendance-ready-general-nav"
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="space-y-3 overflow-hidden"
                  >
                    {ATTENDANCE_READY_GENERAL_ITEMS.map((item, index) => {
                      const active = pathname === item.href;
                      return (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{
                            duration: 0.22,
                            delay: index * 0.04,
                            ease: "easeOut",
                          }}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "group flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-all border border-apple-mist/60 ",
                              active
                                ? " bg-apple-mist/40 text-apple-charcoal shadow-sm "
                                : "text-apple-smoke hover:bg-apple-mist/40  hover:shadow-sm hover:text-apple-charcoal",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                                active
                                  ? "bg-[#1f6a37] text-white "
                                  : "text-apple-smoke group-hover:text-apple-charcoal",
                              )}
                            >
                              <item.icon size={15} />
                            </div>
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {hasAttendanceData ? (
                  <motion.div
                    key="general-workflow-nav"
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="space-y-3 overflow-hidden"
                  >
                    {GENERAL_WORKFLOW_ITEMS.map((item, index) => {
                      const active = pathname === item.href;
                      return (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{
                            duration: 0.22,
                            delay: index * 0.04,
                            ease: "easeOut",
                          }}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "group flex items-center gap-3 rounded-lg border border-apple-mist/60 px-3 py-1.5 text-sm transition-all",
                              active
                                ? " bg-apple-mist/40 text-apple-charcoal shadow-sm "
                                : "text-apple-smoke hover:bg-apple-mist/40 hover:shadow-sm hover:text-apple-charcoal",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                                active
                                  ? "bg-[#1f6a37] text-white "
                                  : "text-apple-smoke group-hover:text-apple-charcoal",
                              )}
                            >
                              <item.icon size={15} />
                            </div>
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {hasAttendanceData ? (
                  <motion.div
                    key="analytics-nav"
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{
                      duration: 0.28,
                      ease: "easeOut",
                      delay: 0.04,
                    }}
                    className="space-y-3 overflow-hidden pt-2"
                  >
                    <div className="px-3 pb-1 pt-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-apple-silver">
                        Data Analytics
                      </p>
                    </div>

                    {ANALYTICS_NAV_ITEMS.map((item, index) => {
                      const active = pathname === item.href;
                      return (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{
                            duration: 0.22,
                            delay: index * 0.04,
                            ease: "easeOut",
                          }}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "group flex items-center gap-3 rounded-lg border border-apple-mist/60 px-3 py-1.5 text-sm transition-all",
                              active
                                ? " bg-apple-mist/40 text-apple-charcoal shadow-sm "
                                : "text-apple-smoke hover:bg-apple-mist/40 hover:shadow-sm hover:text-apple-charcoal",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                                active
                                  ? "bg-[#1f6a37] text-white "
                                  : "text-apple-smoke group-hover:text-apple-charcoal",
                              )}
                            >
                              <item.icon size={15} />
                            </div>
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </nav>

            <div className="mt-auto space-y-1 ">
              <Link
                href="/settings"
                className={cn(
                  "group flex items-center gap-3 rounded-lg border border-apple-mist/60 px-3 py-1.5 text-sm transition-all",
                  settingsActive
                    ? "bg-apple-mist/40 text-apple-charcoal shadow-sm"
                    : "text-apple-smoke hover:bg-apple-mist/40 hover:text-apple-charcoal hover:shadow-sm",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                    settingsActive
                      ? "bg-[#1f6a37] text-white"
                      : "text-apple-smoke group-hover:text-apple-charcoal",
                  )}
                >
                  <Settings size={15} />
                </div>
                <span className="font-medium">Settings</span>
              </Link>

              <div className=" pt-4">
                <div className="rounded-2xl border border-apple-mist bg-white p-3 shadow-[0_8px_20px_rgba(24,83,43,0.06)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-apple-mist text-xs font-{semibold} text-apple-charcoal">
                      PA
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-apple-charcoal">
                        Prodisenyo Admin
                      </p>
                      <p className="truncate text-xs text-apple-steel">
                        prodisenyo@company.com
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-apple-silver" />
                  </div>
                </div>

                <p className="pt-4 text-center text-[11px] text-[#b6c1c7]">
                  © 2024 PayTrack Inc. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-h-screen lg:pl-[258px]">
          {/* <header
            className="fixed left-0 right-0 top-0 z-30 border-b border-apple-mist bg-white/90 backdrop-blur-sm lg:left-[258px]"
            style={{ height: headerHeight }}
          ></header> */}

          <main className="min-h-screen bg-white p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
