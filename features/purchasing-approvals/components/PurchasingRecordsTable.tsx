import { Download, Pencil } from "lucide-react";
import type { PurchasingRecord } from "@/actions/purchasing";
import styles from "@/components/workspace/workspace.module.css";
import { formatPurchaseMoney, purchaseStatusLabel } from "../utils/purchasingPresentation";

export default function PurchasingRecordsTable({ records, onEdit, onReceipt }: {
  records: PurchasingRecord[]; onEdit: (record: PurchasingRecord) => void; onReceipt: (id: string) => void;
}) {
  return <div className="overflow-x-auto"><table className={styles.table}>
    <thead><tr>{["Material / Project", "Quantity", "Supplier", "Quotation", "Actual total", "Status", "Delivery", "Receipt / Invoice", "Action"].map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead>
    <tbody>{records.map((record) => <tr key={record.id}>
      <th scope="row" className="font-medium">{record.itemName}<p className="mt-1 text-xs font-normal text-slate-500">{record.projectName}</p></th>
      <td>{record.quantity} {record.unit}</td><td>{record.supplierName || "Supplier pending"}</td><td>{record.quotationReference || "—"}</td>
      <td className="tabular-nums">{formatPurchaseMoney(record.quantity * record.actualUnitCost)}</td><td>{purchaseStatusLabel(record.status)}</td><td>{purchaseStatusLabel(record.deliveryStatus)}</td>
      <td>{record.receiptFile ? <button className={styles.recordLink} type="button" onClick={() => onReceipt(record.receiptFile!.id)}><Download size={12} className="mr-1 inline" />{record.receiptFile.fileName}</button> : record.receiptInvoiceReference || "Not uploaded"}</td>
      <td>{record.status === "received" ? <span className="text-xs text-teal-700">Final</span> : <button type="button" className={styles.button} onClick={() => onEdit(record)} aria-label={`Edit purchase details for ${record.itemName}`}><Pencil size={13} />Edit</button>}</td>
    </tr>)}</tbody>
  </table></div>;
}
