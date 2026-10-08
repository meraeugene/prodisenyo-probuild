import WorkspaceTableSkeleton from "@/components/workspace/WorkspaceTableSkeleton";

export default function PurchasingRecordsSkeleton() {
  return <div role="status" aria-busy="true" aria-label="Loading purchasing records"><WorkspaceTableSkeleton columns={9} firstColumnLines={2} rowHeight={64} minWidth={1000} /></div>;
}
