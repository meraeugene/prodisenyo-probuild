# GMEA workspace setup

The application code adds the GMEA role and a separate workspace at `/gmea-projects`.
The example workbook is a reference only: no example projects or accounts are seeded.

## Database setup

Run these files in the Supabase SQL editor in this exact order:

1. `supabase/gmea-01-role.sql` — adds the role. Run this separately and let it commit.
2. `supabase/gmea-02-workspace.sql` — creates the dedicated project, quotation/item, milestone, receipt, expense, and partner tables.
3. `supabase/gmea-03-mutations.sql` — installs the transactional, service-only mutation function.
4. `supabase/gmea-04-access.sql` — excludes GMEA from the identified broadly readable payroll tables and protects GMEA profile privileges.

Apply all four before making GMEA accounts available. Existing roles retain their access. These migrations may be reapplied without deleting GMEA history. They have been tested against an isolated PostgreSQL engine; they are not automatically applied to the connected Supabase database.

If installing optional payroll-attendance tables later, rerun `gmea-04-access.sql` afterward so its GMEA restrictions also cover those tables.

## Create the account

Sign in as Admin, open **Add User**, choose **GMEA**, and enter the desired name, username, email, and temporary password. For a single company login, use display name **GMEA** and username **gmea**. No password or email is hardcoded.

GMEA users share the company workspace and can create/edit projects and financial records. CEO can view the workspace and record details. Other roles cannot access it. GMEA navigation contains Projects and Settings; payroll restoration and overlays are skipped.

## Workflow

1. Create a project with its name and location; client, dates, description, and duration notes are optional.
2. Add an itemized quotation. Enter prices, quantities, a fixed PHP discount, and optional VAT.
3. Accept the quotation when agreed with the client. It becomes the contract value without CEO approval.
4. Configure percentage payment milestones totaling 100%, or use general payments.
5. Record receipts, withholding amounts, and expenses.
6. Review contract profit/loss and the amount available for sharing. Edit partner names and percentages as needed.

Accepted quotations are immutable. **Create revision** opens a new draft; accepting it preserves the previous accepted quotation as superseded. It also recalculates percentage milestones. Existing receipts remain recorded amounts.

Projects can be archived and restored. Financial records are read-only while archived. Draft quotations, receipts, and expenses require confirmation before deletion. Saving a stale project version fails with a reload message and retains entered form data.

## Calculation rules

- Currency: PHP. Prices and amounts use two decimal places; quantities allow four.
- Line total = rounded quantity × unit price; subtotal = sum of rounded lines.
- Discount is deducted before VAT. VAT is off by default. When enabled, enter a rate and select inclusive or exclusive.
- Inclusive VAT: base = gross ÷ (1 + rate); VAT = gross − rounded base.
- Exclusive VAT: VAT = rounded base × rate; gross = base + VAT.
- Each expense contributes its gross amount once.
- Contract settled = cash received + recorded withholding. Outstanding and overpayment are shown separately.
- Contract profit/loss = contract − gross expenses.
- Available for sharing = contract − recorded withholding − gross expenses.
- Distributable profit = maximum of available for sharing and zero.
- Partners default to Eng. Ruel Dumaguit and Sir Edward at 50% each. Shares must total 100%; the final partner receives any cent-rounding remainder.
- Before quotation acceptance, contract-dependent values display **Not set**.

VAT and withholding are entered business-record parameters; no statutory rates are assumed. Receipt references and invoice numbers remain text to preserve leading zeros.

Reimbursements, spreadsheet imports/exports, receipt file uploads, generated quotation documents, and integration with construction/payroll approvals are outside this version.

## Verification

- `npm run test:gmea`: calculation, validation, database transaction, and access regression tests.
- `npm run test:gmea:browser`: isolated actual-component browser workflow using a disposable local PostgreSQL database. Uses installed Edge by default; set `GMEA_TEST_BROWSER=chrome` to use Chrome. No production credentials or data are used.
- `npm test`, `npm run lint`, `npm run build`: repository regression checks.

Browser screenshots are written under `artifacts/gmea/`. The harness is only a test script, not an application route.

