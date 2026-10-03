"use client";

import { saveAttendanceImportAction } from "@/actions/attendance";
import UploadZone from "@/components/UploadZone";
import { useAppState } from "@/features/app/AppStateProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PayrollWorkflowNavigation from "@/features/payroll/components/generate-payroll/PayrollWorkflowNavigation";

export default function UploadAttendancePage() {
  const {
    uploadedFiles,
    setUploadedFiles,
    setCurrentAttendanceImportId,
    setCurrentPayrollRunMeta,
    handleParsed,
    handleReset,
    attendance,
  } = useAppState();
  const router = useRouter();

  async function handleUploadParsed(...args: Parameters<typeof handleParsed>) {
    const [result] = args;

    const saveResult = await saveAttendanceImportAction({
      fileNames: uploadedFiles.map((file) => file.name),
      result,
    });

    setCurrentAttendanceImportId(saveResult.importId);
    setCurrentPayrollRunMeta({ id: null, status: null });
    handleParsed(saveResult.resolvedResult);
    toast.success("Attendance reports ready for review.", {
      description: "Your uploaded files were processed and saved.",
    });
    router.refresh();
    router.replace("/review-attendance");
  }

  return (
    <div className="p-0">
      <PayrollWorkflowNavigation current={1} canReview={attendance.dailyRows.length > 0} />
      <div className="px-4 py-6 sm:px-6 xl:px-7">
        <section aria-label="Upload attendance" className="rounded-[14px] border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(7,109,105,0.07)]">
          <UploadZone
            files={uploadedFiles}
            onFilesChange={setUploadedFiles}
            onParsed={handleUploadParsed}
            onClearWorkspace={handleReset}
          />
        </section>
      </div>
    </div>
  );
}
