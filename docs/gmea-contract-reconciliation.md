# GMEA contract workbook reconciliation

`OPERATIONS EXPENSES.xlsx`, sheet `PROJECT CONTRACT`, is the source for the nine project contracts. The master rows are 5–15; continuation rows belong to BFAR. The lower ongoing-project section repeats records and must not be imported again.

Initial project totals reconciled on 9 October 2026, before the subsequent monitoring expense import:

| Metric | Amount |
| --- | ---: |
| Contracts | ₱3,324,390.00 |
| Project expenses | ₱1,778,773.72 |
| Collected | ₱2,700,902.00 |
| Outstanding | ₱623,488.00 |
| Positive project profit | ₱1,545,811.78 |
| Project loss | ₱195.50 |
| Net result | ₱1,545,616.28 |

Four projects are completed; five are ongoing. These are project totals. The combined overview also includes rental records and balances.

The subsequent [monitoring expense import](gmea-monitoring-expense-import.md) replaces summary balances with itemized records. The user approved CCTV's full itemized cost of ₱524,257.32, including ₱15,904 stored as text and omitted by the workbook SUM. Current project expenses therefore become ₱1,794,677.72; the initial totals above remain a record of the earlier contract reconciliation.

## Project summary columns and inputs

The GMEA and CEO project tables share the workbook's project summary structure: Name, Client, Project Name, Address, Contract Amount, Down Payment percentage and amount, Collected date, Completion percentage / Not Yet / Paid, completion Collected date, Expenses, Duration and Completed Project. Multiple completion milestones use separate rows (including BFAR). Totals cover the filtered project set across pagination. GMEA starts with all projects in source row order; CEO retains its filters and sorting.

Project details use the same field names. Payment schedule inputs use a table with independent fixed peso amounts and displayed percentage labels. Bulua retains 75% / ₱130,000 and 25% / ₱45,000; Royal retains the workbook's 100% completion label and ₱42,500 fixed amount. These labels do not override reconciled values. Paid amounts and collection dates come from receipt history; Record payment opens the Paid amount and Collected date inputs. Unknown source dates and durations remain unprovided.

The descriptive fields and percentage labels for nine existing projects are aligned by `scripts/gmea-project-summary-import.cjs --file '<source path>'` (read-only by default; explicit `--apply` writes). It saves backups and journals, uses the version-checked maintenance action, checks that costs, fixed schedules, statuses and payment history are unchanged, verifies the workbook hash, and verifies that a repeat import produces no commands. Source metadata survives normal contract editing. The monitoring expenses already approved by the user take precedence over the screenshot's older expense summary.

## Calculation rules

- Payment schedules retain the fixed peso amounts from the workbook. Percentage labels do not override those amounts (particularly Bulua and Royal Cable).
- Collections include posted receipts and dated or undated workbook opening collections. Voided receipts remain in history and do not count.
- Missing receipt dates remain unknown. An undated source collection is stored in the payment term's `imported_receipts` metadata, shown in payment history, and included in balance and overpayment checks.
- Expense totals include itemized VAT gross costs plus separately identified workbook reconciliation balances. Reimbursing Sir Edward does not reverse a project expense.
- A workbook expense balance is the source total less existing itemized costs at import. It has its own visible row and source details; it is not a fabricated invoice or transaction date. Signed balances support cent corrections without altering original expense entries.
- Opening balances remain fixed. Subsequent genuine expenses increase project spending; rerunning the original import must not silently erase those changes.

## Import maintenance

Prepare a read-only plan:

```powershell
node scripts/gmea-contract-workbook-import.cjs --file 'C:\Users\Lenovo\Downloads\OPERATIONS EXPENSES.xlsx'
```

The explicit `--apply` option applies the prepared reconciliation. The CLI requires exactly one active GMEA account, saves the prior project records and commands under the ignored `tmp/design-preview/` directory, and records a mutation journal. Writes are in `actions/gmeaContractReconciliation.ts` and use the existing version-checked, role-checked database RPC. Each command is transactional; the entire multi-project import is not one transaction. A failure stops subsequent commands and requires review of the saved journal.

Source references include the filename, sheet, cells, SHA-256 and import timestamp. Existing receipts with differing source amounts or dates are voided with a reconciliation reason and replaced, preserving their original history. Deterministic identifiers and source checks prevent duplicate imports. A later deliberate void of an imported receipt requires review rather than automatic reposting.

Normal UI mutations cannot forge or remove workbook balances. Contract edits preserve the stored imported collections; payment recording checks the full received balance before the database call. The CLI also saves a completed-import marker locally. Once complete, the same workbook cannot be applied over later project changes without review.

Validation covers fixed schedules, exact cents, losses, missing dates, receipt history, source protection, repeat imports, stale versions and persistence through the real database migration chain using PGlite.
