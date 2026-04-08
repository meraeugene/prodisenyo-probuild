import { APP_ROLES, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import EstimateReviewsPageClient from "@/features/cost-estimator/components/EstimateReviewsPageClient";
import type {
  ProjectEstimateItemRow,
  ProjectEstimateRow,
} from "@/features/cost-estimator/types";

export default async function EstimateReviewsPage() {
  await requireRole(APP_ROLES.CEO);
  const supabase = await createSupabaseServerClient();

  const { data: estimateData } = await supabase
    .from("project_estimates")
    .select("*")
    .neq("status", "draft")
    .order("updated_at", { ascending: false });

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

  return <EstimateReviewsPageClient estimates={estimates} items={items} />;
}
