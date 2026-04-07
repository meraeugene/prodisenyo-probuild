"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppState } from "@/features/app/AppStateProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  getProfileAvatarPublicUrl,
  PROFILE_AVATAR_BUCKET,
} from "@/lib/supabase/storage";
import {
  getFileExtension,
  getReadableProfileError,
  MAX_AVATAR_FILE_SIZE,
  normalizeEmail,
  trimOrNull,
} from "@/features/settings/utils/settingsHelpers";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type EditableProfile = Pick<
  ProfileRow,
  "full_name" | "username" | "email" | "avatar_path" | "role"
>;

export function useSettingsPage() {
  const router = useRouter();
  const { handleReset } = useAppState();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const hasProfileChanges = useMemo(() => {
    if (!profile) return false;
    return (
      fullName.trim() !== (profile.full_name ?? "") ||
      username.trim().toLowerCase() !== profile.username ||
      normalizeEmail(email) !== normalizeEmail(profile.email ?? "") ||
      selectedAvatarFile !== null ||
      (removeAvatar && Boolean(profile.avatar_path))
    );
  }, [email, fullName, profile, removeAvatar, selectedAvatarFile, username]);

  const displayedAvatarUrl = useMemo(() => {
    if (removeAvatar) return null;
    if (avatarPreviewUrl) return avatarPreviewUrl;
    return getProfileAvatarPublicUrl(profile?.avatar_path);
  }, [avatarPreviewUrl, profile?.avatar_path, removeAvatar]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setLoadingProfile(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) throw new Error("You need to sign in again.");
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, username, email, avatar_path, role")
          .eq("id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Profile not found.");
        if (cancelled) return;
        const nextProfile = data as EditableProfile;
        setProfile(nextProfile);
        setFullName(nextProfile.full_name ?? "");
        setUsername(nextProfile.username ?? "");
        setEmail(nextProfile.email ?? user.email ?? "");
      } catch (error) {
        if (!cancelled) {
          toast.error("Unable to load profile", {
            description:
              error instanceof Error
                ? error.message
                : "Please refresh and try again.",
          });
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }
    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAvatarFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type", {
        description: "Please choose an image file for your profile picture.",
      });
      event.target.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_FILE_SIZE) {
      toast.error("Image is too large", {
        description: "Please choose an image smaller than 2 MB.",
      });
      event.target.value = "";
      return;
    }
    try {
      const objectUrl = URL.createObjectURL(file);
      setSelectedAvatarFile(file);
      setRemoveAvatar(false);
      setAvatarPreviewUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        return objectUrl;
      });
      toast.success("Profile picture ready", {
        description: "Save your profile to apply the new avatar.",
      });
    } catch (error) {
      toast.error("Unable to use image", {
        description:
          error instanceof Error ? error.message : "Please try another file.",
      });
    } finally {
      event.target.value = "";
    }
  }

  async function handleSaveProfile() {
    if (!profile) return;
    const nextFullName = trimOrNull(fullName);
    const nextUsername = username.trim().toLowerCase();
    const nextEmail = normalizeEmail(email);
    if (!nextUsername) return void toast.error("Username is required.");
    if (!nextEmail) return void toast.error("Email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      return void toast.error("Enter a valid email address.");
    }
    setSavingProfile(true);
    let uploadedAvatarPath: string | null = null;
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("You need to sign in again.");
      const previousAvatarPath = profile.avatar_path;
      const previousEmail = normalizeEmail(profile.email ?? user.email ?? "");
      let nextAvatarPath = previousAvatarPath;
      if (selectedAvatarFile) {
        uploadedAvatarPath = `${user.id}/avatar-${Date.now()}.${getFileExtension(selectedAvatarFile)}`;
        const { error: uploadError } = await supabase.storage
          .from(PROFILE_AVATAR_BUCKET)
          .upload(uploadedAvatarPath, selectedAvatarFile, {
            cacheControl: "3600",
            upsert: true,
          });
        if (uploadError) throw uploadError;
        nextAvatarPath = uploadedAvatarPath;
      } else if (removeAvatar) {
        nextAvatarPath = null;
      }
      const profileUpdates: ProfileUpdate = {
        full_name: nextFullName,
        username: nextUsername,
        email: nextEmail,
        avatar_path: nextAvatarPath,
      };
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          username: nextUsername,
          full_name: nextFullName,
          avatar_path: nextAvatarPath,
        },
      });
      if (authUpdateError) throw authUpdateError;
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdates as never)
        .eq("id", user.id);
      if (profileError) throw profileError;
      if (previousAvatarPath && previousAvatarPath !== nextAvatarPath) {
        await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([previousAvatarPath]);
      }
      const nextProfile: EditableProfile = {
        ...profile,
        full_name: nextFullName,
        username: nextUsername,
        email: nextEmail,
        avatar_path: nextAvatarPath,
      };
      setProfile(nextProfile);
      setFullName(nextProfile.full_name ?? "");
      setUsername(nextProfile.username);
      setEmail(nextProfile.email ?? "");
      setSelectedAvatarFile(null);
      setRemoveAvatar(false);
      setAvatarPreviewUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        return null;
      });
      router.refresh();
      toast.success("Profile updated", {
        description:
          nextEmail !== previousEmail
            ? "Your profile email and account details were saved successfully."
            : "Your account details were saved successfully.",
      });
    } catch (error) {
      if (uploadedAvatarPath) {
        const supabase = createSupabaseBrowserClient();
        await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([uploadedAvatarPath]);
      }
      toast.error("Unable to save profile", {
        description: getReadableProfileError(error),
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      return void toast.error("Password is too short", {
        description: "Use at least 8 characters for your new password.",
      });
    }
    if (newPassword !== confirmPassword) {
      return void toast.error("Passwords do not match.");
    }
    setChangingPassword(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated", {
        description: "Your new password is active for future sign-ins.",
      });
    } catch (error) {
      toast.error("Unable to change password", {
        description:
          error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setChangingPassword(false);
    }
  }

  function handleConfirmReset() {
    handleReset();
    setShowResetConfirm(false);
    toast.success("Workspace data reset", {
      description:
        "Uploaded attendance, payroll data, rates, edits, and saved workspace state were cleared from this device.",
    });
  }

  function handleRemoveAvatar() {
    setSelectedAvatarFile(null);
    setRemoveAvatar(true);
    setAvatarPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return null;
    });
  }

  return {
    fileInputRef,
    profile,
    fullName,
    setFullName,
    username,
    setUsername,
    email,
    setEmail,
    displayedAvatarUrl,
    showResetConfirm,
    setShowResetConfirm,
    loadingProfile,
    savingProfile,
    changingPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    hasProfileChanges,
    handleAvatarFileChange,
    handleSaveProfile,
    handleChangePassword,
    handleConfirmReset,
    handleRemoveAvatar,
  };
}
