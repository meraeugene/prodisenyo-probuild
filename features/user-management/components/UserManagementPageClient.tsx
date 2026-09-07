"use client";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import DashboardPageHero from "@/components/DashboardPageHero";
import CostEstimatorConfirmModal from "@/features/cost-estimator/components/CostEstimatorConfirmModal";
import type { ManagedUserRow } from "../types";
import { cn } from "@/lib/utils";
import { useUserManagementPage } from "../hooks/useUserManagementPage";
import { formatRoleLabel } from "../utils/userManagementForm";
import UserAccountForm from "./UserAccountForm";

export default function UserManagementPageClient({
  initialUsers,
  currentUserId,
}: {
  initialUsers: ManagedUserRow[];
  currentUserId: string;
}) {
  const state = useUserManagementPage(initialUsers);
  const {
    sortedUsers,
    deleteTarget,
    openMenu,
    openMenuUser,
    isPending,
    handleOpenMenu,
    handleConfirmDelete,
    handleEditUser,
    handleAskDelete,
    setDeleteUserId,
  } = state;

  return (
    <div className="space-y-4 p-0 sm:p-6">
      <DashboardPageHero
        eyebrow="Admin"
        title="User Management"
        description="Create, update, and manage user accounts for all application roles, including GMEA."
      />

      <section className="grid gap-4 2xl:grid-cols-[420px_minmax(0,1fr)]">
        <UserAccountForm {...state} currentUserId={currentUserId} />
        <section className="min-w-0 rounded-none border border-apple-mist bg-white p-5 shadow-[0_10px_30px_rgba(24,83,43,0.06)] sm:rounded-[22px]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
                Directory
              </p>
              <h2 className="mt-2 text-xl font-semibold text-apple-charcoal">
                Users
              </h2>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {sortedUsers.length} users
            </span>
          </div>

          <div className="overflow-x-auto overflow-y-visible rounded-[18px] border border-apple-mist">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="bg-[rgb(var(--apple-snow))]">
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                    Username
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                    Role
                  </th>
                  <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                    Status
                  </th>
                  <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-apple-steel">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-mist">
                {sortedUsers.map((user) => {
                  const isCurrentUser = user.id === currentUserId;

                  return (
                    <tr key={user.id}>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-apple-charcoal">
                          {user.full_name || "Unnamed user"}
                        </p>
                        {isCurrentUser ? (
                          <p className="mt-1 text-xs text-emerald-700">
                            Current account
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-apple-smoke">
                        {user.username}
                      </td>
                      <td className="px-3 py-3 text-apple-smoke">
                        {user.email}
                      </td>
                      <td className="px-3 py-3 text-apple-smoke">
                        {formatRoleLabel(user.role)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                            user.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700",
                          )}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={(event) =>
                            handleOpenMenu(
                              user.id,
                              event.currentTarget.getBoundingClientRect(),
                            )
                          }
                          data-user-actions-root
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-apple-mist bg-white text-apple-smoke transition hover:border-emerald-100 hover:bg-emerald-50/60 hover:text-apple-charcoal"
                          aria-label={`Open actions for ${user.full_name || user.username}`}
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <CostEstimatorConfirmModal
        open={deleteTarget !== null}
        eyebrow="Delete User"
        title="Delete user?"
        description={
          deleteTarget
            ? `This will permanently remove ${deleteTarget.full_name || deleteTarget.username}'s account.`
            : ""
        }
        confirmLabel="Delete user"
        confirmTone="danger"
        pending={isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteUserId(null)}
      />

      {openMenu && openMenuUser
        ? createPortal(
            <div
              data-user-actions-root
              className="fixed z-[140] min-w-[148px] -translate-x-full overflow-hidden rounded-[16px] border border-[#e8f0ea] bg-white text-left shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
              style={{ top: openMenu.top, left: openMenu.left }}
            >
              <button
                type="button"
                onClick={() => handleEditUser(openMenuUser)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-semibold text-apple-charcoal transition hover:bg-emerald-50/70"
              >
                <Pencil size={13} />
                Edit user
              </button>
              <button
                type="button"
                onClick={() => handleAskDelete(openMenuUser.id)}
                disabled={openMenuUser.id === currentUserId}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-semibold text-rose-600 transition hover:bg-rose-50/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={13} />
                Delete user
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
