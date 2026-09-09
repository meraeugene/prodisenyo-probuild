import SettingsPageClient from "@/features/settings/components/SettingsPageClient";
import { getCurrentProfile } from "@/lib/auth";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  return <SettingsPageClient initialProfile={profile} />;
}
