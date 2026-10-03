import type { ReactNode } from "react";

export interface WorkspaceMetric {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}

export default function WorkspaceSummaryCards({ cards, ariaLabel, className = "xl:grid-cols-4" }: {
  cards: WorkspaceMetric[];
  ariaLabel: string;
  className?: string;
}) {
  return <section aria-label={ariaLabel} className={`grid gap-4 sm:grid-cols-2 ${className}`}>
    {cards.map(card => <article key={card.label} className="workspace-surface min-w-0 px-5 py-5">
      <p className="text-[15px] font-medium leading-5 text-[#365b56]">{card.label}</p>
      <p className="mt-3 break-words text-[30px] font-semibold leading-tight tracking-[-.035em] text-[#1d1d1f] tabular-nums">{card.value}</p>
      {card.hint && <p className="mt-2 text-[13px] leading-5 text-[#53736f]">{card.hint}</p>}
    </article>)}
  </section>;
}
