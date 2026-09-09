"use client";

import SettingsPasswordSection from "@/features/settings/components/SettingsPasswordSection";
import SettingsProfileSection from "@/features/settings/components/SettingsProfileSection";
import SettingsResetWorkspaceModal from "@/features/settings/components/SettingsResetWorkspaceModal";
import { useSettingsPage } from "@/features/settings/hooks/useSettingsPage";

export default function SettingsPageClient() {
  const state = useSettingsPage();

  return (
    <>
      <div className="min-h-full space-y-7 bg-[#f6f8f8] p-4 sm:p-6 lg:p-8">
        <header className="rounded-3xl bg-[#075e5b] p-6 text-white sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">Account</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Settings</h1>
          <p className="mt-3 text-sm text-teal-50/80">Your profile and account security.</p>
        </header>

        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <SettingsProfileSection
            fileInputRef={state.fileInputRef}
            profile={state.profile}
            fullName={state.fullName}
            username={state.username}
            email={state.email}
            displayedAvatarUrl={state.displayedAvatarUrl}
            loadingProfile={state.loadingProfile}
            savingProfile={state.savingProfile}
            hasProfileChanges={state.hasProfileChanges}
            onFullNameChange={state.setFullName}
            onUsernameChange={state.setUsername}
            onEmailChange={state.setEmail}
            onAvatarFileChange={state.handleAvatarFileChange}
            onRemoveAvatar={state.handleRemoveAvatar}
            onSaveProfile={state.handleSaveProfile}
          />

          <div className="min-w-0 space-y-4">
            <SettingsPasswordSection
              newPassword={state.newPassword}
              confirmPassword={state.confirmPassword}
              showNewPassword={state.showNewPassword}
              showConfirmPassword={state.showConfirmPassword}
              changingPassword={state.changingPassword}
              onNewPasswordChange={state.setNewPassword}
              onConfirmPasswordChange={state.setConfirmPassword}
              onToggleNewPassword={() =>
                state.setShowNewPassword((value) => !value)
              }
              onToggleConfirmPassword={() =>
                state.setShowConfirmPassword((value) => !value)
              }
              onChangePassword={state.handleChangePassword}
            />
          </div>
        </section>
      </div>

      <SettingsResetWorkspaceModal
        open={state.showResetConfirm}
        onClose={() => state.setShowResetConfirm(false)}
        onConfirm={state.handleConfirmReset}
      />
    </>
  );
}
