"use client";
import WorkspaceRouteTabs from "@/components/workspace/WorkspaceRouteTabs";
export default function GmeaRentalsAnalyticsNav() {
  return <WorkspaceRouteTabs label="GMEA Rentals sections" items={[
    { href: "/gmea-rentals", label: "Rentals", color: "#076d69" },
    { href: "/gmea-rentals/dashboard", label: "Dashboard", color: "#8055a6" },
    { href: "/gmea-rentals/reports", label: "Reports", color: "#a66b12" },
  ]} />;
}