"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createAppUserAction,
  updateAppUserAction,
  deleteAppUserAction,
} from "@/actions/users";
import type { ManagedUserRow } from "../types";
import { EMPTY_FORM, type FormErrors } from "../utils/userManagementForm";
export function useUserManagementPage(initialUsers: ManagedUserRow[]) {
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<{
    userId: string;
    top: number;
    left: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedUsers = useMemo(
    () =>
      [...users].sort(
        (left, right) =>
          left.full_name?.localeCompare(right.full_name ?? "") ||
          left.username.localeCompare(right.username),
      ),
    [users],
  );

  const deleteTarget =
    sortedUsers.find((user) => user.id === deleteUserId) ?? null;
  const openMenuUser =
    sortedUsers.find((user) => user.id === openMenu?.userId) ?? null;

  useEffect(() => {
    if (!openMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-user-actions-root]")) return;
      setOpenMenu(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [openMenu]);

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!form.username.trim()) {
      nextErrors.username = "Username is required.";
    } else if (
      !/^[a-z0-9._-]{3,30}$/.test(form.username.trim().toLowerCase())
    ) {
      nextErrors.username =
        "Username must be 3-30 characters and use only letters, numbers, dot, dash, or underscore.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!editingUserId && !form.password) {
      nextErrors.password = "Temporary password is required.";
    } else if (!editingUserId && form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (!form.role) {
      nextErrors.role = "Role is required.";
    }

    return nextErrors;
  }

  function updateField<K extends keyof typeof EMPTY_FORM>(
    field: K,
    value: (typeof EMPTY_FORM)[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditingUserId(null);
  }

  function handleEditUser(user: ManagedUserRow) {
    setOpenMenu(null);
    setEditingUserId(user.id);
    setErrors({});
    setForm({
      fullName: user.full_name ?? "",
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
      isActive: user.is_active,
    });
  }

  function handleSubmit() {
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    startTransition(async () => {
      try {
        if (editingUserId) {
          const response = await updateAppUserAction({
            userId: editingUserId,
            fullName: form.fullName,
            username: form.username,
            email: form.email,
            role: form.role,
            isActive: form.isActive,
          });

          setUsers((current) =>
            current.map((user) =>
              user.id === editingUserId ? response.user : user,
            ),
          );
          toast.success("User updated.");
        } else {
          const response = await createAppUserAction({
            fullName: form.fullName,
            username: form.username,
            email: form.email,
            password: form.password,
            role: form.role,
          });
          setUsers((current) => [response.user, ...current]);
          toast.success("User account created.");
        }

        resetForm();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save user.",
        );
      }
    });
  }

  function handleConfirmDelete() {
    if (!deleteUserId) return;

    startTransition(async () => {
      try {
        await deleteAppUserAction(deleteUserId);
        setUsers((current) =>
          current.filter((user) => user.id !== deleteUserId),
        );
        setDeleteUserId(null);
        toast.success("User deleted.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete user.",
        );
      }
    });
  }

  function handleOpenMenu(userId: string, rect: DOMRect) {
    setOpenMenu((current) =>
      current?.userId === userId
        ? null
        : {
            userId,
            top: rect.bottom + 8,
            left: rect.right,
          },
    );
  }

  function handleAskDelete(userId: string) {
    setOpenMenu(null);
    setDeleteUserId(userId);
  }

  return {
    form,
    errors,
    editingUserId,
    isPending,
    sortedUsers,
    deleteTarget,
    openMenu,
    openMenuUser,
    resetForm,
    updateField,
    handleSubmit,
    handleConfirmDelete,
    handleOpenMenu,
    handleEditUser,
    handleAskDelete,
    setDeleteUserId,
  };
}
