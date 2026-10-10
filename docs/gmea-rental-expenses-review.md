# GMEA rental expense workbook review

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
