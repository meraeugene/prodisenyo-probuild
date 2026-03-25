"use client";

import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import UploadZone from "@/components/UploadZone";
import { useAppState } from "@/features/app/AppStateProvider";

export default function UploadAttendancePage() {
  const { uploadedFiles, setUploadedFiles, handleParsed } = useAppState();

  return (
    <div className="space-y-4">
      <DashboardPageHero
        eyebrow="Attendance"
        title="Upload Attendance"
        description="Import biometric attendance files and sync them into the payroll workspace."
      />
      <section className="rounded-[14px] border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.07)]">
        <UploadZone
          files={uploadedFiles}
          onFilesChange={setUploadedFiles}
          onParsed={handleParsed}
        />
      </section>
    </div>
  );
}
