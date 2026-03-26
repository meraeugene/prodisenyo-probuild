"use client";

import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import UploadZone from "@/components/UploadZone";
import { useAppState } from "@/features/app/AppStateProvider";
import { useRouter } from "next/navigation";

export default function UploadAttendancePage() {
  const { uploadedFiles, setUploadedFiles, handleParsed } = useAppState();
  const router = useRouter();

  function handleUploadParsed(...args: Parameters<typeof handleParsed>) {
    handleParsed(...args);
    router.push("/dashboard");
  }

  return (
    <div className="space-y-4">
      <DashboardPageHero
        isUploadAttendance
        eyebrow="Attendance"
        title="Upload Attendance"
        description="Import biometric attendance files and sync them into the payroll workspace."
      />
      <section className="rounded-[14px] border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
        <UploadZone
          files={uploadedFiles}
          onFilesChange={setUploadedFiles}
          onParsed={handleUploadParsed}
        />
      </section>
    </div>
  );
}
