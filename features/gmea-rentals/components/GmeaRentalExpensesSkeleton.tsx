import { SkeletonBlock as Block } from "@/components/LoadingSkeleton";
import { SkeletonStats } from "@/components/PageSkeletonParts";

export default function GmeaRentalExpensesSkeleton({ canEdit }: { canEdit: boolean }) {
  return <div aria-hidden="true" className="space-y-4">
    <div className="flex flex-wrap gap-2 px-4 py-3 sm:px-5">{["Monthly", "Weekly", "Rentals", "Equipment", "History"].map(label => <Block key={label} className="h-9 w-24" />)}</div>
    <div className="space-y-4 px-4 sm:px-5">
      <div className="flex flex-wrap justify-between gap-3"><div><Block className="h-6 w-60" /><Block className="mt-2 h-4 w-96 max-w-full" /></div>{canEdit && <Block className="h-9 w-32" />}</div>
      <div className="flex flex-wrap items-end gap-3"><div><Block className="mb-2 h-4 w-12" /><Block className="h-9 w-44" /></div><Block className="mb-2 h-3 w-52" /></div>
      <SkeletonStats count={2} compact className="grid gap-3 sm:grid-cols-2" />
      <div className="space-y-4 py-3">{Array.from({length: 5}, (_,row) => <div key={row} className="grid grid-cols-2 gap-5 border-b border-slate-100 pb-4 lg:grid-cols-6">{Array.from({length: 6}, (_,column) => <Block key={column} className={row === 0 ? "h-3 w-20 max-w-full" : "h-5 w-24 max-w-full"} />)}</div>)}</div>
    </div>
  </div>;
}
