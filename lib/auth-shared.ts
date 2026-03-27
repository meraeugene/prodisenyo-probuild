export const AUTH_COOKIE_NAME =
  process.env.APP_SESSION_COOKIE_NAME || "prodisenyo_session";

export const AUTH_PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/upload-attendance",
  "/review-attendance",
  "/generate-payroll",
  "/attendance-analytics",
  "/payroll-analytics",
  "/settings",
  "/saved-payrolls",
];

export function isProtectedPath(pathname: string) {
  return AUTH_PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
