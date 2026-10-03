export type ProjectStatus = "planning" | "active" | "completed" | "on_hold";

export interface ProjectRecord {
  id: string;
  name: string;
  location: string;
  client: string;
  subject?: string;
  lead?: string;
  status: ProjectStatus;
  budget: number;
  spent: number;
  progress: number; // percentage
  startDate: string;
  endDate: string;
  manager: string;
  engineer: string;
  assignedEngineerId?: string | null;
  estimateEngineer?: string;
  assignedEstimateEngineerId?: string | null;
  activeApprovedEstimateId?: string | null;
  imageUrl?: string | null;
  tasksCount: number;
  completedTasksCount: number;
  materialsCount: number;
  description: string;
}

export interface EngineerOption {
  id: string;
  name: string;
}

export type ProjectField =
  | "name"
  | "location"
  | "subject"
  | "lead"
  | "estimateEngineerId"
  | "image"
  | "budget"
  | "startDate"
  | "endDate";

export type FormErrors = Partial<Record<ProjectField, string>>;
