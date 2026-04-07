import { getCurrentProfile } from "@/lib/auth";
import DashboardOverlays from "@/components/DashboardOverlays";
import DashboardShell from "@/components/DashboardShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  const navState =
    profile?.role === "ceo"
      ? {
          hasSavedAttendance: true,
          hasSavedPayroll: true,
        }
      : profile
        ? await (async () => {
            const [attendanceResult, payrollResult] = await Promise.all([
              supabase
                .from("attendance_imports")
                .select("id", { count: "exact", head: true })
                .eq("uploaded_by", profile.id),
              supabase
                .from("payroll_runs")
                .select("id", { count: "exact", head: true })
                .eq("created_by", profile.id),
            ]);

            return {
              hasSavedAttendance: (attendanceResult.count ?? 0) > 0,
              hasSavedPayroll: (payrollResult.count ?? 0) > 0,
            };
          })()
        : {
            hasSavedAttendance: false,
            hasSavedPayroll: false,
          };

  return (
    <DashboardShell profile={profile} navState={navState}>
      {children}
      <DashboardOverlays />
    </DashboardShell>
  );
}
