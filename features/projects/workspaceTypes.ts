import type { ProjectMaterialRequest } from "@/features/material-approvals/types";
import type { ProjectDocumentRecord } from "@/features/project-documents/types";
import type {
  ProjectExpenseRecord,
  ProjectMaterialReceipt,
  ProjectPurchaseOrder,
} from "@/features/project-cost-tracking/types";
import type { ProjectProgressUpdateRecord } from "./progressUpdateTypes";

import type {ProjectEstimateItemRow,ReviewProjectEstimateRow} from '@/features/cost-estimator/types';
import type {ProjectRecord} from './types';
export type Activity = {
  id: string;
  activity: string;
  weight_percent: number;
  progress_percent: number;
  created_at?: string;
  updated_at?: string;
};
export type Estimate = ReviewProjectEstimateRow;
export type ProgressSubmission = { id: string; activity_count: number; submitted_at: string };
export type MaterialRequestActivity = ProjectMaterialRequest;
export type BudgetItem = {
  id: string;
  name: string;
  category: string;
  estimated_cost: number;
  actual_spent: number;
  status: string;
};
export type WorkspaceData = {
  activities: Activity[];
  estimates: Estimate[];
  estimateItems: ProjectEstimateItemRow[];
  budgetItems: BudgetItem[];
  progressSubmissions: ProgressSubmission[];
  materialRequests: MaterialRequestActivity[];
  progressUpdates: ProjectProgressUpdateRecord[];
  documents?: ProjectDocumentRecord[];
  projectExpenses?: ProjectExpenseRecord[];
  purchaseOrders?: ProjectPurchaseOrder[];
  materialReceipts?: ProjectMaterialReceipt[];
};


export interface ProjectWorkspaceProps {
  project: ProjectRecord;
  currentUserId: string;
  canUpdateProgress: boolean;
  canCreateEstimate: boolean;
  canReviewEstimates: boolean;
  activities: Activity[];
  estimates: Estimate[];
  estimateItems: ProjectEstimateItemRow[];
  budgetItems: BudgetItem[];
  progressSubmissions: ProgressSubmission[];
  materialRequests: MaterialRequestActivity[];
  progressUpdates: ProjectProgressUpdateRecord[];
  documents: ProjectDocumentRecord[];
  projectExpenses: ProjectExpenseRecord[];
  purchaseOrders: ProjectPurchaseOrder[];
  materialReceipts: ProjectMaterialReceipt[];
}
