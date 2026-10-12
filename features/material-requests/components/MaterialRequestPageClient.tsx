"use client";
import WorkspacePageHeader from '@/components/workspace/WorkspacePageHeader';
import styles from '@/components/workspace/workspace.module.css';
import {useMaterialRequestPage,type MaterialRequestPageProps} from '../hooks/useMaterialRequestPage';
import MaterialRequestForm from './MaterialRequestForm';
import MaterialRequestQueue from './MaterialRequestQueue';
export default function MaterialRequestPageClient(props:MaterialRequestPageProps){
const state=useMaterialRequestPage(props);
return <div className={`${styles.page} space-y-5`}><WorkspacePageHeader eyebrow="Engineer / Materials" title="Request Materials" description="Request materials for your assigned projects and track their delivery." /><div className="grid items-start gap-5 xl:grid-cols-2"><MaterialRequestForm state={state} projects={props.projects} plannedMaterial={props.plannedMaterial}/><MaterialRequestQueue sortedRequests={state.sortedRequests}/></div></div>;
}
