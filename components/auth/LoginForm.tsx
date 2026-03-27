"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { loginAction, type LoginActionState } from "@/actions/auth";

const INITIAL_STATE: LoginActionState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#163f25,#1f6a37,#2f7a46)] px-5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(22,101,52,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Signing in..." : "Sign in to PayTrack"}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState(loginAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-1 flex-col space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="username"
          className="text-sm font-medium text-apple-charcoal"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="Enter your username"
          required
          className="h-14 w-full rounded-2xl border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 text-sm text-apple-charcoal outline-none transition placeholder:text-apple-steel focus:border-[#1f6a37] focus:bg-white focus:ring-4 focus:ring-emerald-100"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-apple-charcoal"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          required
          className="h-14 w-full rounded-2xl border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 text-sm text-apple-charcoal outline-none transition placeholder:text-apple-steel focus:border-[#1f6a37] focus:bg-white focus:ring-4 focus:ring-emerald-100"
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-3">
        <span className="text-sm text-apple-smoke">
          Use your assigned payroll account.
        </span>
        <span className="text-xs font-medium text-apple-steel">
          Secure session
        </span>
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <SubmitButton />

      <div className="mt-auto pt-6">
        <div className="rounded-[24px] border border-apple-mist bg-[linear-gradient(180deg,rgba(222,243,229,0.5),rgba(255,255,255,0.95))] p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1f6a37] shadow-sm">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-apple-charcoal">
                Protected payroll workspace
              </p>
              <p className="mt-1 text-xs leading-5 text-apple-steel">
                Admins can save weekly payroll history to Supabase. Employees can
                sign in and access the regular payroll workspace.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-apple-steel">
          Need an account? Contact your payroll administrator for access.
        </p>
      </div>
    </form>
  );
}
