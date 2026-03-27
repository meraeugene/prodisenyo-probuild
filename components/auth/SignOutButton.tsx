"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { signOutAction } from "@/actions/auth";

interface SignOutButtonProps {
  variant?: "sidebar" | "default";
}

function SignOutButtonContent({ variant }: { variant: "sidebar" | "default" }) {
  const { pending } = useFormStatus();

  if (variant === "sidebar") {
    return (
      <button
        type="submit"
        disabled={pending}
        className="group flex w-full items-center gap-3 rounded-lg border border-apple-mist/60 px-3 py-1.5 text-sm text-apple-smoke transition-all hover:bg-apple-mist/40 hover:text-apple-charcoal hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full text-apple-smoke transition-colors group-hover:text-apple-charcoal">
          {pending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/35 border-t-current" />
          ) : (
            <LogOut size={15} />
          )}
        </div>
        <span className="font-medium">{pending ? "Logging out..." : "Logout"}</span>
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-apple-mist px-4 text-sm font-semibold text-apple-ash transition hover:border-apple-steel disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/35 border-t-current" />
      ) : (
        <LogOut size={15} />
      )}
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}

export default function SignOutButton({
  variant = "default",
}: SignOutButtonProps) {
  return (
    <form action={signOutAction}>
      <SignOutButtonContent variant={variant} />
    </form>
  );
}
