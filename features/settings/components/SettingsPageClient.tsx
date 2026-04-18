"use client";

import DashboardPageHero from "@/components/DashboardPageHero";
import SettingsPasswordSection from "@/features/settings/components/SettingsPasswordSection";
import SettingsProfileSection from "@/features/settings/components/SettingsProfileSection";
import SettingsResetWorkspaceModal from "@/features/settings/components/SettingsResetWorkspaceModal";
import { useSettingsPage } from "@/features/settings/hooks/useSettingsPage";

export default function SettingsPageClient() {
  const state = useSettingsPage();

  return (
    <>
      <div className="space-y-4 p-0 sm:p-6">
        <DashboardPageHero
          eyebrow="Account"
          title="Settings"
          description="Edit your profile, update your password, and manage locally stored payroll workspace data."
        />

        <section className="grid items-stretch gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
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
