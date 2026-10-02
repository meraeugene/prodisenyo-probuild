import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  hydrated: boolean;
  importId: string | null;
  runId: string | null;
  selectAttendanceWorkspace: (importId: string, runId?: string | null) => Promise<boolean>;
};

export function usePayrollWorkspaceSelection({ hydrated, importId, runId, selectAttendanceWorkspace }: Props) {
  const selectedImportId = importId?.trim() ?? "";
  const selectedRunId = runId?.trim() || null;
  const selectionKey = selectedImportId ? `${selectedImportId}:${selectedRunId ?? ""}` : null;
  const requestedKey = useRef<string | null>(null);
  const mounted = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [selection, setSelection] = useState<{ key: string | null; error: string | null }>({ key: null, error: null });

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!hydrated || !selectionKey) return;
    const requestKey = `${selectionKey}:${attempt}`;
    if (requestedKey.current === requestKey) return;
    requestedKey.current = requestKey;

    async function openWorkspace() {
      let loaded = false;
      try {
        loaded = await selectAttendanceWorkspace(selectedImportId, selectedRunId);
      } catch {
        // Show a retry action when the workspace could not be opened.
      }
      if (!mounted.current || requestedKey.current !== requestKey) return;
      setSelection({ key: selectionKey, error: loaded ? null : "Unable to open this payroll draft. Please try again." });
    }

    void openWorkspace();
  }, [hydrated, selectionKey, selectedImportId, selectedRunId, selectAttendanceWorkspace, attempt]);

  const retry = useCallback(() => {
    setSelection({ key: null, error: null });
    setAttempt((value) => value + 1);
  }, []);

  return {
    isOpeningDraft: !hydrated || Boolean(selectionKey && selection.key !== selectionKey),
    error: selection.key === selectionKey ? selection.error : null,
    retry,
  };
}
