"use client";
import WorkspaceConfirmDialog from '@/components/workspace/WorkspaceConfirmDialog';
import {useEngineeringProgressWorksheet} from '../hooks/useEngineeringProgressWorksheet';
import type {EngineeringProgressWorksheetProps} from '../worksheetTypes';
import ProgressWorksheetTable from './ProgressWorksheetTable';
import ProgressWorksheetEditor from './ProgressWorksheetEditor';
export default function EngineeringProgressWorksheet(props:EngineeringProgressWorksheetProps){
const state=useEngineeringProgressWorksheet(props);
const {confirmState,setConfirmState,confirmDelete}=state;
return <section className="grid items-start gap-5 text-sm xl:grid-cols-[minmax(0,1fr)_320px]" aria-label="Engineering progress activities"><ProgressWorksheetTable state={state} readOnly={props.readOnly}/><ProgressWorksheetEditor state={state} readOnly={props.readOnly} isSubmitting={props.isSubmitting}/>
      <WorkspaceConfirmDialog open={confirmState !== null} title={confirmState?.type === 'delete-one' ? 'Delete activity?' : 'Delete all activities?'} description={confirmState?.type === 'delete-one' ? `Remove "${confirmState.activity.activity}" from this draft progress update?` : 'Remove every activity from this draft progress update?'} confirmLabel="Delete" danger onClose={() => setConfirmState(null)} onConfirm={confirmDelete} /></section>;
}
