import { APP_ROLES, requireRole } from "@/lib/auth";
import UserManagementPageClient from "@/features/user-management/components/UserManagementPageClient";
import { listManagedUsers } from "@/features/user-management/userManagementQueries";

export default async function AddUserPage() {
  const { user } = await requireRole(APP_ROLES.ADMIN);
  const users = await listManagedUsers();

  return (
    <UserManagementPageClient
      initialUsers={users}
      currentUserId={user.id}
    />
  );
}
