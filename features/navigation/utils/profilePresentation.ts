import type { SidebarProfile } from "../types";

export function formatSidebarRole(role: SidebarProfile["role"] | null): string {
  const labels = { gmea: "GMEA", admin: "Administrator", ceo: "Chief Executive Officer", payroll_manager: "Payroll Manager", purchaser: "Purchaser", engineer: "Engineer", employee: "Employee" };
  return role ? labels[role] : "Signed-in user";
}
