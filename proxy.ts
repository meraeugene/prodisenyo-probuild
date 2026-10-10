import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/auth/login",
    "/home/:path*",
    "/dashboard/:path*",
    "/payroll-dashboard/:path*",
    "/payroll-workspace/:path*",
    "/overview/:path*",
    "/upload-attendance/:path*",
    "/budget-tracker/:path*",
    "/projects/:path*",
    "/gmea-projects/:path*",
    "/gmea-projects/summary/:path*", // Clickable project financial cards (CEO/GMEA).
    "/gmea-rentals/:path*",
    "/gmea-overview/:path*", // Protect legacy links before redirecting to Projects.
    "/cost-estimator/:path*",
    "/estimate-approvals/:path*",
    "/estimate-reviews/:path*",
    "/review-attendance/:path*",
    "/generate-payroll/:path*",
    "/overtime-approvals/:path*",
    "/add-user/:path*",
    "/request-material/:path*",
    "/request-overtime/:path*",
    "/reset-data/:path*",
    "/attendance-analytics/:path*",
    "/payroll-analytics/:path*",
    "/payroll-change/:path*",
    "/payroll-approvals/:path*",
    "/payroll-reports/:path*",
    "/purchasing-approvals/:path*",
    "/purchaser-dashboard/:path*",
    "/settings/:path*",
  ],
};
