import "server-only";
import { APP_ROLES, requireRole } from "@/lib/auth";
import type { GmeaExpenseOptions, GmeaProject } from "../types";
import { gmeaReader, type DataRow } from "./gmeaDatabase";
import { readAllGmeaRows } from "./readAllGmeaRows";

export async function requireGmeaAccess(write = false) {
  const auth = await requireRole(
    write ? APP_ROLES.GMEA : [APP_ROLES.GMEA, APP_ROLES.CEO],
  );
  if (!auth.profile.is_active) throw new Error("This account is inactive.");
  return auth;
}

function unpack(rows: DataRow[]) {
  return [...rows]
    .sort(
      (left, right) =>
        Number(left.data.sort_order ?? 0) -
        Number(right.data.sort_order ?? 0),
    )
    .map((row) => ({ ...row.data, id: row.id }));
}

export async function getGmeaProjects(id?: string): Promise<GmeaProject[]> {
  const { user, profile } = await requireGmeaAccess();
  const db = await gmeaReader();
  const projects = await readAllGmeaRows((from, to) => {
    const query = db
      .from("gmea_projects")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, to);
    return id ? query.eq("id", id) : query;
  });
  const output: GmeaProject[] = [];

  for (let offset = 0; offset < projects.length; offset += 100) {
    const batch = projects.slice(offset, offset + 100);
    const ids = batch.map((project) => project.id);
    const [expenses, collections, partners, notifications] = await Promise.all([
      readAllGmeaRows((from, to) =>
        db
          .from("gmea_expenses")
          .select("*")
          .in("project_id", ids)
          .order("created_at")
          .order("id")
          .range(from, to),
      ),
      readAllGmeaRows((from, to) =>
        db
          .from("gmea_collections")
          .select("*")
          .in("project_id", ids)
          .order("created_at")
          .order("id")
          .range(from, to),
      ),
      readAllGmeaRows((from, to) =>
        db
          .from("gmea_partners")
          .select("*")
          .in("project_id", ids)
          .order("created_at")
          .order("id")
          .range(from, to),
      ),
      profile.role === APP_ROLES.CEO
        ? readAllGmeaRows((from, to) =>
            db
              .from("gmea_expense_notifications")
              .select("*")
              .eq("recipient_id", user.id)
              .is("read_at", null)
              .in("project_id", ids)
              .order("created_at")
              .order("id")
              .range(from, to),
          )
        : Promise.resolve([]),
    ]);

    const unreadExpenseIds = new Set(
      notifications.map((notification) => notification.expense_id),
    );

    output.push(
      ...(batch.map((project) => ({
        ...project,
        contract_amount: Number(project.contract_amount),
        expenses: unpack(
          expenses.filter((row) => row.project_id === project.id),
        ).map((expense) => ({
          ...expense,
          is_new: unreadExpenseIds.has(String(expense.id)),
        })),
        collections: unpack(
          collections.filter((row) => row.project_id === project.id),
        ),
        partners: unpack(
          partners.filter((row) => row.project_id === project.id),
        ),
      })) as unknown as GmeaProject[]),
    );
  }
  return output;
}

export async function getGmeaExpenseOptions(): Promise<GmeaExpenseOptions> {
  await requireGmeaAccess();
  const db = await gmeaReader();
  const rows = await readAllGmeaRows((from, to) =>
    db
      .from("gmea_expense_options")
      .select("*")
      .order("value")
      .range(from, to),
  );
  const values = (field: string) =>
    rows
      .filter((row) => row.field === field)
      .map((row) => row.value)
      .filter(Boolean);
  return {
    suppliers: values("supplier"),
    methods: values("method"),
    invoiceNames: values("invoice_name"),
  };
}
