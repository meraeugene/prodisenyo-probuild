import { redirect } from "next/navigation";
import { APP_ROLES, requireRole } from "@/lib/auth";
export default async function NewRentalPage() {
  await requireRole(APP_ROLES.GMEA);
  redirect("/gmea-rentals");
}
