import Link from "next/link";
import type { CeoApprovalSummary } from "../types";
import styles from "./ceoDashboard.module.css";

export default function CeoDashboardApprovalQueue({ items }: { items: CeoApprovalSummary[] }) {
  const pendingItems = items.filter((item) => item.count > 0);
  const visibleItems = pendingItems.length ? pendingItems : items;
  return (
    <section id="approval-queue" className={`${styles.panel} scroll-mt-6 p-5`}>
      <h2 className={styles.heading}>Approval Queue</h2>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-teal-50/40 text-[#53736f]">
            <tr>
              <th scope="col" className="rounded-l-lg px-2 py-2.5 font-medium">Type</th>
              <th scope="col" className="hidden px-2 py-2.5 font-medium 2xl:table-cell">Description</th>
              <th scope="col" className="px-2 py-2.5 text-center font-medium">Pending</th>
              <th scope="col" className="rounded-r-lg px-2 py-2.5 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal-900/[0.06]">
            {visibleItems.map((item) => (
              <tr key={item.href}>
                <th scope="row" className="px-2 py-5 font-medium leading-5 text-[#294b48]">{item.label}</th>
                <td className="hidden max-w-[160px] px-2 py-5 leading-5 text-[#53736f] 2xl:table-cell">{item.detail}</td>
                <td className="px-2 py-5 text-center font-medium tabular-nums">{item.count}</td>
                <td className="px-2 py-5 text-right"><Link href={item.href} aria-label={`Review ${item.count} ${item.label.toLowerCase()}`} className="inline-flex min-h-8 items-center rounded-lg bg-teal-50 px-3 font-medium text-[#076d69] transition-colors hover:bg-teal-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700">Review</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!pendingItems.length && <p className="mt-3 text-xs text-[#53736f]">You’re all caught up. No approvals awaiting review.</p>}
    </section>
  );
}
