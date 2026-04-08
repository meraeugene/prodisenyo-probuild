import { APP_ROLES, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CostCatalogItemRow,
  ProjectEstimateItemRow,
  ProjectEstimateRow,
} from "@/features/cost-estimator/types";
import CostEstimatorPageClient from "@/features/cost-estimator/components/CostEstimatorPageClient";

export default async function CostEstimatorPage() {
  const { user } = await requireRole(APP_ROLES.ENGINEER);
  const supabase = await createSupabaseServerClient();

  const [{ data: estimateData }, { data: catalogData }] = await Promise.all([
    supabase
      .from("project_estimates")
      .select("*")
      .eq("requested_by", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("cost_catalog_items")
      .select("*")
      .order("name", { ascending: true }),
  ]);

  const estimates = (estimateData ?? []) as ProjectEstimateRow[];
  const estimateIds = estimates.map((estimate) => estimate.id);

  let items: ProjectEstimateItemRow[] = [];
  if (estimateIds.length > 0) {
    const { data: itemData } = await supabase
      .from("project_estimate_items")
      .select("*")
      .in("estimate_id", estimateIds)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    items = (itemData ?? []) as ProjectEstimateItemRow[];
  }

  return (
    <CostEstimatorPageClient
      estimates={estimates}
      items={items}
      catalogItems={(catalogData ?? []) as CostCatalogItemRow[]}
    />
  );
}
