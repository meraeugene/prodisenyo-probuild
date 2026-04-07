"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { signOutAction } from "@/actions/auth";

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
        className={`group relative flex w-full items-center gap-3 rounded-lg border border-apple-mist/60 px-3 py-1.5 text-sm text-apple-smoke transition-all hover:bg-apple-mist/40 hover:text-apple-charcoal hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70 ${
          collapsed ? "justify-center px-2.5" : ""
        }`}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full text-apple-smoke transition-colors group-hover:text-apple-charcoal">
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/35 border-t-current" />
          ) : (
            <LogOut size={15} />
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
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/35 border-t-current" />
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

  return (
    <form
      action={signOutAction}
      onSubmitCapture={() => {
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
