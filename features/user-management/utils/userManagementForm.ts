import type { AppRole } from "@/types/database";
export type FormErrors = Partial<
  Record<"fullName" | "username" | "email" | "password" | "role", string>
>;

export const ROLE_OPTIONS: Array<{ value: AppRole; label: string }> = [
  { value: "gmea", label: "GMEA" },
  { value: "admin", label: "Admin" },
  { value: "payroll_manager", label: "Payroll Manager" },
  { value: "purchaser", label: "Purchaser" },
  { value: "engineer", label: "Engineer" },
  { value: "employee", label: "Employee" },
  { value: "ceo", label: "CEO" },
];

export const EMPTY_FORM = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  role: "payroll_manager" as AppRole,
  isActive: true,
};

export function formatRoleLabel(role: AppRole) {
  if (role === "gmea") return "GMEA";
  if (role === "admin") return "Admin";
  if (role === "ceo") return "CEO";
  if (role === "payroll_manager") return "Payroll Manager";
  if (role === "purchaser") return "Purchaser";
  if (role === "employee") return "Employee";
  return "Engineer";
}

export type UserForm = typeof EMPTY_FORM;
