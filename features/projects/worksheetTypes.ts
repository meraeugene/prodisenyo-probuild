import type { EngineeringProgressActivityRecord } from './utils/engineeringWorkspace';
import type { ImportedProgressActivity } from './utils/engineeringProgressImport';

export interface ProgressDraftActivity extends EngineeringProgressActivityRecord {
  isDraft?: boolean;
}

export interface EngineeringProgressWorksheetProps {
  activities: EngineeringProgressActivityRecord[];
  readOnly?: boolean;
  isSubmitting?: boolean;
  onSubmitProgress?: (activities: ImportedProgressActivity[]) => void;
}

export interface ActivityFormState {
  activity: string;
  weightPercent: string;
  progressPercent: string;
}

export type ConfirmState =
  | { type: "delete-one"; activity: ProgressDraftActivity }
  | { type: "delete-all" }
  | null;

export type ActivityFormErrors = Partial<
  Record<"activity" | "weightPercent" | "progressPercent", string>
>;

export const emptyForm: ActivityFormState = {
  activity: "",
  weightPercent: "",
  progressPercent: "",
};

