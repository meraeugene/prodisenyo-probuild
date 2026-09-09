"use client";

import type { ChangeEvent, RefObject } from "react";
import { Camera, Upload, LoaderCircle, Mail, Save, UserRound } from "lucide-react";
import ProfileAvatar from "@/components/ProfileAvatar";
import { roleLabel } from "@/features/settings/utils/settingsHelpers";
import type { EditableProfile } from "@/features/settings/hooks/useSettingsPage";

interface SettingsProfileSectionProps {
  fileInputRef: RefObject<HTMLInputElement>;
  profile: EditableProfile | null;
  fullName: string;
  username: string;
  email: string;
  displayedAvatarUrl: string | null;
  loadingProfile: boolean;
  savingProfile: boolean;
  hasProfileChanges: boolean;
  onFullNameChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onAvatarFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  onSaveProfile: () => void;
}

export default function SettingsProfileSection({
  fileInputRef,
  profile,
  fullName,
  username,
  email,
  displayedAvatarUrl,
  loadingProfile,
  savingProfile,
  hasProfileChanges,
  onFullNameChange,
  onUsernameChange,
  onEmailChange,
  onAvatarFileChange,
  onRemoveAvatar,
  onSaveProfile,
}: SettingsProfileSectionProps) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_36px_-28px_rgba(15,23,42,.2)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Profile Information
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Update your personal details and how you appear in the system.
          </p>
        </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={onSaveProfile}
              disabled={!hasProfileChanges || savingProfile || loadingProfile}
              className="inline-flex h-10 items-center justify-center rounded-[12px] bg-[#e3f8f3] px-4 text-sm font-semibold text-[#096d67] transition hover:bg-[#d3f2ea] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#076d69]/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
      </div>

      <div className="mt-6 grid gap-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative shrink-0">
            <ProfileAvatar
              avatarUrl={displayedAvatarUrl}
              name={fullName.trim() || username.trim()}
              sizeClassName="h-28 w-28"
              textClassName="text-3xl"
            />
            <button type="button" aria-label="Change profile photo" disabled={loadingProfile || savingProfile}
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-xl border-2 border-white bg-[#08746f] text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 disabled:opacity-50">
              <Camera size={15} aria-hidden="true" />
            </button>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Profile Photo</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">Recommended size: 512 × 512px. Maximum file size: 2 MB.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loadingProfile || savingProfile}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 hover:border-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 disabled:opacity-50">
                <Upload size={15} aria-hidden="true" /> Upload Photo
              </button>
              <button type="button" onClick={onRemoveAvatar} disabled={!displayedAvatarUrl || loadingProfile || savingProfile}
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-medium text-slate-500 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 disabled:opacity-50">
                Remove
              </button>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarFileChange} />
        </div>

        <div className="grid min-w-0 gap-4">
          <label className="grid gap-2">
            <span className="text-xs font-semibold text-slate-900">
              Full Name
            </span>
            <div className="group flex h-10 items-center rounded-lg border border-[#dce5e8] bg-white px-4 transition focus-within:border-[#076d69] focus-within:ring-2 focus-within:ring-[#076d69]/10">
              <UserRound className="mr-3 h-4 w-4 text-slate-400 transition group-focus-within:text-[#076d69]" />
              <input
                value={fullName}
                onChange={(event) => onFullNameChange(event.target.value)}
                placeholder="Enter your full name"
                className="min-w-0 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs font-semibold text-slate-900">
                Username
              </span>
              <div className="group flex h-10 items-center rounded-lg border border-[#dce5e8] bg-white px-4 transition focus-within:border-[#076d69] focus-within:ring-2 focus-within:ring-[#076d69]/10">
                <UserRound className="mr-3 h-4 w-4 text-slate-400 transition group-focus-within:text-[#076d69]" />
                <input
                  value={username}
                  onChange={(event) => onUsernameChange(event.target.value)}
                  placeholder="Enter your username"
                  className="min-w-0 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            <div className="grid gap-2">
              <span className="text-xs font-semibold text-slate-900">
                Role
              </span>
              <div className="flex h-10 items-center rounded-lg border border-[#dce5e8] bg-[#f7fafb] px-4 text-sm text-slate-500">
                <UserRound className="mr-3 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                {roleLabel(profile?.role ?? null)}
              </div>
            </div>
          </div>

          <label className="grid gap-2">
            <span className="text-xs font-semibold text-slate-900">
              Email Address
            </span>
            <div className="group flex h-10 items-center rounded-lg border border-[#dce5e8] bg-white px-4 transition focus-within:border-[#076d69] focus-within:ring-2 focus-within:ring-[#076d69]/10">
              <Mail className="mr-3 h-4 w-4 text-slate-400 transition group-focus-within:text-[#076d69]" />
              <input
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="Enter your email address"
                autoComplete="email"
                className="min-w-0 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </label>


        </div>
      </div>
    </div>
  );
}
