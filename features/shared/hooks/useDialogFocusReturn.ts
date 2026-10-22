"use client";

import { createContext, useContext, useRef, type RefObject } from "react";

export const DialogFocusContext = createContext<RefObject<HTMLElement | null> | null>(null);
export function captureDialogOpener() {
  return typeof document !== "undefined" && document.activeElement instanceof HTMLElement ? document.activeElement : null;
}

export function useDialogFocusReturn() {
  const localOpener = useRef(captureDialogOpener());
  const scopedOpener = useContext(DialogFocusContext);
  const opener = scopedOpener ?? localOpener;
  return (event: Event) => {
    event.preventDefault();
    if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
  };
}
