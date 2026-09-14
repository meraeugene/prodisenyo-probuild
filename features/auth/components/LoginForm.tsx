"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { type AuthActionState, signInAction } from "@/actions/auth";

interface LoginFormProps {
  nextPath: string | null;
  initialError?: string | null;
}

export default function LoginForm({ nextPath, initialError }: LoginFormProps) {
  const initialAuthActionState: AuthActionState = { error: initialError ?? null };
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={nextPath ?? ""} />

      <div className="space-y-2">
        <label htmlFor="username" className="block text-[13px] font-medium text-[#172238]">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="Enter your username"
          required
          className="h-11 w-full rounded-md border border-[#cfd5dd] bg-white px-3.5 text-sm text-[#172238] outline-none transition placeholder:text-[#8b95a7] hover:border-[#aab5c2] focus:border-[#08726f] focus:ring-2 focus:ring-[#08726f]/10"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-[13px] font-medium text-[#172238]">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            className="h-11 w-full rounded-md border border-[#cfd5dd] bg-white px-3.5 pr-11 text-sm text-[#172238] outline-none transition placeholder:text-[#8b95a7] hover:border-[#aab5c2] focus:border-[#08726f] focus:ring-2 focus:ring-[#08726f]/10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#78859a] transition hover:bg-[#eef4f4] hover:text-[#075f5d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08726f] focus-visible:ring-offset-1"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      {state.error ? (
        <div role="alert" className="rounded-[9px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#076d69] px-4 text-sm font-semibold text-white transition hover:bg-[#055f5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076d69] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-65"
      >
        {pending ? (
          <>
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
