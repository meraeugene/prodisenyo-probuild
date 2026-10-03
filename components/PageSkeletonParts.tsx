import { SkeletonBlock as Block, SkeletonPanel, SkeletonRows } from "./LoadingSkeleton";

export function SkeletonHeading() {
  return <div><Block className="h-6 w-48" /><Block className="mt-2 h-3 w-64" /></div>;
}

export function SkeletonStats({ count, className, cardClassName = "rounded-xl px-5 py-4", helper = false }: { count: number; className: string; cardClassName?: string; helper?: boolean }) {
  return <div className={className}>{Array.from({ length: count }, (_, index) => <SkeletonPanel key={index} className={cardClassName}><Block className="h-3 w-32" /><Block className="mt-3 h-7 w-24" />{helper && <Block className="mt-2 h-3 w-40" />}</SkeletonPanel>)}</div>;
}

export function SkeletonListPanel({ rows = 4 }: { rows?: number }) {
  return <SkeletonPanel><SkeletonHeading /><div className="mt-4"><SkeletonRows rows={rows} /></div></SkeletonPanel>;
}

export function SkeletonToolbar({ count = 3 }: { count?: number }) {
  return <div className="flex flex-wrap gap-3">{Array.from({ length: count }, (_, index) => <Block key={index} className={`h-10 ${index === 0 ? "min-w-0 flex-1 basis-56" : "w-36"}`} />)}</div>;
}

export function SkeletonTable({ columns = 6, rows = 5 }: { columns?: number; rows?: number }) {
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="h-10 bg-slate-50" />{Array.from({ length: rows }, (_, row) => <div key={row} className="grid gap-4 border-t border-slate-100 px-4 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{Array.from({ length: columns }, (_, column) => <Block key={column} className="h-4 w-full" />)}</div>)}</div>;
}

export function SkeletonPortfolioCards({ count = 4, className = "grid gap-4 md:grid-cols-2", image = false }: { count?: number; className?: string; image?: boolean }) {
  return <div className={className}>{Array.from({ length: count }, (_, index) => <SkeletonPanel key={index} className="overflow-hidden p-0">{image && <Block className="h-44 w-full rounded-none" />}<div className="p-5"><Block className="h-5 w-40" /><Block className="mt-3 h-3 w-56" /><div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4"><Block className="h-8 w-24" /><Block className="h-8 w-28" /></div></div><div className="flex justify-between border-t border-slate-100 px-5 py-3"><Block className="h-5 w-24" /><Block className="h-9 w-28" /></div></SkeletonPanel>)}</div>;
}
