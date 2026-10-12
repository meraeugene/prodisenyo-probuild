const fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
const write=(file,text)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text)};
const replace=(text,a,b)=>{if(!text.includes(a))throw new Error('Missing '+a);return text.replace(a,b)};
let text=read('features/cost-estimator/components/CostEstimatorDraftWorkspace.tsx');
text=replace(text,'import styles from','import WorkspacePageHeader from "@/components/workspace/WorkspacePageHeader";\nimport WorkspaceSummaryCards from "@/components/WorkspaceSummaryCards";\nimport EstimateProjectFacts from "./EstimateProjectFacts";\nimport styles from');
const headerStart=text.indexOf('      <header '),factsEnd=text.indexOf('\n      <section aria-label="Estimate totals"',headerStart);
text=text.slice(0,headerStart)+`      <button type="button" onClick={onBack} disabled={disabled} className="inline-flex items-center gap-2 text-xs font-medium text-[#076d69] hover:underline"><ArrowLeft size={14} aria-hidden="true"/>Back to cost estimator</button>
      <WorkspacePageHeader eyebrow="Engineer / Cost estimator / Draft" title="Prepare estimate" description={\`Build the Bill of Quantities for \${form.projectName}.\`}
        actions={<><button type="button" onClick={onSave} disabled={disabled} className={styles.button}><Save size={14} aria-hidden="true"/>Save Draft</button><button type="button" onClick={onSubmit} disabled={disabled} className={styles.primaryButton}>{submitting?<LoaderCircle size={14} className="animate-spin" aria-hidden="true"/>:<Send size={14} aria-hidden="true"/>}{submitting?'Submitting...':'Submit to CEO'}</button></>}/>
      <EstimateProjectFacts facts={[{label:'Project type',value:formatProjectTypeLabel(form.projectType||null)},{label:'Location',value:form.location||'Not recorded'},{label:'Owner',value:form.ownerName||'Not recorded'},{label:'Budget ceiling',value:budgetCeiling===null?'Not recorded':formatBudgetMoney(budgetCeiling)},{label:'Date',value:draftedDate?new Intl.DateTimeFormat('en-PH',{dateStyle:'medium'}).format(new Date(draftedDate)):'Not recorded'},{label:'Status',value:'Draft'}]}/>
`+text.slice(factsEnd);
const metricStart=text.indexOf('      <section aria-label="Estimate totals"'),metricEnd=text.indexOf('\n      <div className="grid items-start',metricStart);
text=text.slice(0,metricStart)+`      <WorkspaceSummaryCards ariaLabel="Estimate totals" className="grid-cols-2 xl:grid-cols-5" cards={[{label:'BOQ items',value:boqItemCount},{label:'Materials',value:formatBudgetMoney(categoryTotal('materials'))},{label:'Labor',value:formatBudgetMoney(categoryTotal('labor'))},{label:'Equipment',value:formatBudgetMoney(categoryTotal('equipment'))},{label:'Total estimate',value:formatBudgetMoney(total)}]}/>
`+text.slice(metricEnd);
const toolbarStart=text.indexOf('          <div className="flex flex-wrap'),toolbarEnd=text.indexOf('          <CostEstimatorDraftTable',toolbarStart);
text=text.slice(0,toolbarStart)+`          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500" aria-live="polite">{saveMessage}</p><button type="button" onClick={onDeleteDraft} disabled={disabled} className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 hover:underline"><Trash2 size={14} aria-hidden="true"/>Delete Draft</button></div>
`+text.slice(toolbarEnd);
text=text.slice(0,text.indexOf('\nfunction Fact(')).replace('import { cn } from "@/lib/utils";\n','');
write('features/cost-estimator/components/CostEstimatorDraftWorkspace.tsx',text);

// Use the shared confirmation for progress deletion.
text=read('features/projects/components/ProjectProgressUpdateDeleteDialog.tsx');
text=text.replace('import { LoaderCircle, Trash2 } from "lucide-react";','import WorkspaceConfirmDialog from "@/components/workspace/WorkspaceConfirmDialog";');
text=text.slice(0,text.indexOf('  return ('))+`  return <WorkspaceConfirmDialog title="Delete progress update?" description="This permanently removes the progress entry and cannot be undone." confirmLabel={pending?'Deleting...':'Delete update'} danger pending={pending} onConfirm={confirmDelete} onClose={onClose}><p className="rounded bg-slate-50 p-3 text-sm text-slate-700">{update.completed_work_summary}</p></WorkspaceConfirmDialog>;\n}\n`;
write('features/projects/components/ProjectProgressUpdateDeleteDialog.tsx',text);

// Replace the document browser confirmation while keeping its server action.
text=read('features/project-documents/components/ProjectDocumentsPanel.tsx');
text=text.replace('import { toast }','import WorkspaceConfirmDialog from "@/components/workspace/WorkspaceConfirmDialog";\nimport { toast }');
text=text.replace('  const inputRef =','  const [deleteDocument, setDeleteDocument] = useState<ProjectDocumentRecord | null>(null);\n  const inputRef =');
text=text.replace('    if (!window.confirm(`Delete ${document.file_name}? This cannot be undone.`)) return;\n','');
text=text.replace('.finally(() => setActiveDocumentId(null));\n  }\n\n  return', '.finally(() => { setActiveDocumentId(null); setDeleteDocument(null); });\n  }\n\n  return');
text=text.replace('onClick={() => remove(document)}','onClick={() => setDeleteDocument(document)}');
const close=text.lastIndexOf('    </section>');
text=text.slice(0,close)+`      <WorkspaceConfirmDialog open={deleteDocument!==null} title="Delete document?" description={\`Permanently remove \${deleteDocument?.file_name??'this document'}? This cannot be undone.\`} confirmLabel="Delete document" danger pending={activeDocumentId===deleteDocument?.id} onClose={()=>setDeleteDocument(null)} onConfirm={()=>{if(deleteDocument)remove(deleteDocument)}}/>\n`+text.slice(close);
write('features/project-documents/components/ProjectDocumentsPanel.tsx',text);

// Extract workspace data orchestration from the route-level client.
text=read('features/projects/components/ProjectWorkspaceClient.tsx');
const typeStart=text.indexOf('type Activity =');
const mapperStart=text.indexOf('function mapActivity');
const componentStart=text.indexOf('export default function');
const stateStart=text.indexOf('  const router =');
const jsxStart=text.indexOf('  return (\n    <div className="min-h-full',stateStart);
const propTypeStart=text.indexOf('}: {',componentStart)+4;
const propTypeEnd=text.indexOf('}) {',propTypeStart);
const typeImports=text.slice(text.indexOf('import type { ProjectMaterialRequest'),text.indexOf('import CeoProjectOverview')).split('\n').filter(line=>!line.startsWith('import { buildPlanned')&&!line.startsWith('import ProjectDocuments')&&!line.startsWith('import ProjectActivityLog')&&!line.startsWith('import ProjectCostTracking')).join('\n');
write('features/projects/workspaceTypes.ts',`${typeImports}\nimport type {ProjectEstimateItemRow,ReviewProjectEstimateRow} from '@/features/cost-estimator/types';\nimport type {ProjectRecord} from './types';\n${text.slice(typeStart,mapperStart).replace(/type /g,'export type ')}\nexport interface ProjectWorkspaceProps {${text.slice(propTypeStart,propTypeEnd)}}\n`);
write('features/projects/utils/projectWorkspaceMappers.ts',`import type {Activity} from '../workspaceTypes';\nimport type {EngineeringProgressActivityRecord} from './engineeringWorkspace';\nexport ${text.slice(mapperStart,componentStart)}`);
const stateNames='tabs,tab,switchTab,isSubmittingProgress,pendingEstimateAction,returnEstimateId,setReturnEstimateId,returnReason,setReturnReason,activeEstimateId,setActiveEstimateId,workspaceState,liveActivities,liveEstimates,liveEstimateItems,liveBudgetItems,liveProgressSubmissions,liveMaterialRequests,liveProgressUpdates,liveDocuments,liveProjectExpenses,livePurchaseOrders,liveMaterialReceipts,plannedMaterials,activityRows,activeEstimate,activeEstimateItems,submitProgress,approveEstimate,confirmReturnEstimate';
const destructured=text.slice(text.indexOf('({',componentStart)+2,text.indexOf('}: {',componentStart));
const hookState=text.slice(stateStart,jsxStart).replace('  const router = useRouter();\n','');
write('features/projects/hooks/useProjectWorkspace.ts',`import {useState} from 'react';\nimport useSWR from 'swr';\nimport {toast} from 'sonner';\nimport {rejectProjectEstimateAction} from '@/actions/costEstimator';\nimport {approveProjectEstimateWithBaselineAction} from '@/actions/estimateProcurement';\nimport {getProjectWorkspaceDataAction,submitProjectProgressAction} from '@/actions/projects';\nimport {buildPlannedMaterialRows} from '@/features/material-requests/utils/plannedMaterials';\nimport {useProjectWorkspaceTabs} from './useProjectWorkspaceTabs';\nimport type {ImportedProgressActivity} from '../utils/engineeringProgressImport';\nimport {mapActivity} from '../utils/projectWorkspaceMappers';\nimport type {WorkspaceData,Estimate,ProjectWorkspaceProps} from '../workspaceTypes';\nexport function useProjectWorkspace({${destructured}}:ProjectWorkspaceProps){\n${hookState}\nreturn {${stateNames}};\n}\n`);
const imports=text.slice(0,typeStart).split('\n').filter(line=>!line.startsWith('import { useRouter')&&!line.startsWith('import { useState')&&!line.startsWith('import useSWR')&&!line.startsWith('import { toast')&&!line.startsWith('import { buildPlanned')&&!line.startsWith('import { useProjectWorkspaceTabs')).join('\n');
// Keep only UI imports in the page assembler.
const uiImports=imports.replace(/import \{\n  approveProjectEstimateAction,[\s\S]*?from "@\/actions\/costEstimator";\n/,'').replace(/import \{ approveProjectEstimateWithBaselineAction[^\n]*\n/,'').replace(/import \{\n  getProjectWorkspaceDataAction,[\s\S]*?from "@\/actions\/projects";\n/,'').replace(/import type [\s\S]*?;\n/g,'');
write('features/projects/components/ProjectWorkspaceClient.tsx',`${uiImports}\nimport styles from '@/components/workspace/workspace.module.css';\nimport {useProjectWorkspace} from '../hooks/useProjectWorkspace';\nimport type {ProjectWorkspaceProps} from '../workspaceTypes';\nexport default function ProjectWorkspaceClient(props:ProjectWorkspaceProps){\nconst {project,currentUserId,canUpdateProgress,canReviewEstimates}=props;\nconst {${stateNames}}=useProjectWorkspace(props);\n${text.slice(jsxStart).replace('className="min-h-full space-y-5 bg-white px-4 py-5 sm:px-6 lg:px-8 lg:py-7"','className={\`\${styles.page} space-y-5\`}').replace('sticky top-0 z-40 -mx-4 -mt-5 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mt-7 lg:px-8','flex items-center text-xs')}`);
