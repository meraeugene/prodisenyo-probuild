"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Save,
  Trash2Icon,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import ProfileAvatar from "@/components/dashboard/ProfileAvatar";
import { useAppState } from "@/features/app/AppStateProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  getProfileAvatarPublicUrl,
  PROFILE_AVATAR_BUCKET,
} from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type EditableProfile = Pick<
  ProfileRow,
  "full_name" | "username" | "email" | "avatar_path" | "role"
>;

const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;

function roleLabel(role: ProfileRow["role"] | null) {
  if (role === "ceo") return "Chief Executive Officer";
  if (role === "payroll_manager") return "Payroll Manager";
  return "Signed-in user";
}

function trimOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getFileExtension(file: File) {
  const extension = file.name.split(".").pop()?.trim().toLowerCase();
  if (extension) return extension;

  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

function getReadableProfileError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Please try again in a moment.";
  }

  if (/bucket not found/i.test(error.message)) {
    return "Profile image storage is not configured yet. Please create the profile avatar bucket first, then try again.";
  }

  return error.message;
}

export default function SettingsPage() {
  const router = useRouter();
  const { handleReset } = useAppState();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null,
  );
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
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
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

        if (authError) {
          throw authError;
        }

        if (!user) {
          throw new Error("You need to sign in again.");
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, username, email, avatar_path, role")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error("Profile not found.");
        }

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
        if (!cancelled) {
          setLoadingProfile(false);
        }
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
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }

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

    if (!nextUsername) {
      toast.error("Username is required.");
      return;
    }

    if (!nextEmail) {
      toast.error("Email is required.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(nextEmail)) {
      toast.error("Enter a valid email address.");
      return;
    }

    setSavingProfile(true);

    let uploadedAvatarPath: string | null = null;

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You need to sign in again.");
      }

      const previousAvatarPath = profile.avatar_path;
      const previousEmail = normalizeEmail(profile.email ?? user.email ?? "");
      let nextAvatarPath = previousAvatarPath;

      if (selectedAvatarFile) {
        const extension = getFileExtension(selectedAvatarFile);
        uploadedAvatarPath = `${user.id}/avatar-${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(PROFILE_AVATAR_BUCKET)
          .upload(uploadedAvatarPath, selectedAvatarFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

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

      const authUpdatePayload: {
        data: {
          username: string;
          full_name: string | null;
          avatar_path: string | null;
        };
      } = {
        data: {
          username: nextUsername,
          full_name: nextFullName,
          avatar_path: nextAvatarPath,
        },
      };

      const { error: authUpdateError } =
        await supabase.auth.updateUser(authUpdatePayload);

      if (authUpdateError) {
        if (uploadedAvatarPath) {
          await supabase.storage
            .from(PROFILE_AVATAR_BUCKET)
            .remove([uploadedAvatarPath]);
        }
        throw authUpdateError;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdates as never)
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      if (previousAvatarPath && previousAvatarPath !== nextAvatarPath) {
        await supabase.storage
          .from(PROFILE_AVATAR_BUCKET)
          .remove([previousAvatarPath]);
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
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }

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
        await supabase.storage
          .from(PROFILE_AVATAR_BUCKET)
          .remove([uploadedAvatarPath]);
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
      toast.error("Password is too short", {
        description: "Use at least 8 characters for your new password.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setChangingPassword(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setNewPassword("");
      setConfirmPassword("");

      toast.success("Password updated", {
        description: "Your new password is active for future sign-ins.",
      });
    } catch (error) {
      toast.error("Unable to change password", {
        description:
          error instanceof Error
            ? error.message
            : "Please try again in a moment.",
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

  return (
    <>
      <div className="space-y-4 p-6">
        <DashboardPageHero
          eyebrow="Account"
          title="Settings"
          description="Edit your profile, update your password, and manage locally stored payroll workspace data."
        />

        <section className="grid items-stretch gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="flex h-full flex-col rounded-[18px] border border-[#e7ecef] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-apple-charcoal">
                  Edit Profile
                </h2>
                <p className="mt-1 text-sm text-apple-steel">
                  Keep your account details and display picture up to date.
                </p>
              </div>

              {loadingProfile ? (
                <LoaderCircle className="h-5 w-5 animate-spin text-apple-silver" />
              ) : null}
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
              <div className="flex flex-col items-center rounded-[18px] border border-[#edf2f4] bg-[#f8fbfc] px-5 py-6">
                <ProfileAvatar
                  avatarUrl={displayedAvatarUrl}
                  name={fullName.trim() || username.trim()}
                  sizeClassName="h-28 w-28"
                  textClassName="text-2xl"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 inline-flex h-10 items-center rounded-[12px] border border-[#d7e1e5] bg-white px-4 text-sm font-semibold text-apple-charcoal transition hover:border-[#1f6a37] hover:text-[#1f6a37]"
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Upload Picture
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedAvatarFile(null);
                    setRemoveAvatar(true);
                    setAvatarPreviewUrl((currentUrl) => {
                      if (currentUrl) {
                        URL.revokeObjectURL(currentUrl);
                      }

                      return null;
                    });
                  }}
                  className="mt-2 text-xs font-medium text-apple-steel transition hover:text-red-600"
                >
                  Remove current picture
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
              </div>

              <div className="grid min-w-0 gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-apple-charcoal">
                    Full Name
                  </span>
                  <div className="group flex h-12 items-center rounded-[14px] border border-[#dce5e8] bg-white px-4 transition focus-within:border-[#1f6a37] focus-within:ring-4 focus-within:ring-[#1f6a37]/10">
                    <UserRound className="mr-3 h-4 w-4 text-apple-silver transition group-focus-within:text-[#1f6a37]" />
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Enter your full name"
                      className="w-full bg-transparent text-sm text-apple-charcoal outline-none placeholder:text-apple-silver"
                    />
                  </div>
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-apple-charcoal">
                      Username
                    </span>
                    <div className="group flex h-12 items-center rounded-[14px] border border-[#dce5e8] bg-white px-4 transition focus-within:border-[#1f6a37] focus-within:ring-4 focus-within:ring-[#1f6a37]/10">
                      <UserRound className="mr-3 h-4 w-4 text-apple-silver transition group-focus-within:text-[#1f6a37]" />
                      <input
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="Enter your username"
                        className="w-full bg-transparent text-sm text-apple-charcoal outline-none placeholder:text-apple-silver"
                      />
                    </div>
                  </label>

                  <div className="grid gap-2">
                    <span className="text-sm font-semibold text-apple-charcoal">
                      Role
                    </span>
                    <div className="flex h-12 items-center rounded-[14px] border border-[#dce5e8] bg-[#f7fafb] px-4 text-sm text-apple-steel">
                      {roleLabel(profile?.role ?? null)}
                    </div>
                  </div>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-apple-charcoal">
                    Email
                  </span>
                  <div className="group flex h-12 items-center rounded-[14px] border border-[#dce5e8] bg-white px-4 transition focus-within:border-[#1f6a37] focus-within:ring-4 focus-within:ring-[#1f6a37]/10">
                    <Mail className="mr-3 h-4 w-4 text-apple-silver transition group-focus-within:text-[#1f6a37]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Enter your email address"
                      autoComplete="email"
                      className="w-full bg-transparent text-sm text-apple-charcoal outline-none placeholder:text-apple-silver"
                    />
                  </div>
                </label>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={
                      !hasProfileChanges || savingProfile || loadingProfile
                    }
                    className="inline-flex h-11 items-center justify-center rounded-[12px] bg-[#1f6a37] px-4 text-sm font-semibold text-white transition hover:bg-[#18532b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1f6a37]/10 disabled:cursor-not-allowed disabled:bg-[#93b6a0]"
                  >
                    {savingProfile ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
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
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full bg-transparent text-sm text-apple-charcoal outline-none placeholder:text-apple-silver"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((value) => !value)}
                        className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-apple-steel transition hover:bg-[#f3f7f4] hover:text-[#1f6a37]"
                        aria-label={
                          showNewPassword
                            ? "Hide new password"
                            : "Show new password"
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
                    <span className="text-sm font-semibold text-apple-charcoal">
                      Confirm New Password
                    </span>
                    <div className="group flex h-12 items-center rounded-[14px] border border-[#dce5e8] bg-white px-4 transition focus-within:border-[#1f6a37] focus-within:ring-4 focus-within:ring-[#1f6a37]/10">
                      <LockKeyhole className="mr-3 h-4 w-4 text-apple-silver transition group-focus-within:text-[#1f6a37]" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        placeholder="Re-enter your password"
                        className="w-full bg-transparent text-sm text-apple-charcoal outline-none placeholder:text-apple-silver"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((value) => !value)
                        }
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
                    Use a stronger password with a mix of letters, numbers, and
                    symbols when possible.
                  </p>

                  <button
                    type="button"
                    onClick={handleChangePassword}
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
          </div>
        </section>
      </div>

      {showResetConfirm ? (
        <div className="fixed inset-0 z-50 flex min-h-screen w-screen items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-apple-mist bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <TriangleAlert size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-apple-charcoal">
                    Reset workspace data?
                  </h2>
                  <p className="mt-1 text-sm text-apple-smoke">
                    This will remove locally stored payroll workspace data from
                    this device.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-apple-smoke transition hover:bg-apple-snow hover:text-apple-charcoal"
                aria-label="Close reset confirmation"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/70 p-4">
              <p className="text-sm font-semibold text-red-700">
                The following data will be deleted:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-red-700/90">
                <li>Uploaded attendance records and employee data</li>
                <li>Generated payroll results and payroll edits</li>
                <li>Edited role rates and paid holidays</li>
                <li>Saved filters and locally stored workspace state</li>
              </ul>
            </div>

            <p className="mt-4 text-sm text-apple-steel">
              This action cannot be undone unless you upload the files and
              rebuild the workspace again.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="h-11 rounded-[12px] border border-apple-silver px-4 text-sm font-semibold text-apple-ash transition hover:border-apple-charcoal"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="inline-flex h-11 items-center rounded-[12px] bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <Trash2Icon className="mr-2 h-4 w-4" />
                Delete Workspace Data
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
