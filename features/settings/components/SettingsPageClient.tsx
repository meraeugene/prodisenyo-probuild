"use client";

import SettingsPasswordSection from "@/features/settings/components/SettingsPasswordSection";
import SettingsProfileSection from "@/features/settings/components/SettingsProfileSection";
import SettingsResetWorkspaceModal from "@/features/settings/components/SettingsResetWorkspaceModal";
import SettingsHero from "@/features/settings/components/SettingsHero";
import {
  type EditableProfile,
  useSettingsPage,
} from "@/features/settings/hooks/useSettingsPage";

export default function SettingsPageClient({
  initialProfile,
}: {
  initialProfile: EditableProfile | null;
}) {
  const state = useSettingsPage(initialProfile);

  return (
    <>
      <div className="min-h-screen space-y-7 bg-white p-4 sm:p-6 lg:p-8">
        <SettingsHero />

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
