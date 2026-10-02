"use client";

import { useEffect } from "react";

const openDialogs = new Set<{ priority: number; close: () => void }>();

/** Close only the uppermost dialog, including when focus is in an input. */
export function useDialogEscape(close: () => void, priority: number, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const dialog = { priority, close };
    openDialogs.add(dialog);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.isComposing) return;
      const top = [...openDialogs].sort((a, b) => a.priority - b.priority).at(-1);
      if (top !== dialog) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      dialog.close();
    };
    document.addEventListener("keydown", handleKey, true);
    return () => {
      openDialogs.delete(dialog);
      document.removeEventListener("keydown", handleKey, true);
    };
  }, [close, priority, enabled]);
}
