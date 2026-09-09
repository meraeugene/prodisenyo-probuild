"use client";

import type { ChangeEvent, RefObject } from "react";
import { ImagePlus, LoaderCircle, Mail, Save, UserRound } from "lucide-react";
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
    <div className="flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_-25px_rgba(15,23,42,.25)] sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Profile
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your personal details.
          </p>
        </div>

        {loadingProfile ? (
          <LoaderCircle className="h-5 w-5 animate-spin text-slate-400" />
        ) : null}
      </div>

      <div className="mt-6 grid gap-6">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-2xl bg-slate-50 px-5 py-5">
          <ProfileAvatar
            avatarUrl={displayedAvatarUrl}
            name={fullName.trim() || username.trim()}
            sizeClassName="h-20 w-20"
            textClassName="text-2xl"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex h-10 items-center rounded-[12px] border border-[#d7e1e5] bg-white px-4 text-sm font-semibold text-slate-900 transition hover:border-[#076d69] hover:text-[#076d69]"
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            Upload Picture
          </button>

          <button
            type="button"
            onClick={onRemoveAvatar}
            className="mt-2 text-xs font-medium text-slate-500 transition hover:text-red-600"
          >
            Remove current picture
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onAvatarFileChange}
          />
        </div>

        <div className="grid min-w-0 gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-900">
              Full Name
            </span>
            <div className="group flex h-12 items-center rounded-[14px] border border-[#dce5e8] bg-white px-4 transition focus-within:border-[#076d69] focus-within:ring-4 focus-within:ring-[#076d69]/10">
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
              <span className="text-sm font-semibold text-slate-900">
                Username
              </span>
              <div className="group flex h-12 items-center rounded-[14px] border border-[#dce5e8] bg-white px-4 transition focus-within:border-[#076d69] focus-within:ring-4 focus-within:ring-[#076d69]/10">
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
              <span className="text-sm font-semibold text-slate-900">
                Role
              </span>
              <div className="flex h-12 items-center rounded-[14px] border border-[#dce5e8] bg-[#f7fafb] px-4 text-sm text-slate-500">
                {roleLabel(profile?.role ?? null)}
              </div>
            </div>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-900">
              Email
            </span>
            <div className="group flex h-12 items-center rounded-[14px] border border-[#dce5e8] bg-white px-4 transition focus-within:border-[#076d69] focus-within:ring-4 focus-within:ring-[#076d69]/10">
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

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onSaveProfile}
              disabled={!hasProfileChanges || savingProfile || loadingProfile}
              className="inline-flex h-11 items-center justify-center rounded-[12px] bg-[#076d69] px-4 text-sm font-semibold text-white transition hover:bg-[#0f766e] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#076d69]/10 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
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
  );
}
