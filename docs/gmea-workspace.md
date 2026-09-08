# GMEA workspace setup

The application code adds the GMEA role and a separate workspace at `/gmea-projects`.
The example workbook is a reference only: no example projects are seeded. The GMEA account is included in `supabase/seed-users.json`.

## Database setup

Run these files in the Supabase SQL editor in this exact order:

1. `supabase/gmea-01-role.sql` — adds the role. Run this separately and let it commit.
2. `supabase/gmea-02-workspace.sql` — creates the project, contract collection, expense, partner, and reusable option tables. When upgrading the earlier GMEA feature, it copies the accepted quotation total into the project contract amount, removes withholding tax, and removes the legacy quotation and payment tables.
3. `supabase/gmea-03-mutations.sql` — installs the transactional, service-only project, contract collection, and expense mutation function.
4. `supabase/gmea-04-access.sql` — excludes GMEA from the identified broadly readable payroll tables and protects GMEA profile privileges.
5. `supabase/gmea-05-contract-payments.sql` — upgrades collection rows into contract-specific payment terms, adds auditable receipt history, and installs the current mutation function.

Apply all five before making GMEA accounts available. Existing roles retain their access. These migrations may be reapplied without deleting GMEA history. They have been tested against an isolated PostgreSQL engine; they are not automatically applied to the connected Supabase database.

If installing optional payroll-attendance tables later, rerun `gmea-04-access.sql` afterward so its GMEA restrictions also cover those tables.

## Create the account

After database setup, run `npm run seed:users` to create or update the accounts in `supabase/seed-users.json`, including username **gmea**, display name **GMEA**, and role **gmea**. It uses the same temporary password convention as the other seed users; edit the seed entry before running if needed. This command updates all listed seed accounts, including their passwords.

GMEA users share the company workspace and can create/edit projects and expenses. CEO can view the workspace and record details. Other roles cannot access it. GMEA navigation contains Projects and Settings; payroll restoration and overlays are skipped.

## Workflow

1. Create a project with its project name, optional client, project location, contract amount, and project duration.
2. Choose an editable payment template (80/20, 30/70, 75/25, or 30/30/30/10) or create a custom schedule. Percentage and fixed terms must total the contract amount.
3. Use **Payment Schedule** to record one or more payments against each term. Status is calculated as unpaid, partial, or paid. Incorrect payments are voided with a reason so the audit history remains intact.
4. Record project expenses with their date, description, category, supplier/vendor, OR or invoice number, amount, refunded amount for Sir Edward, payment method, invoice recipient, and VAT treatment.
5. Reuse saved supplier, payment-method, and invoice-recipient values from searchable expense dropdowns. New values are saved automatically when the expense is saved.
6. Review the contract cost summary: contract amount, total project expenses, total net profit, and partner shares.

GMEA users can permanently delete projects. Expense deletion requires confirmation. Saving a stale project version fails with a reload message and retains entered form data.

The project detail page opens on Payment Schedule and shows contract amount, total expenses, net profit, and project duration above the tabs. New expenses create a persistent unread notification for each active CEO. The CEO sees a New badge on the GMEA project and expense row, hears the existing notification sound when the unread count increases, and clears the badge only by opening that expense's Details modal.

## Calculation rules

- Currency: PHP. Prices and amounts use two decimal places; quantities allow four.
- VAT is fixed at 12% when applied.
- Inclusive VAT: base = gross ÷ (1 + rate); VAT = gross − rounded base.
- Exclusive VAT: VAT = rounded base × rate; gross = base + VAT.
- Each expense contributes its gross amount once.
- Payment terms must total the contract amount exactly. The final percentage term receives any one-cent rounding remainder.
- Only posted receipts count toward received and outstanding totals; voided receipts remain visible in history.
- Total net profit = contract amount − gross expenses.
- Distributable profit = maximum of total net profit and zero.
- Partners default to Eng. Ruel Dumaguit and Sir Edward at 50% each. Shares must total 100%; the final partner receives any cent-rounding remainder.
Invoice numbers remain text to preserve leading zeros.

Reimbursements, spreadsheet imports/exports, payment receipt file uploads, and integration with construction/payroll approvals are outside this version.

## Verification

- `npm run test:gmea`: calculation, validation, database transaction, and access regression tests.
- `npm run test:gmea:browser`: isolated actual-component browser workflow using a disposable local PostgreSQL database. Uses installed Edge by default; set `GMEA_TEST_BROWSER=chrome` to use Chrome. No production credentials or data are used.
- `npm test`, `npm run lint`, `npm run build`: repository regression checks.

The browser harness is only a test script, not an application route.

