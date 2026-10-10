# Rental income and expenses

The Rentals workspace has separate Rental Income and Rental Expenses sections. Each owns its monthly selection. Bookings and Equipment remain accessible from the same protected route. GMEA can manage records; CEO access remains read-only.

Income has Monthly Overview, Companies, Transactions and Needs review views. Collections use the actual receipt month and only posted or confirmed historical payments. The Companies view groups exact names after normalizing capitalization and whitespace, and keeps individual rentals separate. Down Payment and Full Payment display each receipt's date and amount. Additional installments and legacy unclassified receipts appear in Other collections and count once in Total collected.

Outstanding at month-end uses current rental charges for active and completed rentals whose start date is within or before the selected month, less currently posted receipts through that month. This is a recomputed operational balance, not a historical accounting snapshot: later voids and current rental status affect it. Drafts and cancelled rentals do not contribute outstanding balances.

Expenses retains its existing Monthly Overview, Weekly and History reporting, including reporting-week cutoffs. Income and expenses are not combined into a profit or cash calculation.

Monthly income and Transactions use seven columns: Payment Date, Company Name, Location, Amount, Total Amount, Total, and Mode of Payment. Payment Date includes the full receipt type; each amount and method aligns with its date. Total Amount is the confirmed rental charge, and Total is collections in the selected month. Selecting a company name opens payment history. The Companies directory shows Company Name, Location, and monthly Total.

## Database update

Apply `supabase/gmea-rentals-08-income-payment-types.sql` after the existing Rentals migrations, before deploying payment-type recording. It adds the receipt type and replaces the collections RPC while preserving actor authorization, row locks, expected-version checks, overpayment prevention, and void audit history. It is idempotent and does not import customer workbook data. Existing receipts receive `unclassified`.

Apply `supabase/gmea-rentals-09-customer-income-import.sql` to enable the source-preserving customer archive. Both migrations were applied to the configured database on October 10, 2026. Archive reads use the existing Rentals access policy; the maintenance RPC is restricted to the service role and validates an active GMEA actor.

## Customer workbook

`Gmea Customer (1).xlsx` was imported through `scripts/gmea-customer-income-import.cjs`: 41 historical job records, 46 confirmed receipts totaling ₱724,436, and 18 held payment entries. Twenty-three records have review notes (including missing identity/location details or unconfirmed charges). The archive preserves both sheets' populated cells, formulas and merges. Monthly controls and completed-job lists are retained as source evidence and are not counted as additional receipts. Payment methods and dates are preserved.

The earlier payment layout uses dated Amount entries as individual receipts. The later layout uses separate Down Payment and Full Payment columns. Bill submissions, unclear dates and conflicting later payment columns are held. Row 19 has receipts totaling ₱49,726 against a stated charge of ₱48,726: the clear receipts remain included, while its charge is unconfirmed. Row 100's ₱44,800 is an aggregate of rows 100–102, so each full-payment receipt is counted once and the aggregate is not assigned as a job charge. July 31 receipts remain in July even when grouped under August in the source.

Historical income does not create equipment bookings or invent rental periods. Unconfirmed charges are excluded from outstanding totals and marked in the UI. Needs review spans all months and supports the company and search filters. Source corrections require a reviewed follow-up; repeating the same import is idempotent and changed workbook/parser data is rejected.

Run `node scripts/gmea-customer-income-import.cjs --dry-run` for the preview or `--apply` for the authorized maintenance import. Audit backups and verification results are written under `tmp/rental-income-import/`; the workbook is never edited. The importer verifies the stored payload and unchanged existing rentals, equipment, payments and expenses.
