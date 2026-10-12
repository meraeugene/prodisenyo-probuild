const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const write = (file, text) => { const target = path.resolve(root, file); if (!target.startsWith(root + path.sep)) throw new Error('Outside workspace'); fs.mkdirSync(path.dirname(target), {recursive:true}); fs.writeFileSync(target, text); };
function between(text, start, end, replacement = '') { const a=text.indexOf(start), b=text.indexOf(end,a); if(a<0 || b<0) throw new Error(`Missing ${start}`); return text.slice(0,a)+replacement+text.slice(b); }

let client=read('features/cost-estimator/components/CostEstimatorPageClient.tsx');
client=client.replace(/import EstimateRejectedAlertModal[^\n]*\n/, '').replace(/\s*<EstimateRejectedAlertModal[\s\S]*?\/>/g,'');
write('features/cost-estimator/components/CostEstimatorPageClient.tsx',client);
let hook=read('features/cost-estimator/hooks/useCostEstimatorPage.ts');
hook=between(hook,'  const [rejectionAlert, setRejectionAlert]', '  const pendingExternalSyncRef');
hook=hook.replace(/  const knownRejectionTimesRef[^\n]*\n/,'').replace(/  const canPlayNotificationSoundRef[^\n]*\n/,'');
hook=between(hook,'  useEffect(() => {\n    if (typeof window === "undefined") return;', '  function syncFromIncomingEstimates()');
hook=between(hook,'    const timeoutId = window.setTimeout', '    let cancelled = false;');
hook=between(hook,'        const latestFreshRejection', '      } catch {');
hook=hook.replace('      clearTimeout(timeoutId);\n','');
hook=between(hook,'        delete knownRejectionTimesRef.current', '        setSaveState("saved");');
hook=between(hook,'  function handleCloseRejectionAlert()', '  return {');
hook=hook.replace('    rejectionAlert,\n','').replace('    handleCloseRejectionAlert,\n','');
write('features/cost-estimator/hooks/useCostEstimatorPage.ts',hook);

// Split the worksheet before redesigning its UI.
let worksheet=read('features/projects/components/EngineeringProgressWorksheet.tsx');
const typeStart=worksheet.indexOf('interface ProgressDraftActivity');
const utilStart=worksheet.indexOf('function parsePercent');
const componentStart=worksheet.indexOf('export default function EngineeringProgressWorksheet');
const stateStart=worksheet.indexOf('  const [draftActivities');
const jsxStart=worksheet.indexOf('  return (\n    <section', stateStart);
const helpersStart=worksheet.indexOf('\nfunction Field(');
const confirmStart=worksheet.indexOf('\nfunction ConfirmModal(');
const types=worksheet.slice(typeStart,utilStart).replace('interface ProgressDraftActivity','export interface ProgressDraftActivity').replace('interface EngineeringProgressWorksheetProps','export interface EngineeringProgressWorksheetProps').replace('interface ActivityFormState','export interface ActivityFormState').replace('type ConfirmState','export type ConfirmState').replace('type ActivityFormErrors','export type ActivityFormErrors').replace('const emptyForm','export const emptyForm');
write('features/projects/worksheetTypes.ts',`import type { EngineeringProgressActivityRecord } from './utils/engineeringWorkspace';\nimport type { ImportedProgressActivity } from './utils/engineeringProgressImport';\n\n${types}`);
const utils=worksheet.slice(utilStart,componentStart).replace(/function /g,'export function ');
write('features/projects/utils/progressWorksheet.ts',`import { sortProgressActivities, type EngineeringProgressActivityRecord } from './engineeringWorkspace';\nimport type { ActivityFormState, ActivityFormErrors, ProgressDraftActivity } from '../worksheetTypes';\n\n${utils}`);
const state=worksheet.slice(stateStart,jsxStart);
const stateNames='form, setForm, editingId, formErrors, setFormErrors, importError, confirmState, setConfirmState, importing, sortedActivities, summary, submitLabel, hasActivities, hasUnsavedChanges, progressButtonLabel, resetForm, handleSubmit, handleEdit, handleImportFile, confirmDelete, submitToCeo';
write('features/projects/hooks/useEngineeringProgressWorksheet.ts',`import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';\nimport { toast } from 'sonner';\nimport { buildProgressSummary, sortProgressActivities } from '../utils/engineeringWorkspace';\nimport { parseEngineeringProgressWorkbook } from '../utils/engineeringProgressImport';\nimport { buildActivitySignature, buildDraftRows, buildClientId, parsePercent, validateForm } from '../utils/progressWorksheet';\nimport { emptyForm, type ActivityFormState, type ActivityFormErrors, type ConfirmState, type ProgressDraftActivity, type EngineeringProgressWorksheetProps } from '../worksheetTypes';\n\nexport function useEngineeringProgressWorksheet({ activities, readOnly = false, onSubmitProgress }: EngineeringProgressWorksheetProps) {\n${state}\n  return { ${stateNames} };\n}\n`);
const helpers=worksheet.slice(helpersStart,confirmStart).replace('function Field','export function Field').replace('function ProgressSkeleton','export function ProgressSkeleton').replace('function ProgressMetrics','export function ProgressMetrics');
write('features/projects/components/ProgressWorksheetParts.tsx',`import type { ReactNode } from 'react';\nimport type { ProgressDraftActivity } from '../worksheetTypes';\nimport { formatPercent } from '../utils/progressWorksheet';\n${helpers}`);
const jsx=worksheet.slice(jsxStart,helpersStart).replace('<ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} onConfirm={confirmDelete} />',`<WorkspaceConfirmDialog open={confirmState !== null} title={confirmState?.type === 'delete-one' ? 'Delete activity?' : 'Delete all activities?'} description={confirmState?.type === 'delete-one' ? \`Remove "\${confirmState.activity.activity}" from this draft progress update?\` : 'Remove every activity from this draft progress update?'} confirmLabel="Delete" danger onClose={() => setConfirmState(null)} onConfirm={confirmDelete} />`);
write('features/projects/components/EngineeringProgressWorksheet.tsx',`"use client";\nimport { LoaderCircle, FileUp, Pencil, Save, Send, Trash2 } from 'lucide-react';\nimport WorkspaceConfirmDialog from '@/components/workspace/WorkspaceConfirmDialog';\nimport { useEngineeringProgressWorksheet } from '../hooks/useEngineeringProgressWorksheet';\nimport { Field, ProgressSkeleton, ProgressMetrics } from './ProgressWorksheetParts';\nimport { formatPercent } from '../utils/progressWorksheet';\nimport type { EngineeringProgressWorksheetProps } from '../worksheetTypes';\n\nexport default function EngineeringProgressWorksheet(props: EngineeringProgressWorksheetProps) {\n  const { readOnly = false, isSubmitting = false } = props;\n  const { ${stateNames} } = useEngineeringProgressWorksheet(props);\n${jsx}`);

// Move each material row into its own component.
let fields=read('features/cost-estimator/components/CostEstimatorItemFields.tsx');
const rowStart=fields.indexOf('\nfunction MaterialFields(');
write('features/cost-estimator/components/CostEstimatorMaterialFields.tsx',`"use client";\n${fields.slice(fields.indexOf('import '), fields.indexOf('type Props ='))}\nexport default ${fields.slice(rowStart+1)}`);
fields=fields.slice(0,rowStart).replace('import {','import {');
fields=fields.replace('type Props =','import MaterialFields from "./CostEstimatorMaterialFields";\n\ntype Props =');
write('features/cost-estimator/components/CostEstimatorItemFields.tsx',fields);
