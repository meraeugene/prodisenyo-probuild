import type { RentalEquipment } from "../types";
import { formatRentalMoney, rentalLabel } from "../utils/rentalUi";
import RentalStatusBadge from "./RentalStatusBadge";
import GmeaRentalDeleteButton from "./GmeaRentalDeleteButton";
import GmeaRentalConfirmAction from "./GmeaRentalConfirmAction";
import styles from "@/components/workspace/workspace.module.css";

export default function EquipmentRecordsTable({ equipment, onEdit, onDeactivate, pending }: {
  equipment: RentalEquipment[]; onEdit?: (item: RentalEquipment) => void;
  onDeactivate?: (item: RentalEquipment) => Promise<void>; pending?: boolean;
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
        {onEdit && <td><div className="flex flex-wrap gap-2">
          <button type="button" disabled={pending} className={styles.button} onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`}>Edit</button>
          {item.is_active && onDeactivate && <GmeaRentalConfirmAction disabled={pending} className={`${styles.button} !text-rose-700`} label={`Deactivate ${item.name}`} triggerLabel="Deactivate" pendingLabel="Deactivating…" description="This equipment will be inactive and unavailable for new rental bookings. Existing rental and expense history will be kept." onConfirm={() => onDeactivate(item)} />}
          <GmeaRentalDeleteButton kind="equipment" id={item.id} version={item.version} name={item.name} />
        </div></td>}
      </tr>)}</tbody>
    </table>
    {!equipment.length && <p role="status" className={styles.empty}>No matching equipment. Try another search or reset the filters.</p>}
  </div>;
}
