import { cache } from "react";
import { redirect } from "next/navigation";
import type { AppRole, Database } from "@/types/database";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export const APP_ROLES = {
  CEO: "ceo",
  PAYROLL_MANAGER: "payroll_manager",
  ENGINEER: "engineer",
} as const satisfies Record<string, AppRole>;

export const DEFAULT_AUTH_REDIRECT = "/dashboard";

export function getRoleHomePath(role: AppRole | null | undefined) {
  if (role === APP_ROLES.PAYROLL_MANAGER) return "/upload-attendance";
  if (role === APP_ROLES.ENGINEER) return "/cost-estimator";
  return "/dashboard";
}

export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export const getCurrentProfile = cache(async (): Promise<ProfileRow | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, email, full_name, avatar_path, role, is_active, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return profile;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}

export async function requireRole(roles: AppRole | AppRole[]) {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect(getRoleHomePath(profile?.role));
  }

  return { user, profile };
}
