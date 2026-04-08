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
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        getEstimateStatusBadgeClass(status),
      )}
    >
      {formatEstimateStatusLabel(status)}
    </span>
  );
}
