"use client";

import { cn } from "@/lib/utils";
import {
  formatEstimateStatusLabel,
  getEstimateStatusBadgeClass,
} from "@/features/cost-estimator/utils/costEstimatorFormatters";
import type { EstimateStatus } from "@/types/database";

export default function EstimateStatusBadge({
  status,
}: {
  status: EstimateStatus;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded border px-2 py-1 text-[11px] font-medium",
        getEstimateStatusBadgeClass(status),
      )}
    >
      {formatEstimateStatusLabel(status)}
    </span>
  );
}
