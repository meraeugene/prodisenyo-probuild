"use server";

import { redirect } from "next/navigation";
import type { Database } from "@/types/database";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { DEFAULT_AUTH_REDIRECT } from "@/lib/auth";

type ProfileLookupRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "username" | "email" | "is_active" | "role"
>;

export interface AuthActionState {
  error: string | null;
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "").trim();

  if (!username || !password) {
    return { error: "Username and password are required." };
  }

  const admin = createSupabaseAdminClient();
  const { data: profile, error: lookupError } = await admin
    .from("profiles")
    .select("username, email, is_active")
    .eq("username", username)
    .returns<ProfileLookupRow[]>()
    .maybeSingle();

  if (lookupError) {
    return { error: "Unable to verify username right now." };
  }

  if (!profile || !profile.is_active) {
    return { error: "Invalid username or password." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  if (error) {
    return { error: "Invalid username or password." };
  }

  const redirectPath =
    nextPath ||
    (profile.role === "ceo" ? "/dashboard" : "/upload-attendance");

  redirect(redirectPath || DEFAULT_AUTH_REDIRECT);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
