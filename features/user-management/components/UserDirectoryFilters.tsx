import WorkspaceListToolbar from "@/components/workspace/WorkspaceListToolbar";
import styles from "@/components/workspace/workspace.module.css";
import { ROLE_OPTIONS } from "../utils/userManagementForm";
import type { ManagedUserRow } from "../types";

export default function UserDirectoryFilters({ users, query, role, status, onQueryChange, onRoleChange, onStatusChange }: {
  users: ManagedUserRow[]; query: string; role: string; status: string;
  onQueryChange: (value: string) => void; onRoleChange: (value: string) => void; onStatusChange: (value: string) => void;
}) {
  return <WorkspaceListToolbar tabs={[
    { value: "all", label: "All accounts", count: users.length },
    { value: "active", label: "Active", count: users.filter((user) => user.is_active).length },
    { value: "inactive", label: "Inactive", count: users.filter((user) => !user.is_active).length },
  ]} tab={status} onTabChange={onStatusChange} query={query} onQueryChange={onQueryChange}
    searchLabel="Search users" placeholder="Search name, username or email" hasFilters={Boolean(query || role !== "all" || status !== "all")}
    onReset={() => { onQueryChange(""); onRoleChange("all"); onStatusChange("all"); }}>
    <label className={styles.field}>Role<select aria-label="Filter users by role" className={styles.control} value={role} onChange={(event) => onRoleChange(event.target.value)}>
      <option value="all">All roles</option>{ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select></label>
  </WorkspaceListToolbar>;
}
