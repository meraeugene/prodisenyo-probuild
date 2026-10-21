import styles from "@/components/workspace/workspace.module.css";

export default function RentalRecordRowActions({ canEdit, onEdit, onDelete, onDetails }: {
  canEdit: boolean; onEdit: () => void; onDelete: () => void; onDetails: () => void;
}) {
  return <div className="flex flex-wrap gap-3">{canEdit ? <>
    <button type="button" className={styles.recordLink} onClick={onEdit}>Edit</button>
    <button type="button" className="font-medium text-rose-700 hover:underline" onClick={onDelete}>Delete</button>
  </> : <button type="button" className={styles.recordLink} onClick={onDetails}>Details</button>}</div>;
}
