import { redirect } from "next/navigation";
import LoginPage from "@/features/auth/components/LoginPage";
import { getCurrentProfile, getRoleHomePath } from "@/lib/auth";

export const metadata = {
  title: "Login",
};

export default async function LoginRoute({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; error?: string }>;
}) {
  const profile = await getCurrentProfile();

  if (profile?.is_active) {
    redirect(getRoleHomePath(profile.role));
  }

  const params = searchParams ? await searchParams : undefined;
  const initialError =
    params?.error === "inactive"
      ? "This account is inactive. Contact your administrator."
      : params?.error === "profile"
        ? "This account setup is incomplete. Contact your administrator."
        : null;

  return (
    <LoginPage
      nextPath={params?.next ?? null}
      initialError={initialError}
    />
  );
}
