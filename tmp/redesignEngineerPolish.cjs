const fs=require('node:fs');
const read=file=>fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
const write=(file,text)=>fs.writeFileSync(file,text);
// Match the remaining engineer panels to the shared compact surfaces.
for(const file of [
 'features/cost-estimator/components/CostEstimatorDraftSidebar.tsx','features/cost-estimator/components/CostEstimatorDraftTable.tsx',
 'features/cost-estimator/components/CostEstimatorBoqTable.tsx','features/cost-estimator/components/CostEstimatorItemSummary.tsx',
 'features/cost-estimator/components/CostEstimatorItemFields.tsx','features/cost-estimator/components/CostEstimatorMaterialFields.tsx',
 'features/projects/components/EngineerProjectOverview.tsx','features/projects/components/ProjectMaterialsPanel.tsx',
 'features/projects/components/PlannedMaterialsSection.tsx','features/projects/components/ProjectProgressSummary.tsx',
 'features/projects/components/ProjectProgressUpdateList.tsx','features/projects/components/ProgressWorksheetTable.tsx',
 'features/projects/components/ProgressWorksheetEditor.tsx','features/projects/components/ProgressWorksheetParts.tsx',
 'features/project-documents/components/ProjectDocumentsPanel.tsx','features/project-activity-log/components/ProjectActivityLogPanel.tsx',
 'features/project-cost-tracking/components/CostTrackingBoard.tsx','features/project-cost-tracking/components/CostTrackingSummary.tsx',
 'features/settings/components/SettingsProfileSection.tsx','features/settings/components/SettingsPasswordSection.tsx',
 'features/material-requests/components/MaterialRequestQueue.tsx',
]){
 let text=read(file);
 text=text.replace(/rounded-(?:2xl|xl|lg)\b/g,'rounded-[7px]').replace(/rounded-\[(?:12|13|14|16|18|20|22|24|28)px\]/g,'rounded-[7px]');
 text=text.replace(/\bshadow-workspace\b/g,'shadow-none').replace(/\bshadow-sm\b/g,'shadow-none').replace(/\bborder-transparent\b/g,'border-[#e4e7ec]');
 text=text.replace(/text-\[(?:20|22|25)px\]/g,'text-[15px]').replace(/\btext-xl\b/g,'text-[15px]').replace(/\btext-lg\b/g,'text-[15px]');
 text=text.replace(/\bh-11\b/g,'h-9');
 write(file,text);
}
// Keep compact forms label-first without oversized section names.
for(const file of ['features/material-requests/components/MaterialRequestForm.tsx','features/material-requests/utils/materialRequestPresentation.ts']) {
 let text=read(file).replace(/\bh-11\b/g,'h-9').replace(/\brounded-xl\b/g,'rounded-[5px]').replace(/text-sm font-semibold/g,'text-[13px] font-medium');write(file,text);
}
// Align the project tabs to the same bordered panel treatment as lists.
let text=read('features/projects/components/ProjectWorkspaceTabs.tsx');
text=text.replace('import WorkspaceTabSwitch','import styles from "@/components/workspace/workspace.module.css";\nimport WorkspaceTabSwitch');
text=text.replace('  return <WorkspaceTabSwitch','  return <div className={`${styles.panel} p-3`}><WorkspaceTabSwitch').replace('className="capitalize" />;','className="capitalize" /></div>;');
write('features/projects/components/ProjectWorkspaceTabs.tsx',text);
// Clean up imports left over from splitting the material fields.
text=read('features/cost-estimator/components/CostEstimatorItemFields.tsx').replace('import { Plus, Trash2 }','import { Plus }').replace('  parseBudgetNumberInput,\n','').replace('  formatBudgetMoney,\n','').replace('  EstimateItemModalMaterialForm,\n','');write('features/cost-estimator/components/CostEstimatorItemFields.tsx',text);
text=read('features/cost-estimator/components/CostEstimatorMaterialFields.tsx').replace('import { Plus, Trash2 }','import { Trash2 }');write('features/cost-estimator/components/CostEstimatorMaterialFields.tsx',text);
text=read('features/projects/components/ProgressWorksheetTable.tsx').replace('state,readOnly=false,isSubmitting=false','state,readOnly=false');write('features/projects/components/ProgressWorksheetTable.tsx',text);
// Bring the retained notifications into a small hook; polling still updates statuses silently.
text=read('features/cost-estimator/hooks/useCostEstimatorPage.ts');
const start=text.indexOf('  useEffect(() => {\n    let cancelled = false;'),end=text.indexOf('\n  }, []);',start)+12;
const notificationEffect=text.slice(start,end);
if(start<0||end<start)throw new Error('Notification hook markers');
fs.writeFileSync('features/cost-estimator/hooks/useEstimateStatusUpdates.ts',`import {useEffect,type Dispatch,type SetStateAction} from 'react';\nimport {getEngineerEstimateNotificationsAction} from '@/actions/costEstimator';\nimport {sortEstimatesByUpdatedAt} from '../utils/costEstimatorMappers';\nimport type {ProjectEstimateRow} from '../types';\nexport function useEstimateStatusUpdates(setEstimates:Dispatch<SetStateAction<ProjectEstimateRow[]>>){\n${notificationEffect}\n}\n`);
text=text.slice(0,start)+'  useEstimateStatusUpdates(setEstimates);'+text.slice(end);
text=text.replace('  getEngineerEstimateNotificationsAction,\n','').replace('import {','import {',1).replace('"use client";','"use client";\nimport {useEstimateStatusUpdates} from "./useEstimateStatusUpdates";');
write('features/cost-estimator/hooks/useCostEstimatorPage.ts',text);
