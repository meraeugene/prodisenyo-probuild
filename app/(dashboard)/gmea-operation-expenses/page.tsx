import { APP_ROLES, requireRole } from "@/lib/auth";
import { getGmeaOperationExpenses } from "@/features/gmea-operation-expenses/server/operationExpensesQueries";
import OperationExpensesPageClient from "@/features/gmea-operation-expenses/components/OperationExpensesPageClient";

export default async function OperationExpensesPage() {
  const { profile } = await requireRole([APP_ROLES.GMEA, APP_ROLES.CEO]);
  const expenses = await getGmeaOperationExpenses();
  return <OperationExpensesPageClient initialExpenses={expenses} canEdit={profile.role === APP_ROLES.GMEA} />;
}
