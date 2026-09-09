"use client";

import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";

interface SettingsPasswordSectionProps {
  newPassword: string;
  confirmPassword: string;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  changingPassword: boolean;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  onChangePassword: () => void;
}

export default function SettingsPasswordSection({
  newPassword,
  confirmPassword,
  showNewPassword,
  showConfirmPassword,
  changingPassword,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleNewPassword,
  onToggleConfirmPassword,
  onChangePassword,
}: SettingsPasswordSectionProps) {
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_-25px_rgba(15,23,42,.25)] sm:p-7">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Security
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Update your sign-in password.
        </p>
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-900">
              New Password
            </span>
            <div className="group flex h-12 items-center rounded-[14px] border border-[#dce5e8] bg-white px-4 transition focus-within:border-[#076d69] focus-within:ring-4 focus-within:ring-[#076d69]/10">
              <LockKeyhole className="mr-3 h-4 w-4 text-slate-400 transition group-focus-within:text-[#076d69]" />
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => onNewPasswordChange(event.target.value)}
                placeholder="At least 8 characters"
                className="min-w-0 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={onToggleNewPassword}
                className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-[#f0fdfa] hover:text-[#076d69]"
                aria-label={
                  showNewPassword ? "Hide new password" : "Show new password"
                }
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-900">
              Confirm New Password
            </span>
            <div className="group flex h-12 items-center rounded-[14px] border border-[#dce5e8] bg-white px-4 transition focus-within:border-[#076d69] focus-within:ring-4 focus-within:ring-[#076d69]/10">
              <LockKeyhole className="mr-3 h-4 w-4 text-slate-400 transition group-focus-within:text-[#076d69]" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) =>
                  onConfirmPasswordChange(event.target.value)
                }
                placeholder="Re-enter your password"
                className="min-w-0 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={onToggleConfirmPassword}
                className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-[#f0fdfa] hover:text-[#076d69]"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </label>
        </div>

        <div className="mt-5">
          <p className="text-sm text-slate-500">
            Use a stronger password with a mix of letters, numbers, and symbols
            when possible.
          </p>

          <button
            type="button"
            onClick={onChangePassword}
            disabled={changingPassword}
            className="mt-4 inline-flex h-11 w-fit items-center justify-center rounded-[12px] bg-[#076d69] px-4 text-sm font-semibold text-white transition hover:bg-[#0f766e] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#076d69]/10 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {changingPassword ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LockKeyhole className="mr-2 h-4 w-4" />
            )}
            Update Password
          </button>
        </div>
      </div>
    </section>
  );
}
