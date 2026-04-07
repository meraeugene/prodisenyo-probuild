import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/auth/login",
    "/dashboard/:path*",
    "/upload-attendance/:path*",
    "/budget-tracker/:path*",
    "/review-attendance/:path*",
    "/generate-payroll/:path*",
    "/overtime-approvals/:path*",
    "/attendance-analytics/:path*",
    "/payroll-analytics/:path*",
    "/payroll-reports/:path*",
    "/settings/:path*",
  ],
};
