import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import styles from "./ceoWorkspace.module.css";

export default function CeoSortButton({ label, active, direction, onClick }: {
  label: string; active: boolean; direction: "asc" | "desc"; onClick: () => void;
}) {
  const Icon = active ? direction === "asc" ? ArrowUp : ArrowDown : ChevronsUpDown;
  return <button type="button" onClick={onClick} className={styles.sortButton} data-active={active} aria-label={`Sort by ${label}${active ? `, currently ${direction === "asc" ? "ascending" : "descending"}` : ""}`}>
    {label}<Icon size={13} aria-hidden="true" />
  </button>;
}
