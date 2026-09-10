export interface ProjectProgressUpdateRecord {
  id: string;
  project_id: string;
  submitted_by: string;
  overall_percent: number;
  completed_work_summary: string;
  remarks: string | null;
  progress_date: string;
  created_at: string;
}

export interface CreateProjectProgressUpdateInput {
  projectId: string;
  overallPercent: number;
  completedWorkSummary: string;
  remarks?: string;
  progressDate?: string;
}

export interface UpdateProjectProgressUpdateInput extends CreateProjectProgressUpdateInput {
  updateId: string;
}
