"use client";

import SettingsPasswordSection from "@/features/settings/components/SettingsPasswordSection";
import SettingsProfileSection from "@/features/settings/components/SettingsProfileSection";
import SettingsResetWorkspaceModal from "@/features/settings/components/SettingsResetWorkspaceModal";
import { useSettingsPage } from "@/features/settings/hooks/useSettingsPage";

export default function SettingsPageClient() {
  const state = useSettingsPage();

  return (
    <>
      <div className="min-h-screen space-y-7 bg-[#f5f7f9] p-4 sm:p-6 lg:p-8">
        <header className="px-1 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#08746f]">Account</p>
          <h1 className="mt-2 text-[34px] font-bold leading-tight tracking-[-0.04em] text-slate-950">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your profile and account security.</p>
        </header>

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.28fr)_minmax(0,1fr)]">
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
