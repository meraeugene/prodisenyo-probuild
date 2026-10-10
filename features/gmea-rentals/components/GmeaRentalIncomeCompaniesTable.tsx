import type { RentalIncomeCompany } from "../utils/rentalIncomeSelectors";
import { formatRentalMoney } from "../utils/rentalUi";
import styles from "@/components/workspace/workspace.module.css";
import tableStyles from "./rentalIncomeTables.module.css";

export default function GmeaRentalIncomeCompaniesTable({ companies, onOpenCompany }: {
  companies: RentalIncomeCompany[]; onOpenCompany: (key: string) => void;
}) {
  return <div className="overflow-x-auto">
    <table className={`${styles.table} ${tableStyles.incomeTable}`}>
      <caption className="sr-only">Rental income by company and client for the selected month</caption>
      <thead><tr>{["Company Name", "Location", "Total"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
      <tbody>{companies.map(company => <tr key={company.key}>
        <th scope="row"><button type="button" className={`${styles.recordLink} text-left`} onClick={() => onOpenCompany(company.key)}>{company.name}</button></th>
        <td>{company.locations.join(", ") || "Not recorded"}</td>
        <td className="whitespace-nowrap tabular-nums">{formatRentalMoney(company.collected)}</td>
      </tr>)}</tbody>
      {!!companies.length && <tfoot><tr><th scope="row" colSpan={2}>Page total</th>
        <td className="whitespace-nowrap font-semibold tabular-nums">{formatRentalMoney(companies.reduce((total, company) => total + company.collected, 0))}</td>
      </tr></tfoot>}
    </table>
    {!companies.length && <p role="status" className={styles.empty}>No matching companies or clients.</p>}
  </div>;
}
