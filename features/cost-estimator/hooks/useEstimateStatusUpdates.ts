import {useEffect,type Dispatch,type SetStateAction} from 'react';
import {getEngineerEstimateNotificationsAction} from '@/actions/costEstimator';
import {sortEstimatesByUpdatedAt} from '../utils/costEstimatorMappers';
import type {ProjectEstimateRow} from '../types';
export function useEstimateStatusUpdates(setEstimates:Dispatch<SetStateAction<ProjectEstimateRow[]>>){
  useEffect(() => {
    let cancelled = false;

    async function loadEstimateNotifications() {
      if (cancelled || document.hidden) return;

      try {
        const response = await getEngineerEstimateNotificationsAction();
        if (cancelled) return;

        const incomingById = new Map(
          response.estimates.map((estimate) => [estimate.id, estimate]),
        );

        setEstimates((current) =>
          sortEstimatesByUpdatedAt(
            current.map((estimate) => {
              const incoming = incomingById.get(estimate.id);
              if (!incoming) return estimate;

              return {
                ...estimate,
                status: incoming.status,
                rejection_reason: incoming.rejection_reason,
                rejected_at: incoming.rejected_at,
                updated_at: incoming.updated_at,
              };
            }),
          ),
        );

      } catch {
        // Keep polling silent during editing so intermittent failures do not disrupt work.
      }
    }

    void loadEstimateNotifications();

    const intervalId = window.setInterval(() => {
      void loadEstimateNotifications();
    }, 30000);

    function handleWindowFocus() {
      void loadEstimateNotifications();
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        void loadEstimateNotifications();
      }
    }

    function handlePageShow() {
      void loadEstimateNotifications();
    }

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [setEstimates]);


}
