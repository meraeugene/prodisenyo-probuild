import TablePagination from "@/components/TablePagination";

export function PayrollPageControls({ page, totalPages, onChange, label = "Payroll pages" }: {
  page: number; totalPages: number; onChange: (page: number) => void; label?: string;
}) {
  if (totalPages <= 1) return null;
  return <TablePagination page={page} totalPages={totalPages} onChange={onChange} label={label} />;
}
