"use client";

import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { createPortal } from "react-dom";
import DashboardPageHero from "@/components/DashboardPageHero";
import CostEstimatorConfirmModal from "@/features/cost-estimator/components/CostEstimatorConfirmModal";
import type { ManagedUserRow } from "../types";
import { cn } from "@/lib/utils";
import { useUserManagementPage } from "../hooks/useUserManagementPage";
import {
  formatRoleLabel,
  ROLE_OPTIONS,
} from "../utils/userManagementForm";
import UserAccountModal from "./UserAccountModal";

function UserActionsButton({
  user,
  onOpen,
}: {
  user: ManagedUserRow;
  onOpen: (userId: string, rect: DOMRect) => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) =>
        onOpen(user.id, event.currentTarget.getBoundingClientRect())
      }
      data-user-actions-root
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-apple-mist bg-white text-apple-smoke transition hover:border-teal-100 hover:bg-teal-50/60 hover:text-apple-charcoal"
      aria-label={`Open actions for ${user.full_name || user.username}`}
    >
      <MoreHorizontal size={15} />
    </button>
  );
}

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
    filteredUsers,
    paginatedUsers,
    searchQuery,
    roleFilter,
    statusFilter,
    page,
    totalPages,
    deleteTarget,
    openMenu,
    openMenuUser,
    isPending,
    handleAddUser,
    handleOpenMenu,
    handleConfirmDelete,
    handleEditUser,
    handleAskDelete,
    setSearchQuery,
    setRoleFilter,
    setStatusFilter,
    setPage,
    setDeleteUserId,
  } = state;
  const firstVisibleUser =
    filteredUsers.length === 0 ? 0 : (page - 1) * 10 + 1;
  const lastVisibleUser = Math.min(page * 10, filteredUsers.length);

  return (
    <div className="space-y-4 overflow-x-hidden p-0 sm:p-6">
      <DashboardPageHero
        eyebrow="Admin"
        title="User Management"
        description="Create, update, and manage user accounts for all application roles, including GMEA."
      />

      <section className="min-w-0 rounded-none border border-apple-mist bg-white p-4 shadow-[0_10px_30px_rgba(7,109,105,0.06)] sm:rounded-[22px] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
              Directory
            </p>
            <div className="mt-2 flex items-center gap-3">
              <h2 className="text-xl font-semibold text-apple-charcoal">Users</h2>
              <span className="text-sm text-apple-smoke">
                {filteredUsers.length === sortedUsers.length
                  ? `${sortedUsers.length} accounts`
                  : `${filteredUsers.length} of ${sortedUsers.length}`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddUser}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#076d69] px-4 text-sm font-semibold text-white transition hover:bg-[#055f5b]"
          >
            <Plus size={16} />
            Add user
          </button>
        </div>

        <div className="mt-5 grid gap-2 md:grid-cols-[minmax(240px,1fr)_190px_160px]">
          <label className="relative block">
            <span className="sr-only">Search users</span>
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-apple-steel"
              size={16}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search name, username, or email"
              className="h-10 w-full rounded-[10px] border border-apple-mist bg-white pl-9 pr-3 text-sm text-apple-charcoal outline-none transition focus:border-[#076d69]"
            />
          </label>
          <select
            aria-label="Filter users by role"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="h-10 rounded-[10px] border border-apple-mist bg-white px-3 text-sm text-apple-charcoal outline-none focus:border-[#076d69]"
          >
            <option value="all">All roles</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter users by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-[10px] border border-apple-mist bg-white px-3 text-sm text-apple-charcoal outline-none focus:border-[#076d69]"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="mt-4 overflow-hidden rounded-[16px] border border-apple-mist">
          <table className="hidden w-full table-fixed text-sm md:table">
            <thead>
              <tr className="bg-[rgb(var(--apple-snow))]">
                <th className="w-[24%] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-apple-steel">Name</th>
                <th className="w-[16%] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-apple-steel">Username</th>
                <th className="hidden w-[24%] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-apple-steel lg:table-cell">Email</th>
                <th className="w-[17%] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-apple-steel">Role</th>
                <th className="w-[11%] px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-apple-steel">Status</th>
                <th className="w-[8%] px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-apple-steel">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apple-mist">
              {paginatedUsers.map((user) => {
                const isCurrentUser = user.id === currentUserId;
                return (
                  <tr key={user.id} className="align-middle">
                    <td className="min-w-0 px-3 py-3">
                      <p className="break-words font-semibold text-apple-charcoal">{user.full_name || "Unnamed user"}</p>
                      <p className="mt-0.5 break-all text-xs text-apple-smoke lg:hidden">{user.email}</p>
                      {isCurrentUser ? <p className="mt-1 text-xs text-teal-700">Current account</p> : null}
                    </td>
                    <td className="break-all px-3 py-3 text-apple-smoke">{user.username}</td>
                    <td className="hidden break-all px-3 py-3 text-apple-smoke lg:table-cell">{user.email}</td>
                    <td className="break-words px-3 py-3 text-apple-smoke">{formatRoleLabel(user.role)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", user.is_active ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-700")}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <UserActionsButton user={user} onOpen={handleOpenMenu} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="divide-y divide-apple-mist md:hidden">
            {paginatedUsers.map((user) => (
              <div key={user.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-apple-charcoal">{user.full_name || "Unnamed user"}</p>
                    <p className="mt-1 break-all text-sm text-apple-smoke">@{user.username}</p>
                    <p className="mt-1 break-all text-sm text-apple-smoke">{user.email}</p>
                  </div>
                  <UserActionsButton user={user} onOpen={handleOpenMenu} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{formatRoleLabel(user.role)}</span>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", user.is_active ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-700")}>{user.is_active ? "Active" : "Inactive"}</span>
                  {user.id === currentUserId ? <span className="text-xs font-medium text-teal-700">You</span> : null}
                </div>
              </div>
            ))}
          </div>

          {paginatedUsers.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="font-semibold text-apple-charcoal">No users found</p>
              <p className="mt-1 text-sm text-apple-smoke">Try changing the search or filters.</p>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-apple-smoke sm:flex-row sm:items-center sm:justify-between">
          <p>Showing {firstVisibleUser}–{lastVisibleUser} of {filteredUsers.length}</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="inline-flex h-9 items-center gap-1 rounded-lg border border-apple-mist px-3 font-semibold text-apple-charcoal disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronLeft size={15} /> Previous
            </button>
            <span className="min-w-16 text-center">{page} of {totalPages}</span>
            <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="inline-flex h-9 items-center gap-1 rounded-lg border border-apple-mist px-3 font-semibold text-apple-charcoal disabled:cursor-not-allowed disabled:opacity-40">
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      <UserAccountModal state={state} currentUserId={currentUserId} />

      <CostEstimatorConfirmModal
        open={deleteTarget !== null}
        eyebrow="Delete User"
        title="Delete user?"
        description={deleteTarget ? `This will permanently remove ${deleteTarget.full_name || deleteTarget.username}'s account.` : ""}
        confirmLabel="Delete user"
        confirmTone="danger"
        pending={isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteUserId(null)}
      />

      {openMenu && openMenuUser
        ? createPortal(
            <div data-user-actions-root className="fixed z-[140] min-w-[148px] -translate-x-full overflow-hidden rounded-[16px] border border-[#e8f0ea] bg-white text-left shadow-[0_14px_30px_rgba(15,23,42,0.08)]" style={{ top: openMenu.top, left: openMenu.left }}>
              <button type="button" onClick={() => handleEditUser(openMenuUser)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-semibold text-apple-charcoal transition hover:bg-teal-50/70">
                <Pencil size={13} /> Edit user
              </button>
              <button type="button" onClick={() => handleAskDelete(openMenuUser.id)} disabled={openMenuUser.id === currentUserId} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-semibold text-rose-600 transition hover:bg-rose-50/70 disabled:cursor-not-allowed disabled:opacity-50">
                <Trash2 size={13} /> Delete user
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
