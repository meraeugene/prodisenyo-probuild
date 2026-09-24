# GMEA Rentals Context

This is implementation context for a future Rentals feature. The existing GMEA Projects system is the reference architecture and must remain behaviorally and structurally unchanged.

## Current GMEA architecture

- Routes are thin server components at `app/(dashboard)/gmea-projects/page.tsx` and `app/(dashboard)/gmea-projects/[projectId]/page.tsx`.
- Feature code is isolated under `features/gmea-projects/`: UI in `components/`, client mutation orchestration in `hooks/`, pure validation/calculation/formatting in `utils/`, and server-only reads/database types in `server/`.
- `actions/gmeaProjects.ts` is the public server boundary for reads, writes, unread counts, and marking expenses viewed.
- Reads use the authenticated server client and RLS. `readAllGmeaRows` paginates financial rows to avoid Supabase result-limit undercounting.
- Writes use the admin client only after application authorization, then call database RPCs that independently validate the actor.
- Client pages use SWR with server-provided fallback data. GMEA edit views do not poll; CEO read-only views refresh every 30 seconds.

## Relevant database objects

| Object | Purpose |
| --- | --- |
| `profiles` | Holds the `gmea` and `ceo` roles and active status. |
| `gmea_projects` | Project header, contract amount, appearance, audit IDs, timestamps, and integer `version`. |
| `gmea_expenses` | Project expense payloads stored in `data jsonb`, including VAT mode/rate and refund fields. |
| `gmea_collections` | Contract payment-term payloads stored in `data jsonb`. |
| `gmea_collection_receipts` | Normalized posted/voided receipt history with recorder and void audit fields. |
| `gmea_partners` | Project profit-sharing rows stored in `data jsonb`. |
| `gmea_expense_options` | Reusable supplier, payment-method, and invoice-name values. |
| `gmea_expense_notifications` | Per-CEO unread state for newly created expenses. |
| `can_read_gmea()` | RLS helper allowing active GMEA and CEO profiles to read GMEA data. |
| `mutate_gmea_project(...)` | Service-role-only command RPC for all project mutations. |
| `mark_gmea_expense_viewed(...)` | Service-role-only RPC that validates an active CEO and marks that CEO's notification read. |

The authoritative migration chain is `supabase/gmea-01-role.sql` through `supabase/gmea-06-project-appearance.sql`. The current model intentionally removed the legacy quotation, milestone, and receipt tables; contract terms plus `gmea_collection_receipts` are the active payment model.

## Auth and role rules

- `gmea` signs in to `/gmea-projects` and may otherwise access only `/gmea-projects/**` and `/settings/**`.
- `/gmea-projects` is protected in both `proxy.ts` and `lib/supabase/middleware.ts`.
- Page/query reads call `requireGmeaAccess()`, which allows active `gmea` and `ceo` profiles.
- Mutations call `requireGmeaAccess(true)`, which allows only an active `gmea` profile.
- CEO access is read-only. This is enforced by hidden edit controls, server-action authorization, revoked direct table writes, and an actor check inside the mutation RPC.
- GMEA and CEO may read the shared project data through RLS. Expense-notification reads are limited to the active CEO who is the notification recipient.

## Server-action pattern

Follow the shape, not the existing project implementation:

1. Define a discriminated mutation command type.
2. Normalize and validate every command server-side before database access.
3. Validate UUIDs and the expected aggregate version.
4. Authorize reads and writes separately.
5. Call one domain RPC for transactional writes; pass the authenticated actor ID explicitly.
6. Revalidate affected list and detail routes.
7. On the client, invalidate both list and detail SWR keys, refresh the router, and redirect after create/delete when appropriate.

Do not permit direct authenticated inserts, updates, or deletes. The RPC must recheck role and active status even though the action already authorized the request.

## Collections, expenses, and VAT

- Payment terms belong to a project and must total the contract amount. Existing receipt history prevents destructive term removal or reducing a term below its posted receipts.
- Receipts are append/audit oriented: posted receipts count toward collections; voiding preserves the row and records actor, time, and reason. Overpayments and future receipt dates are rejected.
- Expenses are validated server-side and saved transactionally. Supplier, method, and invoice-name values are upserted into reusable options.
- VAT modes are `off`, `inclusive`, and `exclusive`; non-off VAT is normalized to 12%. Base, VAT, and gross values are derived by pure calculation helpers rather than stored as separate authoritative totals.

## CEO access and unread expenses

- A new expense creates one `gmea_expense_notifications` row for every active CEO. Updating an existing expense does not create another notification.
- CEO project reads join only that CEO's unread notifications and expose transient `expense.is_new` flags to the UI.
- The CEO portfolio supports an unread-expenses filter and new-expense indicators. The navigation count is loaded through a CEO-only action, refreshed on focus/visibility and every 30 seconds.
- Opening an unread expense calls `markGmeaExpenseViewedAction`, refreshes list/detail SWR data, and dispatches `gmea:expense-viewed` so the sidebar count refreshes.

## Concurrency pattern

- `gmea_projects.version` is the aggregate version and starts at `1`.
- Every update sends the currently loaded version to `saveGmeaProjectAction` and `mutate_gmea_project`.
- The RPC locks the project row with `FOR UPDATE`, rejects a stale version, performs the command transactionally, then increments the version.
- Create commands use no version. Existing-project commands require a positive integer version. Rentals should use the same optimistic-concurrency pattern on its own root aggregate table.

## Reusable UI patterns

- Thin route components that select a GMEA or CEO presentation.
- A shared workspace component driven by `canEdit`, with edit controls absent for CEO.
- Portfolio hero, summary cards, searchable/filterable lists, and detail workspaces with tab navigation.
- Focused dialog, confirmation, field, form, and row components rather than a monolithic page client.
- Pure calculation/formatting/validation helpers and a feature-local mutation hook.
- Server-rendered fallback data plus SWR refresh for read-only oversight screens.

Reuse visual and orchestration patterns by creating Rentals-owned components and utilities. Avoid importing project-specific types, calculations, commands, or database helpers into Rentals.

## Files Rentals should avoid modifying

Keep the existing Projects implementation unchanged, especially:

- `app/(dashboard)/gmea-projects/**`
- `features/gmea-projects/**`
- `actions/gmeaProjects.ts`
- `supabase/gmea-01-role.sql` through `supabase/gmea-06-project-appearance.sql`
- Existing `gmea_projects`, `gmea_expenses`, `gmea_collections`, `gmea_collection_receipts`, `gmea_partners`, `gmea_expense_options`, and `gmea_expense_notifications` objects

Future Rentals work may add narrowly scoped entries to shared auth/navigation files (`proxy.ts`, `lib/auth.ts`, `actions/auth.ts`, `lib/supabase/middleware.ts`, and `features/navigation/components/DashboardNavigation.tsx`), but it should not alter the existing `/gmea-projects` rules or GMEA Projects navigation behavior.

## Recommended Rentals names

Use a separate `gmea_rental_*` namespace rather than adding rental semantics to project tables:

- `gmea_rentals` - root rental/property aggregate with `version`
- `gmea_rental_units`
- `gmea_rental_customers` (or `gmea_rental_tenants` if the domain is property-only)
- `gmea_rental_contracts`
- `gmea_rental_charges`
- `gmea_rental_payments`
- `gmea_rental_expenses`
- `gmea_rental_expense_options`
- `gmea_rental_expense_notifications`

Recommended RPC names: `mutate_gmea_rental(...)` and `mark_gmea_rental_expense_viewed(...)`. Add Rentals in a new migration sequence; do not amend the existing GMEA migration files.

Recommended routes:

- `/gmea-rentals` - Rentals portfolio/list
- `/gmea-rentals/[rentalId]` - rental workspace

Keep workspace sections as tabs initially (for example Overview, Contracts, Collections, Expenses, and Summary) instead of creating extra routes unless later requirements need independently addressable pages.
