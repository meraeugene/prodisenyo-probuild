import DashboardOverlays from "@/components/dashboard/DashboardOverlays";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <DashboardShell>
      {children}
      <DashboardOverlays />
    </DashboardShell>
  );
}
