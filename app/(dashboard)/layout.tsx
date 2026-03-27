import DashboardOverlays from "@/components/dashboard/DashboardOverlays";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <AuthSessionProvider user={user}>
      <DashboardShell>
        {children}
        <DashboardOverlays />
      </DashboardShell>
    </AuthSessionProvider>
  );
}
