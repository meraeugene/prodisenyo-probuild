# GMEA monitoring expense import

Source: `GMEA PROJECT MONITORING 2026 (1).xlsx`. The workbook is read without modification. Imports target the nine existing projects; contract amounts, statuses and payment histories remain unchanged.

## Reviewed decisions

- Use all CCTV itemized costs, totaling ₱524,257.32. The source SUM omits a ₱15,904 amount stored as text (`15.904.00`). This increases project expenses by ₱15,904 from the earlier contract summary.
- Hold Fullybooked Ketkai's two expenses, ₱39,145, until the user provides its contract. No project or expense records are created for it.
- Royal Cable's displayed total includes payroll subtotals twice. Keep the actual itemized total, ₱37,408.90. Attach the source staff breakdowns to the existing three payroll expenses without duplicating them.
- Preserve existing PABX expenses absent from this workbook. A missing source row does not authorize deleting a recorded cost.

## Result

| Project | Missing entries added | Expense total after import |
| --- | ---: | ---: |
| CVH CCTV Network | 7 | ₱524,257.32 |
| Warehouse Corrales Ave | 9 | ₱56,305.00 |
| CVH 16 Cameras Analog | 3 | ₱10,000.00 |

The 19 entries total ₱177,532.80. Existing summary balances cover ₱161,628.80 of those entries and are reduced accordingly. Bulua's stranded-wire entry is separately corrected from ₱1,582 to ₱1,582.50, consuming its existing ₱0.50 balance. Total project expenses become ₱1,794,677.72, with positive project profit ₱1,529,907.78, losses ₱195.50 and net result ₱1,529,712.28. Contracts remain ₱3,324,390; collections remain ₱2,700,902 and project outstanding remains ₱623,488.

Unprovided or ambiguous dates stay unknown. Expenses include the source workbook, sheet, cells, hash and import timestamp. Combined invoices and payroll entries expose their constituent items in the expense dialog. Summary balance rows retain their original amounts and the history of replacement with actual expenses. Reimbursements retain their source values and do not reduce gross project spending.

## Maintenance

Read-only comparison:

```powershell
node scripts/gmea-monitoring-expenses-import.cjs --file 'C:\Users\Lenovo\Downloads\GMEA PROJECT MONITORING 2026 (1).xlsx'
```

The explicit `--apply --itemized-cctv` options apply the reviewed import. The maintenance writer in `actions/gmeaContractReconciliation.ts` uses the existing role-checked, version-checked RPC. The CLI saves a backup, prepared commands, mutation journal and completion marker in ignored `tmp/design-preview/`. Each command is transactional; concurrent edits or a failed command stop subsequent writes. Review the journal before resuming a partial import.

Repeat imports produce no new commands. A completed source cannot overwrite subsequent changes without review. Normal UI edits preserve trusted import metadata. Validation covers matching, ambiguous duplicates, grouped invoices and payroll, partial-import balance consumption, exact cents, held expenses, and persistence of the full prepared plan through the real migration chain using PGlite.
