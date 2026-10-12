import {CheckCircle2,LoaderCircle,XCircle} from 'lucide-react';
import EstimateReportModal from '@/features/cost-estimator/components/EstimateReportModal';
import ProjectReturnEstimateDialog from './ProjectReturnEstimateDialog';
import type {useProjectWorkspace} from '../hooks/useProjectWorkspace';
export default function ProjectWorkspaceDialogs({state}:{state:ReturnType<typeof useProjectWorkspace>}){
const {pendingEstimateAction,returnEstimateId,setReturnEstimateId,returnReason,setReturnReason,setActiveEstimateId,activeEstimate,activeEstimateItems,approveEstimate,confirmReturnEstimate}=state;
return <>      {activeEstimate ? (
        <EstimateReportModal
          estimate={activeEstimate}
          items={activeEstimateItems}
          onClose={() => setActiveEstimateId(null)}
          footer={
            activeEstimate.status === "submitted" ? (
              <div className="ml-auto flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setReturnEstimateId(activeEstimate.id)}
                  disabled={pendingEstimateAction !== null}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-teal-50 px-4 text-sm font-semibold text-teal-800 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  <XCircle size={16} />
                  Return
                </button>
                <button
                  type="button"
                  onClick={() => approveEstimate(activeEstimate.id)}
                  disabled={pendingEstimateAction !== null}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 text-sm font-semibold text-white transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {pendingEstimateAction?.id === activeEstimate.id &&
                  pendingEstimateAction.type === "approve" ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  Approve
                </button>
              </div>
            ) : null
          }
        />
      ) : null}

      {returnEstimateId ? (
        <ProjectReturnEstimateDialog
          reason={returnReason}
          isPending={pendingEstimateAction !== null}
          onReasonChange={setReturnReason}
          onCancel={() => {
            setReturnEstimateId(null);
            setReturnReason("");
          }}
          onConfirm={confirmReturnEstimate}
        />
      ) : null}</>;
}
