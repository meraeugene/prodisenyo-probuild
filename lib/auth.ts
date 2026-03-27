import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "@/lib/auth-shared";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { AppUserRole, SessionUser } from "@/types/auth";

function getSessionDurationHours() {
  const value = Number(process.env.APP_SESSION_DURATION_HOURS ?? "168");
  return Number.isFinite(value) && value > 0 ? value : 168;
}

function getSessionExpiryDate() {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + getSessionDurationHours());
  return expiry;
}

function buildSessionToken() {
  return crypto.randomBytes(48).toString("hex");
}

export function getSessionCookieName() {
  return AUTH_COOKIE_NAME;
}

export async function verifyCredentials(
  username: string,
  password: string,
): Promise<SessionUser | null> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.rpc("verify_app_login", {
    p_username: username,
    p_password: password,
  });

  if (error || !data) {
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    id: row.user_id,
    username: row.username,
    fullName: row.full_name,
    role: row.role as AppUserRole,
  };
}

export async function createSession(userId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const sessionToken = buildSessionToken();
  const expiresAt = getSessionExpiryDate();

  const { error } = await supabase.from("app_sessions").insert({
    user_id: userId,
    token: sessionToken,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error("Unable to create app session.");
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: AUTH_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function invalidateSession(token: string) {
  const supabase = createServiceRoleSupabaseClient();
  await supabase.from("app_sessions").delete().eq("token", token);
}

export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: session, error: sessionError } = await supabase
    .from("app_sessions")
    .select("user_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (sessionError || !session) {
    await clearSessionCookie();
    return null;
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await invalidateSession(token);
    await clearSessionCookie();
    return null;
  }

  const { data: user, error: userError } = await supabase
    .from("app_users")
    .select("id, username, full_name, role, active")
    .eq("id", session.user_id)
    .maybeSingle();

  if (userError || !user || !user.active) {
    await invalidateSession(token);
    await clearSessionCookie();
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    role: user.role as AppUserRole,
  };
}

export async function requireUser(allowedRoles?: AppUserRole[]) {
  const user = await getCurrentSessionUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}
