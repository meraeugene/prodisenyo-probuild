const pulse = "animate-pulse rounded-lg bg-slate-100";

export default function PurchasingRecordsSkeleton() {
  return (
    <div role="status" aria-label="Loading purchases" className="space-y-3">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="rounded-[22px] border border-slate-100 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col justify-between gap-5 sm:flex-row">
            <div className="min-w-0 flex-1">
              <div className={`${pulse} h-3 w-32`} />
              <div className={`${pulse} mt-3 h-5 w-56 max-w-full`} />
              <div className={`${pulse} mt-3 h-4 w-72 max-w-full`} />
              <div className={`${pulse} mt-2 h-3 w-80 max-w-full`} />
            </div>
            <div className="flex items-start justify-between gap-3 sm:justify-end">
              <div className="space-y-2 sm:text-right"><div className={`${pulse} h-3 w-20`} /><div className={`${pulse} h-5 w-28`} /><div className={`${pulse} h-3 w-16`} /></div>
              <div className={`${pulse} h-9 w-9 rounded-lg`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
