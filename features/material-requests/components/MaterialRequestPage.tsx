import { APP_ROLES, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import MaterialRequestPageClient from "@/features/material-requests/components/MaterialRequestPageClient";
import { parseMaterialRequestPayload } from "@/features/material-requests/utils/materialRequestMappers";
import type { MaterialRequestRecord } from "@/features/material-requests/types";

export default async function MaterialRequestPage() {
  const { user } = await requireRole(APP_ROLES.ENGINEER);
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("audit_logs")
    .select("id, entity_id, payload, created_at")
    .eq("actor_id", user.id)
    .eq("entity_type", "material_request")
    .eq("action", "material_request_created")
    .order("created_at", { ascending: false })
    .limit(20);

  const initialRequests: MaterialRequestRecord[] = (data ?? [])
    .map((row) =>
      parseMaterialRequestPayload({
        id: row.id,
        requestId: row.entity_id,
        payload: row.payload,
        createdAt: row.created_at,
      }),
    )
    .filter((row): row is MaterialRequestRecord => row !== null);

  return <MaterialRequestPageClient initialRequests={initialRequests} />;
}
