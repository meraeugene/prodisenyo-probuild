import styles from "@/components/workspace/workspace.module.css";

export default function EstimateProjectFacts({ facts }: { facts: { label: string; value: string }[] }) {
  return <section aria-label="Estimate project information" className={styles.panel}><dl className="grid grid-cols-2 gap-5 p-5 lg:grid-cols-4">
    {facts.map(fact => <div key={fact.label} className="min-w-0"><dt className="text-xs text-slate-500">{fact.label}</dt><dd className="mt-1 break-words text-sm font-medium text-slate-800">{fact.value}</dd></div>)}
  </dl></section>;
}
