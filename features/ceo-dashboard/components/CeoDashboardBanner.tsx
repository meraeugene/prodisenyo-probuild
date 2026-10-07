import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CeoPageHeader from "@/features/ceo-workspace/components/CeoPageHeader";
import styles from "@/features/ceo-workspace/components/ceoWorkspace.module.css";

export default function CeoDashboardBanner({ name, approvals, href }: {
  name: string; approvals: number; href: string;
}) {
  return (
    <CeoPageHeader eyebrow="Prodisenyo / Overview" title="Executive dashboard" description={`Good day, ${name}. Your projects, finances, and decisions in one place.`}
      actions={<Link href={href} aria-label={`Review ${approvals} pending approvals`} className={styles.primaryButton}>Review approvals<span className="rounded bg-white/20 px-1.5 text-xs">{approvals}</span><ArrowRight size={14} aria-hidden="true" /></Link>} />
  );
}
