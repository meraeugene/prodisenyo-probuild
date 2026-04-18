import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseBrowserEnv } from "@/lib/env";

const SUPABASE_AUTH_COOKIE_LIFETIME_SECONDS = 60 * 60 * 24 * 365;

type CookieMutation = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

const PROTECTED_PREFIXES = [
  "/home",
  "/dashboard",
  "/upload-attendance",
  "/budget-tracker",
  "/cost-estimator",
  "/estimate-reviews",
  "/overtime-approvals",
  "/review-attendance",
  "/generate-payroll",
  "/attendance-analytics",
  "/payroll-analytics",
  "/payroll-reports",
  "/add-user",
  "/request-material",
  "/request-overtime",
  "/reset-data",
  "/settings",
] as const;

const HR_SUBMISSION_REQUIRED_PREFIXES = [
  "/dashboard",
  "/review-attendance",
  "/generate-payroll",
] as const;

const CEO_ALLOWED_PREFIXES = [
  "/home",
  "/dashboard",
  "/budget-tracker",
  "/estimate-reviews",
  "/overtime-approvals",
  "/attendance-analytics",
  "/payroll-analytics",
  "/payroll-reports",
  "/add-user",
  "/reset-data",
  "/settings",
] as const;

const CEO_ONLY_PREFIXES = ["/overtime-approvals", "/payroll-reports"] as const;
const CEO_REDIRECT_PATH = "/home";
const PAYROLL_MANAGER_REDIRECT_PATH = "/home";
const ENGINEER_REDIRECT_PATH = "/home";
const EMPLOYEE_REDIRECT_PATH = "/home";
const ENGINEER_ALLOWED_PREFIXES = [
  "/home",
  "/budget-tracker",
  "/cost-estimator",
  "/request-material",
  "/request-overtime",
  "/settings",
] as const;
const EMPLOYEE_ALLOWED_PREFIXES = [
  "/home",
  "/budget-tracker",
  "/request-overtime",
  "/settings",
] as const;

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function requiresHrSubmission(pathname: string) {
  return HR_SUBMISSION_REQUIRED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAllowedCeoPath(pathname: string) {
  return CEO_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isCeoOnlyPath(pathname: string) {
  return CEO_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAllowedEngineerPath(pathname: string) {
  return ENGINEER_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAllowedEmployeePath(pathname: string) {
  return EMPLOYEE_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { url, anonKey } = getSupabaseBrowserEnv();
  const supabase = createServerClient<Database>(url, anonKey, {
    cookieOptions: {
      lifetime: SUPABASE_AUTH_COOKIE_LIFETIME_SECONDS,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieMutation[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && isProtectedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const currentRole = (profile as { role?: string } | null)?.role ?? null;

    if (!profileError && pathname === "/auth/login") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname =
        currentRole === "ceo"
          ? CEO_REDIRECT_PATH
          : currentRole === "payroll_manager"
            ? PAYROLL_MANAGER_REDIRECT_PATH
            : currentRole === "engineer"
              ? ENGINEER_REDIRECT_PATH
              : currentRole === "employee"
                ? EMPLOYEE_REDIRECT_PATH
                : "/dashboard";
      redirectUrl.searchParams.delete("next");
      redirectUrl.searchParams.delete("required");
      return NextResponse.redirect(redirectUrl);
    }

    if (
      !profileError &&
      currentRole === "payroll_manager" &&
      pathname === "/dashboard"
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = PAYROLL_MANAGER_REDIRECT_PATH;
      redirectUrl.searchParams.delete("required");
      return NextResponse.redirect(redirectUrl);
    }

    if (
      !profileError &&
      currentRole === "payroll_manager" &&
      isCeoOnlyPath(pathname)
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = PAYROLL_MANAGER_REDIRECT_PATH;
      redirectUrl.searchParams.delete("required");
      return NextResponse.redirect(redirectUrl);
    }

    if (
      !profileError &&
      currentRole === "payroll_manager" &&
      requiresHrSubmission(pathname)
    ) {
      const workspaceReset =
        request.cookies.get("prodisenyo-workspace-reset")?.value === "true";

      if (workspaceReset) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/upload-attendance";
        redirectUrl.searchParams.set("required", "documents");
        return NextResponse.redirect(redirectUrl);
      }

      const { data: latestImport, error: importError } = await supabase
        .from("attendance_imports")
        .select("id")
        .eq("uploaded_by", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!importError && !latestImport) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/upload-attendance";
        redirectUrl.searchParams.set("required", "documents");
        return NextResponse.redirect(redirectUrl);
      }
    }

    if (!profileError && currentRole === "ceo" && !isAllowedCeoPath(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = CEO_REDIRECT_PATH;
      redirectUrl.searchParams.delete("required");
      return NextResponse.redirect(redirectUrl);
    }

    if (
      !profileError &&
      currentRole === "engineer" &&
      !isAllowedEngineerPath(pathname)
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = ENGINEER_REDIRECT_PATH;
      redirectUrl.searchParams.delete("required");
      return NextResponse.redirect(redirectUrl);
    }

    if (
      !profileError &&
      currentRole === "employee" &&
      !isAllowedEmployeePath(pathname)
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = EMPLOYEE_REDIRECT_PATH;
      redirectUrl.searchParams.delete("required");
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}
