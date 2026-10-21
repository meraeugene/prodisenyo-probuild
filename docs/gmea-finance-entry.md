# Rental entry and operation expenses

Rentals keeps its overall payment/expense cards, a compact income/combined transaction table, and a weekly expense table with one week per page. Its header has Rental income and Rental expense actions. Operation Expenses is a separate sidebar page for GMEA and CEO users.

## Overall dashboard

The GMEA Dashboard is the GMEA landing page and is also available to CEO users. It combines posted rental receipts (including manual customer entries and confirmed historical receipts) and project collections, then subtracts rental net expenses, project gross costs, and operation expenses. Contract and rental charges are receivables, not collected income. Project payer reimbursements do not reverse project costs. Outstanding balances, project/rental counts, and a 12-month transaction-date chart provide supporting detail. Undated imported receipts remain in overall totals but are excluded from the dated chart. SWR refreshes every five seconds while visible, on focus/reconnection, and after finance saves. There is no manual Refresh button.

## Saved input choices

GMEA forms share searchable choices for payment method, supplier/payee, and invoice issued to using the existing `gmea_expense_options` table. New nonblank values are normalized and stored by authorized server actions before the financial write, so a lookup-storage error cannot make a completed transaction appear unsaved. The existing unique index deduplicates case variants. A choice can remain in the directory if the subsequent financial write is rejected; this does not create or change any financial record. No new migration or client database-write permission is required.

Choices also include values from saved project, rental, and operation records. Company/client, location/address, and rental service suggestions come from those records. Amounts, dates, invoice/reference numbers, and descriptions remain direct inputs. Fixed categories remain their existing native dropdowns. Searchable controls support typing a new value, selection, arrow keys/Enter/Escape, and popups that stay inside the viewport. Read-only forms cannot change or add choices. Shared SWR suggestions refresh after saves.

## Rental table and filters

Rentals shows All records / Income / Expense tabs below the overall cards. All three tabs share compact table styling, row spacing, links, and mobile cards. Expense has four columns in workbook order: Date, Vehicle / Payee, Description, and Amount. Description shows diesel, maintenance, cash advance, salary, or other saved expense descriptions. Vehicle / Payee accommodates both equipment and salary/cash-advance recipients. Payment method, transaction type, and company/location columns are omitted from the Expense table. Expense displays one complete week per page with individual expenses in the source worksheet's row order and a weekly total above the table. Equipment precedes cash advances and salaries exactly as in Excel, even when a payee's transaction date falls earlier. The weekly total sums only retained rows, excluding admin entries as instructed. The Week range dropdown shares the main filter row with Company, Location, Month, and Reset filters; it lists available source cutoffs earliest first, and page controls navigate the same weeks. Selecting a month limits these week choices; changing the month, search, company, or location returns to the earliest matching week. Weeks are not split by record pagination. Manual expenses without reporting cutoffs appear on a separate Other expenses page. Selecting equipment or a payee opens that expense's details. Location details show only expenses linked to that location's rentals or income records; returning preserves the main filters.

The Income and All records table has Company / Location, Type, Date, Amount, Payment method, and Actions columns. The expense table adds Actions after its four workbook data columns. Company names open payment history; location names open location totals. History includes service, rental amount, collections, and balance. On smaller screens rows stack without horizontal scrolling. Rentals has no Monthly/Weekly report switch.

The Month dropdown uses receipt dates for income and the source worksheet's reporting month for weekly expenses. Cross-month cutoffs stay intact: September 28-October 3 belongs to September, and the April 2025 worksheet's March 31-April 5 cutoff belongs to April. Month choices reflect the active tab's available data, with an Undated records option for income without a confirmed receipt date. Switching tabs clears a month that has no records in the new tab. Weeks and dated transaction rows run earliest first; undated rows remain last. The Month filter also appears in location details. Reset filters clears the month and aligns with the controls. Financial cards retain their labeled all-time totals.

Only the reviewed non-admin weekly worksheet rows remain from the historical expense import. Equipment-sheet-only imports were backed up and removed on October 21, 2026. One previously split maintenance cost was consolidated to the source's single weekly row. Manual expenses remain supported and appear under Other recorded rental expenses if they have no reporting cutoff. Workbook cutoff metadata is preserved in notes through edits but hidden from editable user notes.

## Rental income

The income form opens directly with company, location, total amount, down payment/date, full payment/date, and a searchable payment-method dropdown. Rental service is optional. It has no Income entry selector. For an existing manual record, Add payment in payment history opens the form with that record already selected and its identity/charge read-only. New receipts append without replacing prior payments or duplicating the rental charge. Customer entries use version checks and a row lock to prevent stale updates and overpayments.

Existing Excel archives retain their original source snapshots, worksheet rows, and confirmed/held receipts. GMEA may edit normalized company, location, service, and charge fields; removing an imported income record marks it deleted in the normalized data and excludes it from displayed records and totals. A shared import revision protects concurrent edits without rewriting source evidence or import timestamps. New customer entries are stored separately. Existing booked rentals keep their Collections editor. Payment history distinguishes customer entries from imported records and booked rentals.

## Rental expenses

New rental expense entry has date, category, description, amount, supplier/payee, and payment method. Supplier/payee and payment method use shared searchable dropdowns that allow entering new values. Invoice and notes are optional Additional details. New entry has no related-rental, scope, equipment, cutoff, VAT, or refund controls and saves a general rental expense with no VAT/refund. Existing expense editors and workbook cutoff records retain their data and advanced controls. Saved expenses appear in the transaction table and contribute to the financial totals. Selecting an expense opens its details; CEO access is read-only.

## Operation expenses

Operation expenses have four categories: Transportation, Water, Salary and Electricity. They are stored separately from rental expenses and are not added to rental totals. GMEA can create, edit, and delete; CEO can read and inspect details. Authenticated clients cannot write directly; server actions require an active GMEA profile. Edits and deletes check the expected version. Confirmed deletions update the list, period totals, and dashboard and show a success toast.

Saved expenses are immediately merged into the list cache. Saving switches the page to the saved record's month, clears search/category filters, returns to Expenses, and resets pagination so a previous reporting filter does not conceal the new entry. The initial reporting month follows the latest loaded expense, including expenses fetched after an initially empty page. The list refreshes on focus and every 30 seconds. A read-only check on October 21, 2026 found one live operation expense totaling PHP 5,800 in April 2026; an October 2026 filter correctly shows zero for that record.

New operation expenses use a stable client record ID during a save attempt. Retrying the same ID with the identical normalized fields and creator returns the saved row with an "already added" toast, rather than inserting it twice. A different payload for that ID is rejected, and edits retain version checks. Separate intentional entries receive new IDs.

Monthly reports use expense transaction dates within the selected calendar month. Weekly reports run Monday–Sunday, including weeks spanning months and years. Summary cards use the entire filtered period before pagination. Search and category filters apply to both cards and the table.

The toolbar uses the same full-width panel layout as Projects, with summary cards outside the records panel. Expenses and Analytics views preserve period/search/category filters. Analytics shows monthly expenses grouped into weeks within the selected month, or weekly expenses grouped into seven days, plus category totals. Chart values use the same filtered records as the cards, and accessible data tables are available under each chart. The operation expense modal is limited to 640px on desktop.

## GMEA save feedback and repeat entry

Save and add again uses a blue background, distinct from the normal teal save action. Main GMEA project, rental income, rental expense, booking, equipment, and operation expense tables expose Edit and Delete for authorized GMEA users. Deletes require confirmation and reject stale records. Income actions operate on the whole income record; individual payment receipts and crew assignments retain their existing workflows. Deleting customer/imported income removes its receipts from income totals while retaining linked expenses; deleting a booking retains the existing cascading deletion confirmation. Income metadata edits preserve receipts and reject charges below posted receipts. Booking metadata edits leave billing items unchanged.

Writable GMEA project, rental, equipment, and operation forms show success toasts after the server confirms a save. Record-entry dialogs offer the normal save action and Save and add again. The latter keeps the dialog open and starts a fresh form with reset validation and a new record ID; editing an expense or worker first saves that edit, then opens a new entry. Project configuration forms retain their project context. New project/rental repeat saves stay on the current page. Normal keyboard submission uses the normal save action.

Failed saves keep the entered values, show the error, and do not emit success or reset the form. Cancel and close remain available after a failed repeat save. Save controls are disabled while a request is pending. Read-only and destructive confirmation dialogs do not offer repeat entry. List/dashboard/input-option refresh failures do not turn a confirmed write into a reported save failure.

## Database setup

Apply these migrations before enabling entry in the connected database:

1. `supabase/gmea-rentals-10-customer-entry.sql` after the existing Rentals migrations 01–09.
2. `supabase/gmea-operation-expenses.sql`.

Both are idempotent and add tables/functions without importing workbook values or altering existing payments. Reads keep the existing workbook available when a new table has not been created yet; other query failures remain visible. Saving requires the migrations.

Both migrations are applied to the connected Supabase project. The database API exposes the customer income table, income/expense save functions, expense linkage field, and operation expense table.

## Verification

`node --test tests/gmeaRentalRecordActions.test.cjs` checks income edit/delete authorization, version conflicts, preserved receipts/source evidence, import concurrency, and deleted-record filtering against PGlite. `node tests/workspace/browserCheck.cjs --gmea-record-actions` checks blue repeat buttons, main table actions, delete cancellation/confirmation, updated weekly and operation totals, income edits/deletes, CEO restrictions, and mobile layout using offline fixtures.

`node --test tests/gmeaOperationExpenseActions.test.cjs tests/gmeaOperationExpenses.test.cjs` verifies persistence, idempotent retry, conflicting retries, version checks, authorization, input validation, and period/category totals. `node tests/workspace/browserCheck.cjs --gmea-save-again` checks operation visibility after saves, repeat saves with distinct IDs, edit-to-create behavior, failure preservation/cancel, rental and project repeat entry, success toasts, keyboard submission, GMEA modal coverage, CEO read-only access, and mobile footers.

`node --test tests/gmeaCustomerEntry.test.cjs tests/gmeaOperationExpenses.test.cjs tests/gmeaRentalPortfolio.test.cjs` covers actual SQL in PGlite, authorization, duplicate/stale saves, overpayments, location expense links, date boundaries and totals.

`node tests/workspace/browserCheck.cjs --gmea-finance` covers the forms, later payments, linked rental expenses, operation expense creation/editing, period filters, CEO restrictions and mobile layouts using offline fixtures. It does not create test entries in the connected database.

`node --test tests/gmeaDashboard.test.cjs tests/gmeaRentalWorkbook.test.cjs` verifies the overall cash calculation, undated receipts, date boundaries, payment/expense tabs, and cutoff validation. The finance browser check also verifies workbook table columns, filter resets, cutoff entry, dashboard refresh, CEO access, and mobile dashboard layout.
