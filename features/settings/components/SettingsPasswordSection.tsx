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
    <section className="flex h-full flex-col rounded-[18px] border border-[#e7ecef] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div>
        <h2 className="text-lg font-semibold text-apple-charcoal">
          Reset Password
        </h2>
        <p className="mt-1 text-sm text-apple-steel">
          Change the password you use to sign in to this account.
        </p>
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-apple-charcoal">
              New Password
            </span>
            <div className="group flex h-12 items-center rounded-[14px] border border-[#dce5e8] bg-white px-4 transition focus-within:border-[#1f6a37] focus-within:ring-4 focus-within:ring-[#1f6a37]/10">
              <LockKeyhole className="mr-3 h-4 w-4 text-apple-silver transition group-focus-within:text-[#1f6a37]" />
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => onNewPasswordChange(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-transparent text-sm text-apple-charcoal outline-none placeholder:text-apple-silver"
              />
              <button
                type="button"
                onClick={onToggleNewPassword}
                className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-apple-steel transition hover:bg-[#f3f7f4] hover:text-[#1f6a37]"
                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
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
            <span className="text-sm font-semibold text-apple-charcoal">
              Confirm New Password
            </span>
            <div className="group flex h-12 items-center rounded-[14px] border border-[#dce5e8] bg-white px-4 transition focus-within:border-[#1f6a37] focus-within:ring-4 focus-within:ring-[#1f6a37]/10">
              <LockKeyhole className="mr-3 h-4 w-4 text-apple-silver transition group-focus-within:text-[#1f6a37]" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => onConfirmPasswordChange(event.target.value)}
                placeholder="Re-enter your password"
                className="w-full bg-transparent text-sm text-apple-charcoal outline-none placeholder:text-apple-silver"
              />
              <button
                type="button"
                onClick={onToggleConfirmPassword}
                className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-apple-steel transition hover:bg-[#f3f7f4] hover:text-[#1f6a37]"
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
          <p className="text-sm text-apple-steel">
            Use a stronger password with a mix of letters, numbers, and symbols
            when possible.
          </p>

          <button
            type="button"
            onClick={onChangePassword}
            disabled={changingPassword}
            className="mt-4 inline-flex h-11 w-fit items-center justify-center rounded-[12px] bg-[#1f6a37] px-4 text-sm font-semibold text-white transition hover:bg-[#18532b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1f6a37]/10 disabled:cursor-not-allowed disabled:bg-[#93b6a0]"
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
