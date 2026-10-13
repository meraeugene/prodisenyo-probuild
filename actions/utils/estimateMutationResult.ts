import "server-only";
import type { EstimateMutationResult, ProjectEstimateItemRow, ProjectEstimateRow } from "@/features/cost-estimator/types";

export class EstimateMutationError extends Error {}

export async function runEstimateMutation(operation: string, fallbackMessage: string, mutation: () => Promise<{ estimate: ProjectEstimateRow; items: ProjectEstimateItemRow[] }>): Promise<EstimateMutationResult> {
  try {
    return { success: true, ...await mutation() };
  } catch (error) {
    if (error instanceof EstimateMutationError) return { success: false, error: error.message };
    console.error(`[cost-estimator:${operation}]`, error);
    return { success: false, error: fallbackMessage };
  }
}
