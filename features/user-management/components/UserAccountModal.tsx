"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { useUserManagementPage } from "../hooks/useUserManagementPage";
import UserAccountForm from "./UserAccountForm";

export default function UserAccountModal({
  state,
  currentUserId,
}: {
  state: ReturnType<typeof useUserManagementPage>;
  currentUserId: string;
}) {
  const { formOpen, closeForm } = state;

  useEffect(() => {
    if (!formOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeForm();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [closeForm, formOpen]);

  if (!formOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={state.editingUserId ? "Edit user" : "Add user"}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeForm();
      }}
      className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4"
    >
      <div className="w-full max-w-[720px]">
        <UserAccountForm
          {...state}
          currentUserId={currentUserId}
          onClose={closeForm}
        />
      </div>
    </div>,
    document.body,
  );
}
