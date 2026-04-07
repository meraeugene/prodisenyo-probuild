"use client";

import type { ChangeEvent, RefObject } from "react";
import {
  ImagePlus,
  LoaderCircle,
  Mail,
  Save,
  UserRound,
} from "lucide-react";
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
            onClick={onRemoveAvatar}
            className="mt-2 text-xs font-medium text-apple-steel transition hover:text-red-600"
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
            <span className="text-sm font-semibold text-apple-charcoal">
              Full Name
            </span>
            <div className="group flex h-12 items-center rounded-[14px] border border-[#dce5e8] bg-white px-4 transition focus-within:border-[#1f6a37] focus-within:ring-4 focus-within:ring-[#1f6a37]/10">
              <UserRound className="mr-3 h-4 w-4 text-apple-silver transition group-focus-within:text-[#1f6a37]" />
              <input
                value={fullName}
                onChange={(event) => onFullNameChange(event.target.value)}
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
                  onChange={(event) => onUsernameChange(event.target.value)}
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
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="Enter your email address"
                autoComplete="email"
                className="w-full bg-transparent text-sm text-apple-charcoal outline-none placeholder:text-apple-silver"
              />
            </div>
          </label>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onSaveProfile}
              disabled={!hasProfileChanges || savingProfile || loadingProfile}
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
  );
}
