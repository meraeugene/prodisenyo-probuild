"use client";

import { Eye, EyeOff, LoaderCircle, LockKeyhole, Shield } from "lucide-react";

import { getPasswordStrength } from "../utils/passwordStrength";

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
  const strength = getPasswordStrength(newPassword);
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_36px_-28px_rgba(15,23,42,.2)] sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#e3f8f3] text-[#08746f]">
          <Shield size={22} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Security</h2>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">Keep your account secure with a strong password.</p>
        </div>
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-xs font-semibold text-slate-900">
              New Password
            </span>
            <div className="group flex h-10 items-center rounded-lg border border-[#dce5e8] bg-white px-4 transition focus-within:border-[#076d69] focus-within:ring-2 focus-within:ring-[#076d69]/10">
              <LockKeyhole className="mr-3 h-4 w-4 text-slate-400 transition group-focus-within:text-[#076d69]" />
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => onNewPasswordChange(event.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                aria-describedby="settings-password-strength"
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

          <div id="settings-password-strength" className="-mt-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
              <div className={`h-full rounded-full transition-[width] ${strength.color}`} style={{ width: strength.width }} />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">{strength.label}</p>
          </div>

          <label className="grid gap-2">
            <span className="text-xs font-semibold text-slate-900">
              Confirm New Password
            </span>
            <div className="group flex h-10 items-center rounded-lg border border-[#dce5e8] bg-white px-4 transition focus-within:border-[#076d69] focus-within:ring-2 focus-within:ring-[#076d69]/10">
              <LockKeyhole className="mr-3 h-4 w-4 text-slate-400 transition group-focus-within:text-[#076d69]" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) =>
                  onConfirmPasswordChange(event.target.value)
                }
                placeholder="Confirm new password"
                autoComplete="new-password"
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
          <aside className="rounded-lg bg-[#e9f8f5] p-4">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-[#096d67]">
              <Shield size={16} aria-hidden="true" /> Password Tips
            </h3>
            <ul className="ml-9 mt-2 list-disc space-y-1 text-xs leading-5 text-slate-500">
              <li>Use at least 8 characters</li>
              <li>Include a mix of letters, numbers, and symbols</li>
              <li>Avoid using common words</li>
            </ul>
          </aside>

          <button
            type="button"
            onClick={onChangePassword}
            disabled={changingPassword || !newPassword || !confirmPassword}
            className="mt-4 inline-flex h-10 w-fit items-center justify-center rounded-lg bg-[#076d69] px-4 text-sm font-semibold text-white transition hover:bg-[#0f766e] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#076d69]/10 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
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
