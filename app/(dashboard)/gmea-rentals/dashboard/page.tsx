import { redirect } from "next/navigation";
import { APP_ROLES, requireRole } from "@/lib/auth";

export default async function GmeaRentalsDashboardRoute() {
  await requireRole([APP_ROLES.GMEA, APP_ROLES.CEO]);
  redirect("/gmea-rentals");
}
