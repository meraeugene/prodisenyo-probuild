import "server-only";
import { APP_ROLES, requireRole } from "@/lib/auth";
import type { GmeaProject } from "../types";
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
  return [...rows].sort((a,b) => Number(a.data.sort_order ?? 0) - Number(b.data.sort_order ?? 0)).map((row) => ({ ...row.data, id: row.id }));
}
export async function getGmeaProjects(id?: string): Promise<GmeaProject[]> {
  await requireGmeaAccess();
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
  // Keep filters small enough for PostgREST URLs while loading every financial row.
  for (let offset = 0; offset < projects.length; offset += 100) {
    const batch = projects.slice(offset, offset + 100),
      ids = batch.map((p) => p.id);
    const [quotes, milestones, receipts, expenses, partners] =
      await Promise.all([
        readAllGmeaRows((from, to) =>
          db
            .from("gmea_quotations")
            .select("*")
            .in("project_id", ids)
            .order("created_at")
            .order("id")
            .range(from, to),
        ),
        readAllGmeaRows((from, to) =>
          db
            .from("gmea_milestones")
            .select("*")
            .in("project_id", ids)
            .order("created_at")
            .order("id")
            .range(from, to),
        ),
        readAllGmeaRows((from, to) =>
          db
            .from("gmea_receipts")
            .select("*")
            .in("project_id", ids)
            .order("created_at")
            .order("id")
            .range(from, to),
        ),
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
            .from("gmea_partners")
            .select("*")
            .in("project_id", ids)
            .order("created_at")
            .order("id")
            .range(from, to),
        ),
      ]);
    const itemBatches = [];
    for (let i = 0; i < quotes.length; i += 100) {
      const quoteIds = quotes.slice(i, i + 100).map((q) => q.id);
      itemBatches.push(
        await readAllGmeaRows((from, to) =>
          db
            .from("gmea_quotation_items")
            .select("*")
            .in("quotation_id", quoteIds)
            .order("sort_order")
            .order("id")
            .range(from, to),
        ),
      );
    }
    const items = itemBatches.flat();
    output.push(
      ...(batch.map((project) => ({
        ...project,
        quotations: quotes
          .filter((q) => q.project_id === project.id)
          .map((q) => ({
            ...q.data,
            id: q.id,
            project_id: q.project_id,
            status: q.status,
            total: Number(q.total),
            items: items
              .filter((i) => i.quotation_id === q.id)
              .map((i) => ({
                ...i,
                quantity: Number(i.quantity),
                unit_price: Number(i.unit_price),
              })),
          })),
        milestones: unpack(
          milestones.filter((r) => r.project_id === project.id),
        ),
        receipts: unpack(receipts.filter((r) => r.project_id === project.id)),
        expenses: unpack(expenses.filter((r) => r.project_id === project.id)),
        partners: unpack(partners.filter((r) => r.project_id === project.id)),
      })) as unknown as GmeaProject[]),
    );
  }
  return output;
}
