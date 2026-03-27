"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  createSession,
  getCurrentSessionUser,
  getSessionCookieName,
  invalidateSession,
  verifyCredentials,
} from "@/lib/auth";

export interface LoginActionState {
  error: string | null;
}

const EMPTY_LOGIN_STATE: LoginActionState = {
  error: null,
};

export async function loginAction(
  _previousState: LoginActionState = EMPTY_LOGIN_STATE,
  formData: FormData,
): Promise<LoginActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return {
      error: "Username and password are required.",
    };
  }

  const user = await verifyCredentials(username, password);
  if (!user) {
    return {
      error: "Invalid username or password.",
    };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  if (token) {
    await invalidateSession(token);
  }

  await clearSessionCookie();
  redirect("/auth/login");
}

export async function getSessionUserAction() {
  return getCurrentSessionUser();
}
