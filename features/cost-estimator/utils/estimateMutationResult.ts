import type { EstimateMutationResult } from "../types";

export function requireSuccessfulEstimateMutation(result: EstimateMutationResult) {
  if (!result.success) throw new Error(result.error);
  return result;
}
