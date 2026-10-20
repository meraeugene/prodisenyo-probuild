# Rental entry and operation expenses

Rentals keeps its overall payment/expense cards and one transaction table. Its header has Rental income and Rental expense actions. Operation Expenses is a separate sidebar page for GMEA and CEO users.

## Overall dashboard

The GMEA Dashboard is the GMEA landing page and is also available to CEO users. It combines posted rental receipts (including manual customer entries and confirmed historical receipts) and project collections, then subtracts rental net expenses, project gross costs, and operation expenses. Contract and rental charges are receivables, not collected income. Project payer reimbursements do not reverse project costs. Outstanding balances, project/rental counts, and a 12-month transaction-date chart provide supporting detail. Undated imported receipts remain in overall totals but are excluded from the dated chart. SWR refreshes every five seconds while visible, on focus/reconnection, and after finance saves. There is no manual Refresh button.

## Saved input choices

GMEA forms share searchable choices for payment method, supplier/payee, and invoice issued to using the existing `gmea_expense_options` table. New nonblank values are normalized and stored by authorized server actions before the financial write, so a lookup-storage error cannot make a completed transaction appear unsaved. The existing unique index deduplicates case variants. A choice can remain in the directory if the subsequent financial write is rejected; this does not create or change any financial record. No new migration or client database-write permission is required.

Choices also include values from saved project, rental, and operation records. Company/client, location/address, and rental service suggestions come from those records. Amounts, dates, invoice/reference numbers, and descriptions remain direct inputs. Fixed categories remain their existing native dropdowns. Searchable controls support typing a new value, selection, arrow keys/Enter/Escape, and popups that stay inside the viewport. Read-only forms cannot change or add choices. Shared SWR suggestions refresh after saves.

## Rental table and filters

Rentals shows one transaction table below the overall cards. Its Type column and All records / Income / Expense filters support a shared income and expense view. All saved expenses, including imported workbook expenses without a linked rental, appear in the main table. Location details show only expenses linked to that location's rentals or income records. Company, location, payment-type, search, and Reset filters share the same toolbar. Location names open that location's cards and single transaction table; returning preserves the main table filters.

The compact table has five columns: Company / Location, Type, Date, Amount, and Payment method. Company names open payment history; location names open location totals. History includes service, rental amount, collections, and balance. On smaller screens rows stack without horizontal scrolling. Rentals has no Monthly/Weekly report switch.

The Month dropdown filters income by receipt date and expenses by transaction date, with separate month/year choices and an Undated records option for entries without a confirmed receipt date. Records retain newest-first ordering, with undated rows last. The same Month filter appears in location details and resets pagination when changed. Reset filters clears the month and aligns with the filter controls. Financial cards retain their labeled all-time totals.

## Rental income

The income form opens directly with company, location, total amount, down payment/date, full payment/date, and a searchable payment-method dropdown. Rental service is optional. It has no Income entry selector. For an existing manual record, Add payment in payment history opens the form with that record already selected and its identity/charge read-only. New receipts append without replacing prior payments or duplicating the rental charge. Customer entries use version checks and a row lock to prevent stale updates and overpayments.

Existing Excel archives retain their source evidence and confirmed/held receipts. New entries are stored separately from the immutable archive, and both are included in the transaction table and financial cards. Existing booked rentals keep their Collections editor. Payment history distinguishes customer entries from imported records and booked rentals.

## Rental expenses

New rental expense entry has date, category, description, amount, supplier/payee, and payment method. Supplier/payee and payment method use shared searchable dropdowns that allow entering new values. Invoice and notes are optional Additional details. New entry has no related-rental, scope, equipment, cutoff, VAT, or refund controls and saves a general rental expense with no VAT/refund. Existing expense editors and workbook cutoff records retain their data and advanced controls. Saved expenses appear in the transaction table and contribute to the financial totals. Selecting an expense opens its details; CEO access is read-only.

## Operation expenses

Operation expenses have four categories: Transportation, Water, Salary and Electricity. They are stored separately from rental expenses and are not added to rental totals. GMEA can create/edit; CEO can read and inspect details. Authenticated clients cannot write directly; server actions require an active GMEA profile. Edits check the expected version.

Monthly reports use expense transaction dates within the selected calendar month. Weekly reports run Monday–Sunday, including weeks spanning months and years. Summary cards use the entire filtered period before pagination. Search and category filters apply to both cards and the table.

The toolbar uses the same full-width panel layout as Projects, with summary cards outside the records panel. Expenses and Analytics views preserve period/search/category filters. Analytics shows monthly expenses grouped into weeks within the selected month, or weekly expenses grouped into seven days, plus category totals. Chart values use the same filtered records as the cards, and accessible data tables are available under each chart. The operation expense modal is limited to 640px on desktop.

## Database setup

Apply these migrations before enabling entry in the connected database:

1. `supabase/gmea-rentals-10-customer-entry.sql` after the existing Rentals migrations 01–09.
2. `supabase/gmea-operation-expenses.sql`.

Both are idempotent and add tables/functions without importing workbook values or altering existing payments. Reads keep the existing workbook available when a new table has not been created yet; other query failures remain visible. Saving requires the migrations.

Both migrations are applied to the connected Supabase project. The database API exposes the customer income table, income/expense save functions, expense linkage field, and operation expense table.

## Verification

`node --test tests/gmeaCustomerEntry.test.cjs tests/gmeaOperationExpenses.test.cjs tests/gmeaRentalPortfolio.test.cjs` covers actual SQL in PGlite, authorization, duplicate/stale saves, overpayments, location expense links, date boundaries and totals.

`node tests/workspace/browserCheck.cjs --gmea-finance` covers the forms, later payments, linked rental expenses, operation expense creation/editing, period filters, CEO restrictions and mobile layouts using offline fixtures. It does not create test entries in the connected database.

`node --test tests/gmeaDashboard.test.cjs tests/gmeaRentalWorkbook.test.cjs` verifies the overall cash calculation, undated receipts, date boundaries, payment/expense tabs, and cutoff validation. The finance browser check also verifies workbook table columns, filter resets, cutoff entry, dashboard refresh, CEO access, and mobile dashboard layout.
