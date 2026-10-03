# Demo data for every role

Run from the repository root:

```sh
npm run seed:data
npm run seed:delete
```

In Windows PowerShell, use `npm.cmd` if your execution policy blocks `npm.ps1`.

Both commands read `.env.local`, then `.env`, preserving environment variables already set in your shell. Requires Node.js 20.12+ and these existing Supabase settings:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The scripts target that Supabase project. Apply the app's Supabase SQL migrations first, including the construction, procurement, payroll attendance/biometric, project documents, GMEA Projects (01–08), and GMEA Rentals (01–06) migrations. Seeding checks the required tables, columns, and storage buckets before creating accounts or records. It does not apply migrations.

## Repair an older database schema

If your database is missing `overtime_multiplier`, payroll attendance review tables, project progress submissions/`progress_date`, or GMEA project `status`, run:

```sh
npm run seed:prepare
```

Open `supabase/demo-seed-schema-repair.sql`, copy the entire file into the **SQL Editor** of the Supabase project configured in `.env.local`, and run it. Then rerun `npm run seed:data`. The file bundles the existing migrations for these gaps into one transaction, includes row-level security policies, reloads the API schema cache, and keeps existing data. It can be rerun. `seed:prepare` generates the local file only; a service-role API key cannot execute database DDL through the table API.

## Sign in

Use the username on the login screen. All new demo accounts have password `DemoUi123!`. Optionally set `DEMO_SEED_PASSWORD` before the first run. Reruns keep existing demo passwords and profile edits.

| Role | Username |
| --- | --- |
| Administrator | `demo_admin` |
| CEO | `demo_ceo` |
| Payroll manager | `demo_payroll` |
| Engineer | `demo_engineer` |
| Purchaser | `demo_purchaser` |
| GMEA | `demo_gmea` |
| Employee | `demo_employee` |

Existing accounts created by `seed:users` are kept. The engineer's projects, purchaser's orders, payroll manager's imports/runs, and employee's overtime requests belong to these demo accounts so role filters show the examples.

## Included examples

- Three sites, six employees, rates, schedules, biometric aliases, attendance logs/review days, leave, and a sample company holiday.
- Six historical approved payroll runs plus draft, submitted, and rejected runs; daily payouts, cash advances, and pending/approved/rejected overtime requests.
- Four construction projects, estimates, cost catalog, budgets, progress reports, tasks, expenses, material requests, purchase orders, delivery verification, receipts, and a closure submission.
- Downloadable sample PDFs for project reports and a purchasing receipt.
- Four GMEA projects with contract payment terms, receipts, expenses, partners, and CEO unread notifications.
- Equipment in several statuses, rental workers/assignments, four rentals, payments, expenses, and rental notifications.

Dates are relative to the current date in Asia/Manila, including history for charts. Repeating the seed creates missing rows using stable IDs and retains edits to existing demo rows. To regenerate dates or reset the examples, delete the seed and run it again. Historical spreadsheet import ledgers are not fabricated; that module has its own import command.

## Cleanup and previews

```sh
npm run seed:data -- --dry-run
npm run seed:delete -- --dry-run
```

Dry runs are offline previews and do not require credentials. Cleanup deletes exact demo IDs, the seed's four PDF files, and auth accounts with both the expected demo email and the seed ownership marker. It never truncates tables or deletes accounts just because their role matches.

Database cascades also remove child records added to demo projects/rentals/runs. Keep demo records separate from real work. If a new record has a restrictive reference to a demo account/project, cleanup stops with an error rather than widening the deletion scope; remove that test record and rerun cleanup. Commands are resumable after partial failures.

Verify fixture constraints, reruns, notification triggers, and cleanup isolation locally with:

```sh
node --test tests/demoSeed.test.cjs
```
