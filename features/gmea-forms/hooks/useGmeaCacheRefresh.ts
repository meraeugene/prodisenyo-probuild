"use client";

import { useSWRConfig } from "swr";
import { toast } from "sonner";
import type { GmeaInputOptions, GmeaInputValues } from "@/features/gmea-inputs/types";
import { addGmeaInputValues } from "@/features/gmea-inputs/utils/gmeaInputOptions";

type GmeaCacheKey = string | readonly string[];

/** Refresh views after a confirmed write without keeping the entry dialog busy. */
export function useGmeaCacheRefresh() {
  const { mutate } = useSWRConfig();
  return (keys: GmeaCacheKey[], savedInputs?: GmeaInputValues) => {
    const refreshes = keys.map(key => () => mutate(key));
    if (savedInputs && Object.values(savedInputs).some(value => value?.trim())) {
      refreshes.unshift(async () => {
        let hasCachedOptions = false;
        await mutate<GmeaInputOptions>("gmea-input-options", current => {
          hasCachedOptions = Boolean(current);
          return current ? addGmeaInputValues(current, savedInputs) : undefined;
        }, { revalidate: false });
        // If the initial options have not loaded, fetch them instead of replacing
        // the user's existing suggestions with only the newly entered values.
        if (!hasCachedOptions) await mutate("gmea-input-options");
      });
    }
    void Promise.allSettled(refreshes.map(run => Promise.resolve().then(run)))
      .then(results => {
        if (results.some(result => result.status === "rejected")) {
          toast.warning("Changes were saved, but some data could not refresh. Reload to see the latest records.", {
            id: "gmea-refresh-failed",
          });
        }
      });
  };
}
