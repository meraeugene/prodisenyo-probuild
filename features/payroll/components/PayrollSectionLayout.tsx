import type { ReactNode } from "react";
import { getCurrentProfile } from "@/lib/auth";
import PayrollSectionNavigation from "./PayrollSectionNavigation";

export default async function PayrollSectionLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "ceo") return children;

  return (
    <div>
      <div className="px-4 pt-4 sm:px-6 lg:px-8"><PayrollSectionNavigation /></div>
      {children}
    </div>
  );
}
