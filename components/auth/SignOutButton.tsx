"use client";

import { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { signOutAction } from "@/actions/auth";
import { useAppState } from "@/features/app/AppStateProvider";

interface SignOutButtonProps {
  variant?: "sidebar" | "default";
  collapsed?: boolean;
}

function SignOutButtonContent({
  variant,
  submitting,
  collapsed = false,
}: {
  variant: "sidebar" | "default";
  submitting: boolean;
  collapsed?: boolean;
}) {
  const { pending } = useFormStatus();
  const busy = pending || submitting;

  if (variant === "sidebar") {
    return (
      <button
        type="submit"
        disabled={busy}
        aria-label={busy ? "Logging out" : "Logout"}
        className={`group relative flex min-h-10 w-full items-center gap-3 rounded-[10px] px-3 text-sm text-[#365753] transition-colors hover:bg-teal-50/60 hover:text-[#076d69] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 disabled:cursor-not-allowed disabled:opacity-70 ${
          collapsed ? "justify-center px-2.5" : ""
        }`}
      >
        <div className="flex shrink-0 items-center justify-center">
          {busy ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut size={17} strokeWidth={1.7} aria-hidden="true" />
          )}
        </div>
        {!collapsed ? (
          <span className="font-medium">{busy ? "Logging out..." : "Logout"}</span>
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-apple-mist px-4 text-sm font-semibold text-apple-ash transition hover:border-apple-steel disabled:cursor-not-allowed disabled:opacity-70"
    >
      {busy ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut size={15} />
      )}
      {busy ? "Signing out..." : "Sign out"}
    </button>
  );
}

export default function SignOutButton({
  variant = "default",
  collapsed = false,
}: SignOutButtonProps) {
  const [submitting, setSubmitting] = useState(false);
  const { handleReset } = useAppState();

  return (
    <form
      className="w-full"
      action={signOutAction}
      onSubmitCapture={() => {
        handleReset();
        setSubmitting(true);
      }}
    >
      <SignOutButtonContent
        variant={variant}
        submitting={submitting}
        collapsed={collapsed}
      />
    </form>
  );
}
