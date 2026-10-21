# GMEA rental expense workbook review

## October 21, 2026: source row order and weekly total verification

The Expense tab retains the Income table design, inline Week range filter, and one complete week per page. Rows now follow the original worksheet order within each cutoff, including equipment before cash advances and salaries, rather than sorting by transaction date or database ID. Week choices remain earliest first. Search results preserve the relative source order and total only the matching rows.

A fresh read-only database reconciliation found zero amount updates or removals. All 1,014 retained rows across 77 cutoffs were checked against their source cells, displayed table sequence, and cent-based weekly totals. The retained total remains PHP 2,820,992.52. Verification evidence is in `tmp/design-preview/weekly-source-order-verified.json`.

For February 2-7, 2026, the first rows are Yellow Dump diesel PHP 3,000, Canter diesel PHP 2,000, Bongo diesel PHP 1,000, and Bongo maintenance PHP 3,910. All equipment rows precede drivers/operators cash advances, then drivers/operators salaries. `FEB WEEKLY!G25` is PHP 36,543.82, including the PHP 500 GMEA ADMIN advance at `E21`. Excluding admin as instructed leaves 15 rows totaling **PHP 36,043.82**. No admin expense was restored to force equality with the printed gross total.

Four printed weekly totals differ from the sum of their source detail rows even before admin exclusions:

| Source total cell | Cutoff | Printed total | Source detail sum including admin | Retained total excluding admin |
| --- | --- | ---: | ---: | ---: |
| DEC WEEKLY!E47 | December 8-13, 2025 | PHP 27,457.01 | PHP 30,457.01 | PHP 29,957.01 |
| APR-WEEKLY!E48 | April 13-18, 2026 | PHP 55,069.06 | PHP 37,069.06 | PHP 29,114.50 |
| SEPTEMBER WEEKLY!G79 | September 21-26, 2026 | PHP 6,000.00 | PHP 10,000.00 | PHP 10,000.00 |
| SEPTEMBER WEEKLY!G96 | September 28-October 3, 2026 | PHP 11,360.00 | PHP 14,860.00 | PHP 14,860.00 |

The app totals the retained source detail. The workbook remains unchanged, and this presentation fix makes no financial mutations.

## October 21, 2026: weekly sources only and chronological workbook tables

The user clarified that only months/sheets with weekly expense data should be imported, and that the Rentals expense table must follow the workbook's weekly layout from the earliest cutoff and date. This supersedes October 20's retention of unmatched equipment-sheet history and the earlier newest-first/transaction-month presentation.

All 1,014 retained non-admin weekly rows now carry source-sheet reporting month, cutoff dates/label, equipment or payee, section, partial 13th-month kind, source order, block, cell, and workbook hash. They cover **77 cutoffs across 18 reporting months (April 2025-September 2026), totaling PHP 2,820,992.52**. There are no imported expenses for months without retained weekly source data. The unfinished October 2026 template and the empty November 2026 worksheet remain excluded. Admin exclusions and prior user-delegated date interpretations remain in force.

The reconciliation removed 338 unmatched equipment-sheet-only imports. It also consolidated the April 24, 2025 Forward maintenance components (PHP 180 and PHP 670) into one PHP 850 weekly row, removing the redundant component record. The 339 removals totaled PHP 451,573.31, offset by a PHP 670 increase to the retained aggregate record. The database now contains exactly 1,014 rental expense rows totaling PHP 2,820,992.52. No manual expenses were removed; equipment, categories, contracts, rental items, receipts, workers, and assignments were verified unchanged.

Expense renders one complete week per page using the same compact table design as Income, with source row order and a weekly total. The inline Week range selector and page controls navigate cutoffs earliest first without five-row pagination splitting a week. All records and Income retain ascending transaction-date order. Filtering a month uses the source reporting month for weekly costs, including cutoffs that cross month boundaries and actual expense dates outside the printed cutoff. Notes retain provenance without displaying the workbook metadata JSON in editable notes.

January 2026 is verified as:

| Cutoff | Total excluding admin |
| --- | ---: |
| January 5-10 | PHP 51,820.32 |
| January 12-17 | PHP 23,960.13 |
| January 19-24 | PHP 23,521.88 |
| January 26-31 | PHP 27,557.75 |
| January total | PHP 126,860.08 |

The first January table matches the supplied screenshot, including the January 3 partial 13th-month payments placed below equipment in the January 5-10 source cutoff. No January 1 transaction was fabricated.

`scripts/gmea-weekly-only-reconcile.cjs --file <workbook> --resolutions scripts/config/gmeaWeeklyExpenseResolutions.json` previews this reconciliation; `--apply` executes it through active-GMEA, version-checked RPCs. The backup and mutation journal use timestamp `2026-10-21T01-39-01-519Z`. `tmp/design-preview/weekly-only-verified.json` records the counts, monthly totals, unchanged workbook hash, unchanged unrelated records, and an immediate repeat check with zero updates and zero removals. Every retained source amount, actual date, reporting month, and cutoff was verified after writing.

## October 20, 2026: all weekly sheets reconciled

The user requested all weekly expenses, excluded all admin entries, selected weekly-sheet values when equipment sheets disagreed, and delegated reasonable interpretations of malformed dates. This reconciliation supersedes the earlier import holds and pre-exclusion reporting totals below for weekly expenses. The current Rentals transaction table displays these records at `/gmea-rentals/income`; it no longer opens with the earlier Monthly/Weekly navigation described below.

All 20 weekly sheets were inspected: 19 populated sheets and one empty November 2026 sheet. Every positive numeric money cell was accounted for as one of 1,083 itemized source rows or 231 subtotal/control cells. Of the source rows, 25 exact repeats were referenced once, 43 admin rows were excluded, and one unfinished October 2026 equipment template was excluded. The remaining **1,014 distinct weekly entries, totaling PHP 2,820,992.52**, are reconciled to saved expenses. One weekly aggregate of PHP 850 maps to its two already-saved maintenance components, PHP 180 and PHP 670, rather than another expense.

The verified database changes were:

- Added 82 missing expenses totaling PHP 280,880.26.
- Corrected seven existing records to weekly-sheet values, including two category/description corrections and five amount corrections. The net amount correction was minus PHP 13,970.00. Exact matches across all sheets were reserved before resolving conflicts, so a separately represented cost was not overwritten.
- Removed 40 source-verified admin entries from the earlier workbook import, totaling PHP 261,034.68. These include Admin/GMEA Admin and the named admin payees Mariegen/Maeiegen. Three other admin source rows had never been imported and remain excluded. Original records are retained in the backup.
- Preserved unrelated expenses, equipment, categories, rental contracts, items, payments, workers, and assignments. After reconciliation, the rental expense table contains 1,353 rows with recorded amounts totaling PHP 3,271,895.83, including historical costs outside the weekly source set.

The user-delegated date interpretations are preserved in the new expenses' notes and `scripts/config/gmeaWeeklyExpenseResolutions.json`: June 28 for the June 23-28 salaries marked June 28/30; August 9 salaries for the unheaded second payee group in the August 4-9 cutoff; December 3 cash advances and December 6 salaries for blank dates in the December 1-6 cutoff; and January 31 for the impossible February 31 salary date in the January 26-31 cutoff. The two January 3 partial 13th-month payments of PHP 500 were included. Valid source dates were otherwise preserved, including dates outside a printed cutoff.

`OCTOBER WEEKLY!I3` remains excluded because it has no transaction day, an unfinished October date, and a copied September cutoff. Its four September cash advance/salary copies map to September's original entries. No October transaction date or expense was invented. There are no unresolved non-admin source rows apart from this explicitly excluded template. The Excel workbook and its SHA-256 remain unchanged.

The reusable command is `node scripts/gmea-all-weekly-expenses-import.cjs --file <workbook> --admin-policy exclude-all --resolutions scripts/config/gmeaWeeklyExpenseResolutions.json --prefer-weekly --exclude-existing-admin`; it defaults to a dry run. Add `--apply` only to execute the reviewed plan. Mutations use active-GMEA role checks and existing version-checked RPCs. Admin exclusion also verifies the saved source, payee, and version. A backup and per-mutation journal are written before financial changes.

Verification is in `tmp/design-preview/all-weekly-import-verified.json`. The October 20 backup and journal use timestamp `2026-10-20T08-51-33-519Z`. Every reconciled source date/amount was verified after writing, with correction categories/descriptions/notes checked separately. An immediate repeat plan found **zero new expenses and zero corrections**, with no unresolved held rows. Fourteen focused import tests and lint passed.

Reviewed on October 9, 2026. Source: `C:\Users\Lenovo\Downloads\ALL EXPENSES (1).xlsx`.
SHA-256: `cd6bb829e2abe48cacbf3d41a1b0f5efcec59fae0b61d59e08aa0a41f76738ef`.
The workbook was read only and remains unchanged. The reviewed subset was imported into GMEA Rentals on October 9, 2026 after the user explicitly requested insertion; held rows were excluded.

## Monthly and weekly views

The user clarified the reporting model after the initial import. Rentals opens with Monthly and Weekly, followed by Rentals, Equipment, and History. Weekly uses the exact custom cutoffs from **AUGUST WEEKLY** and **SEPTEMBER WEEKLY** in 2026, including August 1–9 and September 28–October 3. Monthly adds whole cutoffs assigned to the reporting month; it does not split them at calendar boundaries. The earlier calendar-week interpretation is superseded for these reports. Older imported transactions remain accessible in History by actual transaction date.

Weekly displays Date, Equipment, Description, and Price, followed by dated cash advances and salaries. Monthly lists each cutoff with its equipment, cash advance, salary, and total amounts. GMEA can add expenses to a cutoff or start a new week with editable dates for October and later. CEO can view details. Blank cash advance and salary sections display **Not entered** and create no zero-value transactions. History retains category/equipment/search filters and pagination.

## Weekly source reconciliation

The second reconciliation attached 65 existing expenses to their source cutoffs and inserted 27 missing weekly entries, giving **92 itemized rows across nine cutoffs**. It reused matching expenses and corrected three prices to the weekly source: August 23 Bongo ₱1,500 → ₱2,000; August 28 Red Mini Dump ₱2,000 → ₱1,500; September 12 Red Mini Dump ₱2,000 → ₱1,500. Rental contracts, equipment, payments, workers, assignments, and unrelated historical expenses remained unchanged.

| Cutoff | Sum of entered prices |
| --- | ---: |
| August 1–9 | ₱22,408.92 |
| August 10–15 | ₱34,316.07 |
| August 17–23 | ₱23,792.57 |
| August 24–29 | ₱32,782.69 |
| **August monthly total** | **₱113,300.25** |
| September 1–5 | ₱40,714.38 |
| September 7–12 | ₱31,840.57 |
| September 14–19 | ₱46,019.51 |
| September 21–26 | ₱10,000.00 |
| September 28–October 3 | ₱14,860.00 |
| **September monthly total** | **₱143,434.46** |

September 21–26's `G79=SUM(G69:G78)` omits G67:G68 (₱4,000); September 28–October 3's `G96=SUM(G84:G95)` omits G82:G83 (₱3,500). The system sums all entered prices, as requested, rather than reproducing these incomplete formulas. The workbook remains unchanged.

`scripts/gmea-rental-weekly-import.cjs` reads only the two source sheets, handles merged date/equipment cells, ignores salary/CA subtotal cells, and uses role-checked, version-checked mutations. It stores explicit cutoff/section/source metadata with each expense. Backup, journal, and verified totals are in `tmp/design-preview/rental-weekly-verified.json`. Repeating the reconciliation must produce zero new or updated expenses; changed reconciled amounts require review.

## Extraction and system comparison

The workbook contains 65 sheets: 21 equipment sheets, 20 weekly sheets, 20 summary sheets, and 4 empty sheets. The existing importer extracted 1,424 expense candidates. Three identical weekly repeats were excluded, leaving 1,421 candidates. Another 114 subtotal controls were excluded from transaction extraction.

The initial system check found 11 active expense categories, 1 existing equipment record, and 0 rental expenses. The import added 13 inactive historical equipment records from recognized workbook headings, giving 14 equipment records at import completion. Historical equipment records do not create rental contracts, customers, or receivables.

After review flags, 1,284 expenses totaling ₱3,206,010.87 were inserted and verified against their source dates, itemized amounts, descriptions, categories, and equipment. These records span 20 calendar months and 86 calendar weeks. Another 137 candidates remain held and were not inserted. The imported amount is **the reviewed subset, not the complete workbook total**; monthly-summary differences below remain unresolved.

`scripts/gmea-rental-expenses-import.cjs` loads only the reviewed `readyRecords` through the existing role-checked equipment/expense RPCs in `actions/gmeaRentalWorkbookImport.ts`. It preserves source locators and fingerprints in expense notes, validates all selected rows before writing, backs up the original rental tables, journals inserted IDs, and rejects changed sources rather than overwriting them. The older all-or-nothing importer still blocks while review flags remain. Migration 07 was not needed or applied; monthly income controls were not inserted as expenses or rental payments.

Verification is saved locally in `tmp/design-preview/rental-workbook-import-verified.json`; its backup and journal paths identify the original state and each insertion. Existing rental contracts, items, payments, workers, and assignments remained unchanged. Historical import notifications were marked read so the import does not flood the CEO's new-expense list.

## Entries held for review

- User confirmed holding October's four repeated September entries and January's eight wrong-year dates.
- `OCTOBER WEEKLY!G13:G17` repeats four cash-advance/salary entries in `SEPTEMBER WEEKLY!E13:E17`, totaling ₱14,344.38 per copy. The latest screenshot and instruction identify September's original rows as the intended weekly data, so those four September entries were included once. October's copies remain held. The October equipment entry lacks a complete dated transaction and also remains excluded.
- `JAN2026!V6:V13`: eight ₱100 gasoline entries have January 2025 dates despite the January 2026 sheet heading. Dates are not changed automatically.
- Other cross-sheet matches: `JUN 2025!D21` / `JUL 2025!D6` (₱2,000 Canter diesel); `APR 2026!D12` / `MAY 2026!D4` (₱38,000 Bongo maintenance); `APR 2026!J12` / `MAY 2026!J4` (₱2,000 Red Mini Dump diesel); `JUL 2025!P8` / `AUG 2025!M6` (₱1,000 ANA diesel). These are possible duplicates, not automatic deletions.
- 83 entries under ANA and 1 under ESTRADA need a confirmed equipment/person/group mapping.
- `MAR WEEKLY!C76` and `C106` conflict for Admin salary dated March 21, 2026: ₱5,003.13 versus ₱7,303.50. Neither amount is selected automatically.
- 19 entries have missing or ambiguous dates; another 11 malformed dates have proposed contextual interpretations that require confirmation. Together with the eight wrong-year rows, these make 38 date-related holds. Holds can overlap equipment/duplicate flags.
- In particular, `JAN WEEKLY!C83:C84` say “Feb 31,2026”; the previous parser proposed January 31. That interpretation is now held for confirmation.

## Summary reconciliation

The comparison below uses source worksheet months, so it checks workbook control amounts; it is distinct from the UI's actual transaction-date periods. Extracted amounts include held candidates and exclude the three exact weekly repeats. Do not import monthly expense controls as extra transactions or create a balancing expense merely to force equality.

| Source control | Summary expenses | Extracted details | Details − summary |
| --- | ---: | ---: | ---: |
| APR MONTHLY!C17 | ₱194,275.71 | ₱181,404.68 | −₱12,871.03 |
| MAY MONTHLY!C16 | ₱149,052.01 | ₱165,302.01 | ₱16,250.00 |
| JUN MONTHLY!C16 | ₱212,862.50 | ₱275,909.59 | ₱63,047.09 |
| JUL MONTHLY!C18 | ₱292,357.78 | ₱303,986.70 | ₱11,628.92 |
| AUG MONTHLY!D17 | ₱173,878.76 | ₱181,310.63 | ₱7,431.87 |
| SEP MONTHLY!C16 | ₱122,265.65 | ₱187,102.65 | ₱64,837.00 |
| OCT MONTHLY!C17 | ₱176,770.25 | ₱181,620.25 | ₱4,850.00 |
| NOV MONTHLY!C15 | ₱214,315.33 | ₱222,661.33 | ₱8,346.00 |
| DEC MONTHLY!C15 | ₱144,651.52 | ₱144,351.52 | −₱300.00 |

Monthly income controls exist for April–December 2025. They cannot establish weekly income, individual rental payments, or 2026 income; no amounts were distributed across weeks.

## Validation

Period tests cover leap years, calendar rollover, inclusive week boundaries, category/equipment/search filtering, cent-based VAT/refund totals, and one-count-per-expense monthly membership. Import-review tests cover cross-period copies, wrong-year dates, inferred corrections, and conflicting revisions. Existing rental authorization, database pagination, collection, and deletion checks were run alongside these tests.

TypeScript, lint, and 30 targeted tests passed. Server-render checks confirm full-period totals before pagination, CEO view-only controls, and opening general expense details without a rental. Import tests cover source preservation, rejection of held rows, inactive/missing mappings, GMEA role checks, create-only writes, and recovery journals. A subsequent import dry run found zero new expenses and zero new equipment, confirming that repeating the selected import does not duplicate records.

The earlier live checks of calendar periods (September ₱85,325.08, September 21–27 ₱2,100, and September 14–20 ₱29,914.51) verified the initial historical subset only and are superseded by the explicit weekly reporting totals above.

Current verification: 35 targeted tests, TypeScript, and lint passed. The live page displays September's five cutoffs totaling ₱143,434.46 and September 1–5's full equipment/CA/salary detail totaling ₱40,714.38. Switching to August shows four cutoffs totaling ₱113,300.25 and August 1–9 totaling ₱22,408.92. October opens an empty reporting month; New week defaults to October 5–10 after September's cross-month cutoff and permits custom dates and equipment/CA/salary sections. Its test form was canceled without inserting invented expenses. Existing weekly expenses open with their actual date/price and locked cutoff dates. Tables fit the normal 1536px viewport without horizontal overflow; active tabs are teal with white text, and inactive tabs are white. A final source reconciliation dry run found zero new or updated expenses.
