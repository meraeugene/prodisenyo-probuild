"use client";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/types/database";
import type { useUserManagementPage } from "../hooks/useUserManagementPage";
import { ROLE_OPTIONS } from "../utils/userManagementForm";
export default function UserAccountForm({
  form,
  errors,
  editingUserId,
  isPending,
  resetForm,
  updateField,
  handleSubmit,
  currentUserId,
}: Pick<
  ReturnType<typeof useUserManagementPage>,
  | "form"
  | "errors"
  | "editingUserId"
  | "isPending"
  | "resetForm"
  | "updateField"
  | "handleSubmit"
> & { currentUserId: string }) {
  return (
    <div className="min-w-0 rounded-none border border-apple-mist bg-white p-4 shadow-[0_10px_30px_rgba(7,109,105,0.06)] sm:rounded-[22px] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
            {editingUserId ? "Edit User" : "Create User"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-apple-charcoal">
            {editingUserId ? "Update account details" : "Add a new user"}
          </h2>
        </div>
        {editingUserId ? (
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-apple-mist px-4 text-sm font-semibold text-apple-charcoal transition hover:bg-apple-mist/40 sm:w-auto"
          >
            Cancel edit
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-5">
        <div>
          <label className="text-sm font-semibold text-apple-charcoal">
            Full name <span className="text-rose-500">*</span>
          </label>
          <input
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            placeholder="e.g. Maria Santos"
            className={cn(
              "mt-2 w-full rounded-[12px] border bg-[rgb(var(--apple-snow))] px-4 py-3 text-sm outline-none focus:border-[#076d69]",
              errors.fullName ? "border-rose-300" : "border-apple-mist",
            )}
          />
          {errors.fullName ? (
            <p className="mt-2 text-sm text-rose-600">{errors.fullName}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-semibold text-apple-charcoal">
            Username <span className="text-rose-500">*</span>
          </label>
          <input
            value={form.username}
            onChange={(event) => updateField("username", event.target.value)}
            placeholder="e.g. maria.santos"
            className={cn(
              "mt-2 w-full rounded-[12px] border bg-[rgb(var(--apple-snow))] px-4 py-3 text-sm outline-none focus:border-[#076d69]",
              errors.username ? "border-rose-300" : "border-apple-mist",
            )}
          />
          {errors.username ? (
            <p className="mt-2 text-sm text-rose-600">{errors.username}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-semibold text-apple-charcoal">
            Email <span className="text-rose-500">*</span>
          </label>
          <input
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="e.g. maria@prodisenyo.com"
            className={cn(
              "mt-2 w-full rounded-[12px] border bg-[rgb(var(--apple-snow))] px-4 py-3 text-sm outline-none focus:border-[#076d69]",
              errors.email ? "border-rose-300" : "border-apple-mist",
            )}
          />
          {errors.email ? (
            <p className="mt-2 text-sm text-rose-600">{errors.email}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-semibold text-apple-charcoal">
            Role <span className="text-rose-500">*</span>
          </label>
          <select
            value={form.role}
            onChange={(event) =>
              updateField("role", event.target.value as AppRole)
            }
            className={cn(
              "mt-2 w-full rounded-[12px] border bg-white px-4 py-3 text-sm outline-none focus:border-[#076d69]",
              errors.role ? "border-rose-300" : "border-apple-mist",
            )}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.role ? (
            <p className="mt-2 text-sm text-rose-600">{errors.role}</p>
          ) : null}
        </div>

        {!editingUserId ? (
          <div>
            <label className="text-sm font-semibold text-apple-charcoal">
              Temporary password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Minimum 8 characters"
              className={cn(
                "mt-2 w-full rounded-[12px] border bg-[rgb(var(--apple-snow))] px-4 py-3 text-sm outline-none focus:border-[#076d69]",
                errors.password ? "border-rose-300" : "border-apple-mist",
              )}
            />
            {errors.password ? (
              <p className="mt-2 text-sm text-rose-600">{errors.password}</p>
            ) : null}
          </div>
        ) : (
          <label className="flex items-center gap-3 rounded-[12px] border border-apple-mist bg-[rgb(var(--apple-snow))] px-4 py-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                updateField("isActive", event.target.checked)
              }
              disabled={editingUserId === currentUserId}
            />
            <span className="text-sm font-medium text-apple-charcoal">
              Active account
            </span>
          </label>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#076d69] px-5 text-sm font-semibold text-white transition hover:bg-[#055f5b] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <UserPlus size={16} />
            {isPending
              ? editingUserId
                ? "Updating user..."
                : "Creating user..."
              : editingUserId
                ? "Update user"
                : "Create user"}
          </button>
        </div>
      </div>
    </div>
  );
}
