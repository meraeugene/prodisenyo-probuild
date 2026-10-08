import type { RentalEquipment } from "../types";
import { formatRentalMoney, rentalLabel } from "../utils/rentalUi";
import RentalStatusBadge from "./RentalStatusBadge";
import styles from "@/components/workspace/workspace.module.css";

export default function EquipmentRecordsTable({ equipment, onEdit, onDeactivate, pending }: {
  equipment: RentalEquipment[]; onEdit?: (item: RentalEquipment) => void;
  onDeactivate?: (item: RentalEquipment) => void; pending?: boolean;
}) {
  return <div className="overflow-x-auto">
    <table className={styles.table} style={{ minWidth: 780 }}>
      <caption className="sr-only">Equipment inventory and rates</caption>
      <thead><tr>{["Equipment", "Asset code", "Plate", "Default rate", "Status", "Activity"].map((label) => <th key={label} scope="col">{label}</th>)}{onEdit && <th scope="col">Actions</th>}</tr></thead>
      <tbody>{equipment.map((item) => <tr key={item.id}>
        <th scope="row" className="font-normal"><p className="font-medium">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.equipment_type}</p></th>
        <td className="text-slate-600">{item.code}</td><td className="text-slate-600">{item.plate_number || "—"}</td>
        <td className="whitespace-nowrap tabular-nums">{item.default_rate === null ? "—" : formatRentalMoney(item.default_rate)}{item.rate_unit && <span className="text-xs text-slate-500"> / {rentalLabel(item.rate_unit)}</span>}</td>
        <td><RentalStatusBadge status={item.status} /></td>
        <td>{item.is_active ? "Active" : "Inactive"}</td>
        {onEdit && <td><div className="flex gap-2">
          <button type="button" disabled={pending} className={styles.button} onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`}>Edit</button>
          {item.is_active && onDeactivate && <button type="button" disabled={pending} className={`${styles.button} !text-rose-700`} onClick={() => onDeactivate(item)} aria-label={`Deactivate ${item.name}`}>Deactivate</button>}
        </div></td>}
      </tr>)}</tbody>
    </table>
    {!equipment.length && <p role="status" className={styles.empty}>No matching equipment. Try another search or reset the filters.</p>}
  </div>;
}
