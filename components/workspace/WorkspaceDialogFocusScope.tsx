"use client";

import { useRef, type ReactNode } from "react";
import { captureDialogOpener, DialogFocusContext } from "@/features/shared/hooks/useDialogFocusReturn";

/** Preserve the opening control when a repeated-entry dialog remounts its form. */
export default function WorkspaceDialogFocusScope({ children }: { children: ReactNode }) {
  const opener = useRef(captureDialogOpener());
  return <DialogFocusContext.Provider value={opener}>{children}</DialogFocusContext.Provider>;
}
