import { sortProgressActivities, type EngineeringProgressActivityRecord } from './engineeringWorkspace';
import type { ActivityFormState, ActivityFormErrors, ProgressDraftActivity } from '../worksheetTypes';

export function parsePercent(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function validateForm(form: ActivityFormState) {
  const weightPercent = parsePercent(form.weightPercent);
  const progressPercent = parsePercent(form.progressPercent);
  const errors: ActivityFormErrors = {};

  if (!form.activity.trim()) errors.activity = "Activity is required.";
  if (Number.isNaN(weightPercent) || weightPercent <= 0 || weightPercent > 100) {
    errors.weightPercent = "% WT must be greater than 0 and no more than 100.";
  }
  if (Number.isNaN(progressPercent) || progressPercent < 0 || progressPercent > 100) {
    errors.progressPercent = "Progress must be between 0 and 100.";
  }
  return errors;
}

export function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

export function buildDraftRows(activities: EngineeringProgressActivityRecord[]): ProgressDraftActivity[] {
  return sortProgressActivities(activities).map((activity) => ({ ...activity }));
}

export function buildClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `progress-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function buildActivitySignature(
  activities: Array<Pick<ProgressDraftActivity, "id" | "activity" | "weightPercent" | "progressPercent" | "updatedAt">>,
) {
  return activities
    .map(
      (activity) =>
        `${activity.id}:${activity.activity}:${activity.weightPercent}:${activity.progressPercent}:${activity.updatedAt}`,
    )
    .join("|");
}

