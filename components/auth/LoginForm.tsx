"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import {
  type AuthActionState,
  signInAction,
} from "@/actions/auth";

interface LoginFormProps {
  nextPath: string | null;
}

export default function LoginForm({ nextPath }: LoginFormProps) {
  const initialAuthActionState: AuthActionState = {
    error: null,
  };
  const [showPassword, setShowPassword] = useState(false);

  const [state, formAction, pending] = useActionState(
    signInAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={nextPath ?? ""} />

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
          autoComplete="username"
          placeholder="Enter your username"
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
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            className="h-14 w-full rounded-2xl border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 pr-14 text-sm text-apple-charcoal outline-none transition placeholder:text-apple-steel focus:border-[#1f6a37] focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-apple-steel transition hover:bg-apple-mist/70 hover:text-apple-charcoal focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-3">
        <label className="flex items-center gap-3 text-sm text-apple-smoke">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 rounded border-apple-silver text-[#1f6a37] focus:ring-emerald-200"
          />
          Keep me signed in
        </label>
        <span className="text-xs font-medium text-apple-steel">
          Secure session
        </span>
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#163f25,#1f6a37,#2f7a46)] px-5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(22,101,52,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
            Signing in...
          </>
        ) : (
          <>
            Sign in to PayTrack
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
