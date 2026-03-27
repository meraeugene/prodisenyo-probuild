export type AppUserRole = "admin" | "employee";

export interface SessionUser {
  id: string;
  username: string;
  fullName: string;
  role: AppUserRole;
}
