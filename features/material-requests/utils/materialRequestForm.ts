import type {CreateMaterialRequestInput, MaterialRequestPriority} from '../types';
export const PRIORITY_OPTIONS: Array<{
  value: MaterialRequestPriority;
  label: string;
}> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const EMPTY_FORM: CreateMaterialRequestInput = {
  projectId: "",
  projectName: "",
  materialName: "",
  quantity: 1,
  unit: "pcs",
  neededBy: "",
  site: "",
  priority: "medium",
  notes: "",
};

export type MaterialFormErrors = Partial<
  Record<keyof CreateMaterialRequestInput, string>
>;

