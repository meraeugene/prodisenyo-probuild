import type {Activity} from '../workspaceTypes';
import type {EngineeringProgressActivityRecord} from './engineeringWorkspace';
export function mapActivity(projectName: string, activity: Activity): EngineeringProgressActivityRecord {
  return {
    id: activity.id,
    projectName,
    activity: activity.activity,
    weightPercent: Number(activity.weight_percent),
    progressPercent: Number(activity.progress_percent),
    createdAt: activity.created_at ?? activity.id,
    updatedAt: activity.updated_at ?? activity.created_at ?? activity.id,
  };
}

