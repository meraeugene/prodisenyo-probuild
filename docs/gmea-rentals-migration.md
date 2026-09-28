# GMEA Rentals historical migration

Status: **DRY RUN only. No database migration or workbook records were
applied.**

## Source and scope

- Requested repository source: `data/ALL EXPENSES.xlsx` (not present).
- Workbook analyzed: `C:\Users\User\Downloads\ALL EXPENSES.xlsx`.
- Workbook SHA-256:
  '493bd303db97db0acee7f12abc010596dbbc8da0731f2284893ba06d3b3a1443'.
- Parsed with the repository's existing `xlsx@0.18.5` dependency.
- 56 sheets: 20 monthly equipment sheets, 18 weekly sheets, and 18
  monthly summary sheets.
- GMEA Projects / Electronics & Solar were not read or modified by the
  importer.

## Existing Rentals review

The current schema stores equipment, rentals and rental items, posted/voided
payments, workers and assignments, expense categories, expenses, and CEO
expense notifications. Expenses may have no rental or equipment, but require
an active category, valid date, description, positive amount, and version.
Existing server actions authorize writes for active GMEA users, normalize
inputs, and call service-role-only RPCs that independently validate the actor.
Updates use row locks and expected versions.

The read-only database inspection found:

- 1 existing equipment row (`sabas / babab`), which does not match the
  historical equipment.
- 11 active expense categories.
- 0 workers, 0 expenses, and 0 rental payments.
- 1 unrelated current draft rental. It is not referenced or changed.

The current payment structure requires an identifiable rental and charge.
The workbook's Income Rent values are monthly aggregates without client,
equipment, rate, or collection detail. Creating rentals or payments from those
totals would fabricate transactions, so the proposed migration adds a
separate read-only historical monthly-income record type.

## Source rules

- Monthly equipment sheets are the source for individual equipment expenses.
- Weekly sheets contribute only explicit Cash Advance, Driver, Operator,
  Salary/Labor, and 13th-month records.
- Monthly summary sheets are reconciliation controls and historical income
  sources; they never become expense rows.
- Amount-only total cells are controls, not expenses.
- Dates are accepted only when valid as written or when an explicit
  sheet-month-scoped correction is listed below. Missing and genuinely
  ambiguous dates remain rejected.
- Mixed or genuinely unclear historical descriptions map to Miscellaneous
  when no narrower category is supported. The original Excel remark remains
  the expense description and the full source payload remains in the ledger.
- `ANA` and `ESTRADA` remain unresolved equipment headings.

## DRY RUN results

| Measure | Result |
|---|---:|
| Expense records found | 1,417 |
| Unique records after exact weekly deduplication | 1,414 |
| Ready for import | 1,312 |
| Exact duplicates skipped | 3 |
| Conflicting weekly revisions | 2 |
| Invalid or ambiguous dates | 19 |
| Unambiguous dates corrected with explicit rules | 11 |
| Unknown equipment records | 81 |
| Unknown category records | 0 |
| Blocked by unresolved date | 19 |
| Blocked for another reason | 83 |
| Amount-only subtotal/control cells skipped | 114 |
| Existing-database duplicates | 0 |
| Extracted expense amount | 3,585,502.35 |
| Current importable expense amount | 3,326,233.00 |
| Historical monthly income amount | 5,118,136.00 |

Exception amounts overlap when one row has more than one issue:

| Exception | Amount |
|---|---:|
| Remaining invalid/ambiguous date | 62,555.63 |
| Unknown equipment | 184,407.09 |

### Labor and cash-related totals

| Category | Amount |
|---|---:|
| Labor / named salary / admin | 271,226.30 |
| Driver salary | 334,002.26 |
| Operator salary | 458,557.88 |
| Cash Advance | 114,977.51 |

### Expenses by workbook report month

| Month | Extracted expenses |
|---|---:|
| 2025-02 | 120,470.00 |
| 2025-03 | 206,595.00 |
| 2025-04 | 181,404.68 |
| 2025-05 | 165,302.01 |
| 2025-06 | 275,909.59 |
| 2025-07 | 303,986.70 |
| 2025-08 | 181,310.63 |
| 2025-09 | 187,102.65 |
| 2025-10 | 181,620.25 |
| 2025-11 | 222,661.33 |
| 2025-12 | 144,351.52 |
| 2026-01 | 154,653.46 |
| 2026-02 | 159,606.60 |
| 2026-03 | 242,121.08 |
| 2026-04 | 223,594.50 |
| 2026-05 | 162,482.39 |
| 2026-06 | 108,104.41 |
| 2026-07 | 130,355.84 |
| 2026-08 | 126,100.25 |
| 2026-09 | 107,769.46 |

### Historical Income Rent

| Month | Income |
|---|---:|
| 2025-04 | 252,895.00 |
| 2025-05 | 94,341.00 |
| 2025-06 | 614,000.00 |
| 2025-07 | 975,000.00 |
| 2025-08 | 829,700.00 |
| 2025-09 | 621,500.00 |
| 2025-10 | 711,000.00 |
| 2025-11 | 546,600.00 |
| 2025-12 | 473,100.00 |

January-April 2026 summary templates and all later monthly-summary sheets
contain no Income Rent amount.

### Monthly-summary reconciliation

The extracted total uses the requested source hierarchy: monthly equipment
rows plus unique weekly labor/cash records. The summary values are copied from
the weekly 'TOTAL EXPENSES' controls, while
the import source hierarchy uses monthly equipment detail plus unique weekly
labor/cash records. Subtracting weekly labor/cash from each weekly control
therefore gives the weekly ordinary-expense control that can be compared with
the monthly equipment detail.

| Month | Excel summary | Parsed transactions | Difference | Verified explanation |
|---|---:|---:|---:|---|
| 2025-04 | 194,275.71 | 181,404.68 | -12,871.03 | Monthly equipment detail is 12,870.94 below the weekly ordinary-expense control. The remaining 0.09 is a summary transcription: 'APR MONTHLY' has 30,340.65, while 'APR WEEKLY!E69' has 30,340.56. |
| 2025-05 | 149,052.01 | 165,302.01 | 16,250.00 | Monthly equipment detail is 16,250.00 above the weekly ordinary-expense control; the summary exactly equals the weekly controls. |
| 2025-06 | 212,862.50 | 275,909.59 | 63,047.09 | Monthly equipment detail is 63,047.09 above the weekly ordinary-expense control; the summary exactly equals the weekly controls. |
| 2025-07 | 292,357.78 | 303,986.70 | 11,628.92 | Monthly equipment detail is 11,629.00 above the weekly ordinary-expense control. The remaining -0.08 comes from two summary transcriptions: 41,451.26 vs weekly 41,451.25 and 66,586.32 vs weekly 66,586.25. |
| 2025-08 | 173,878.76 | 181,310.63 | 7,431.87 | Monthly equipment detail is 7,431.87 above the weekly ordinary-expense control; the summary exactly equals the weekly controls. |
| 2025-09 | 122,265.65 | 187,102.65 | 64,837.00 | 4,645.00 is monthly-detail excess. The other 60,192.00 is a clear summary transcription: 'SEP MONTHLY' records 6,688.01 for Sep 22-27, while 'SEP WEEKLY!L49' records 66,880.01. |
| 2025-10 | 176,770.25 | 181,620.25 | 4,850.00 | Monthly equipment detail is 4,850.00 above the weekly ordinary-expense control; the summary exactly equals the weekly controls. |
| 2025-11 | 214,315.33 | 222,661.33 | 8,346.00 | Monthly equipment detail is 8,346.00 above the weekly ordinary-expense control; the summary exactly equals the weekly controls. |
| 2025-12 | 144,651.52 | 144,351.52 | -300.00 | Monthly equipment detail is 300.00 below the weekly ordinary-expense control; the summary exactly equals the weekly controls. |

Under the current unresolved-item blocks, the transaction rows that would be
imported total 3,326,233.00:

| Month | Current importable transactions | Legacy Excel control |
|---|---:|---:|
| 2025-02 | 99,970.00 | - |
| 2025-03 | 194,495.00 | - |
| 2025-04 | 179,404.68 | 194,275.71 |
| 2025-05 | 164,302.01 | 149,052.01 |
| 2025-06 | 188,023.75 | 212,862.50 |
| 2025-07 | 290,886.70 | 292,357.78 |
| 2025-08 | 173,645.63 | 173,878.76 |
| 2025-09 | 185,102.65 | 122,265.65 |
| 2025-10 | 177,120.25 | 176,770.25 |
| 2025-11 | 205,711.33 | 214,315.33 |
| 2025-12 | 127,549.64 | 144,651.52 |
| 2026-01 | 145,893.46 | - |
| 2026-02 | 157,106.60 | - |
| 2026-03 | 223,814.45 | - |
| 2026-04 | 215,194.50 | - |
| 2026-05 | 157,482.39 | - |
| 2026-06 | 101,404.41 | - |
| 2026-07 | 121,355.84 | - |
| 2026-08 | 118,000.25 | - |
| 2026-09 | 99,769.46 | - |

These importable totals deliberately exclude every blocked record. Valid
transaction detail remains the import source of truth; legacy controls are
retained only for audit and never generate balancing entries.

All nine mismatches are now explained. They are not caused by subtotal/control
cells being imported, unknown equipment/categories, or malformed dates:
amounts for blocked rows are still included in reconciliation. Exact weekly
duplicates are removed before totals, and weekly labor/driver/operator/cash
records are explicitly included. The primary cause is disagreement between
the workbook's monthly equipment-detail sheets and weekly ordinary-expense
controls. April/July also contain cent-level summary transcriptions, and
September contains a dropped-zero summary transcription. The importer does
not alter transaction amounts to force a tie.

## Review queue

### Equipment

| Raw heading | Records | Evidence and proposed handling |
|---|---:|---|
| ANA | 80 | Appears consistently as its own equipment-style column heading in all 20 monthly equipment sheets. The workbook does not identify an asset type or connect it to another named asset. If the owner confirms it is equipment, create a distinct inactive historical asset named 'ANA'; do not alias it to another vehicle. |
| ESTRADA | 1 | Appears consistently as an equipment-style column heading in 19 monthly sheets, but only one transaction exists. If the owner confirms it is equipment, create a distinct inactive historical asset named 'ESTRADA'; do not guess a vehicle mapping. |

These 81 records remain blocked pending owner confirmation. The other thirteen
normalized equipment names are proposed as separate inactive historical
equipment records with stable 'HIST-*' codes.

The supplied decision fields still contain the literal placeholders
'[PUT MY ANSWER HERE]' for both ANA and ESTRADA. They are not treated as
approvals or equipment names.

### Categories

| Raw remark/category | Records | Approved mapping |
|---|---:|---|
| Diesel/Allo/Food | 1 | Miscellaneous |
| Diesel/Allo/Food- Butuan | 2 | Miscellaneous |
| ATF | 2 | Maintenance |
| Diesel /Allo | 1 | Miscellaneous |
| Maint / Allo | 1 | Miscellaneous |
| Diesel & others | 1 | Miscellaneous |
| Electrical | 1 | Miscellaneous |
| Sticker | 1 | Miscellaneous |
| Ayagan | 2 | Miscellaneous |
| blank | 1 | Miscellaneous |
| 1500 (numeric remark) | 1 | Miscellaneous |

All 14 category records are resolved. A narrower mapping is supported only for
ATF, a maintenance consumable. Every original remark, including blank/numeric
values, remains in the source payload and source locator; nonblank remarks also
remain the expense description.

### Dates

The original 30 date exceptions group as follows:

| Raw date value | Records | Decision |
|---|---:|---|
| blank/missing | 16 | Unresolved; no neighboring date is copied. |
| June 28/30,2025 | 3 | Genuinely multi-day/ambiguous; unresolved. |
| 7//312025 | 2 | Corrected to 2025-07-31 from the July sheet context. |
| Feb 31,2026 | 2 | Corrected to 2026-01-31: both are in the January sheet's final weekly period and February 31 cannot exist. |
| 003-10-25 | 1 | Corrected to 2025-03-10 from the March sheet context. |
| 003-11-25 | 1 | Corrected to 2025-03-11 from the March sheet context. |
| 6/302025 | 1 | Corrected to 2025-06-30. |
| 6/62025 | 1 | Corrected to 2025-06-06. |
| 6/72025 | 1 | Corrected to 2025-06-07. |
| 6/230/2026 | 1 | Corrected to 2026-06-30: it follows June 28 and June 29 rows in the June sheet. |
| 09/10226 | 1 | Corrected to 2026-09-10 from the September sheet and adjacent September 11 sequence. |

Corrections are exact raw-value plus source-month rules, so the same malformed
text in another context is not silently accepted. Eleven records are now
importable; 19 remain blocked.

### Conflicting revisions

| Field | Earlier block | Repeated/revised block |
|---|---|---|
| Source | 'MAR WEEKLY!C76' | 'MAR WEEKLY!C106' |
| Date | 2026-03-21 | 2026-03-21 |
| Description/payee | Salary - ADMIN / ADMIN | Salary - ADMIN / ADMIN |
| Category | Labor | Labor |
| Amount | 5,003.13 | 7,303.50 |

Only the amount differs, by 2,300.37. The Driver and Operator rows in the
second block exactly repeat the earlier block and are safely deduplicated, but
the workbook provides no formula, annotation, or later summary that identifies
which Admin amount supersedes the other. Both records remain blocked; resolving
the conflict requires source-owner confirmation. Together with the third exact
repeat elsewhere, three exact weekly duplicates are skipped and no duplicate
financial transaction enters the ready set.

The supplied salary decision is still the literal placeholder
'[PUT CORRECT AMOUNT HERE]', so neither amount was selected.

### Readiness checkpoint

| Target | Current result |
|---|---|
| Unexplained monthly reconciliation mismatches | 0; all 9 are explained above, though the source totals still disagree. |
| Unresolved conflicting revisions | 1 conflict pair / 2 blocked records; owner confirmation is required. |
| Silently guessed dates | 0; 11 explicit contextual corrections and 19 blocked records. |
| Equipment/category mappings reviewed | Categories complete with 0 blocked; 81 equipment records await the two missing owner answers. |
| Duplicate financial transactions in ready set | 0; 3 exact repeats are skipped and the conflict pair is blocked. |

## Import tooling and safety

'scripts/gmea-rentals-history-import.cjs' defaults to DRY RUN, creates
deterministic IDs and source fingerprints, detects duplicate or changed
sources, and blocks apply mode while review errors remain. Apply mode requires
an active GMEA actor UUID and the confirmation token
'APPLY_GMEA_RENTALS_HISTORY'.

'supabase/gmea-rentals-07-historical-import.sql' is unexecuted. It adds an
import ledger, historical monthly-income records, and a service-role-only RPC
that rechecks the GMEA actor. It uses an advisory lock and unique source keys,
does not update existing Rentals records, and marks trigger-created CEO
notifications read before commit so historical expenses are not shown as new.

Idempotency remains enforced at both layers:

- deterministic IDs and SHA-256 source fingerprints are generated by the
  importer;
- the ledger has a unique source locator;
- rerunning an identical source returns its existing target without inserting;
- a changed fingerprint for an imported locator raises an error instead of
  overwriting data;
- the per-locator advisory transaction lock prevents concurrent double inserts.

The import RPC only inserts new historical Rentals equipment, expenses,
monthly-income rows, and ledger rows. It contains no update/delete path for
existing equipment, rentals, payments, expenses, workers, or Projects /
Electronics & Solar data. A collision or changed source fails rather than
overwriting an existing row.

Dry-run command used:

    node scripts/gmea-rentals-history-import.cjs --workbook
      "C:\Users\User\Downloads\ALL EXPENSES.xlsx" --dry-run

Before a real import: resolve every review item, rerun until blocking counts
are zero, review reconciliation, apply migration 07, back up Rentals tables,
and only then use guarded apply mode. No real import was executed.
