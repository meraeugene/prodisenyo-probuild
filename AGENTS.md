# Repository Guidelines

## Architecture

- Keep route files in `app/` thin. Page files should primarily assemble feature-level components and avoid holding large business logic blocks.
- Organize domain code by feature under `features/<feature-name>/`.
- Prefer this feature structure when adding or refactoring code:

```text
features/<feature-name>/
  components/
  hooks/
  utils/
  types.ts
```

- Use `components/` for presentational and feature UI.
- Use `hooks/` for reusable client-side state, effects, and data orchestration.
- Use `utils/` for pure helpers, selectors, mappers, and formatting logic.
- Use `types.ts` for feature-local types when they do not belong in shared global types.
- Prefer co-locating feature code instead of scattering files across `app/`, `components/`, and `lib/` unless the code is truly shared app-wide.

## Naming Conventions

- Use PascalCase for React component file names, for example `BudgetTrackerPageClient.tsx` or `AttendanceAnalyticsSection.tsx`.
- Use camelCase for non-component files, for example `budgetTracker.ts`, `analyticsSelectors.ts`, or `payrollMappers.ts`.
- Name hooks with `use...`, for example `useHistoricalDashboardData.ts`.
- Name server action exports with an `Action` suffix when they represent callable mutations, for example `createBudgetProjectAction`.
- Keep feature folder names kebab-case, for example `budget-tracker` and `payroll-reports`.
- Keep helper names explicit. Prefer names like `buildBudgetSummary`, `formatPayrollPeriod`, or `selectAvailableSites` over vague names like `helper` or `data`.

## Actions

- Put server mutations and privileged data writes in `actions/*.ts`.
- Prefer calling server actions from UI rather than embedding write logic directly in components.
- Keep actions focused by domain, for example `actions/budgetTracker.ts` for budget tracker mutations.
- Validate and normalize inputs inside actions before writing to the database.
- Revalidate affected routes after successful mutations when needed.
- Prefer one action file per domain area instead of placing unrelated mutations in the same file.
- Read operations that are server-only but not mutations can live in `lib/` or feature-specific server helpers when that keeps `actions/` focused on writes.

## Component Rules

- Keep large client components split into smaller feature components when sections become independent or reusable.
- Avoid putting data transformation utilities inline inside JSX files when they can live in `utils/`.
- Prefer feature imports such as `@/features/analytics/components/...` over creating unrelated shared abstractions too early.
- Keep page files close to this pattern:
  - fetch or read minimal route params/search params
  - render one feature entry component
  - avoid embedding long JSX sections or domain logic
- If a component exceeds a comfortable review size, split by responsibility, for example page shell, filters, tables, dialogs, cards, and charts.
- Do not let a feature page client become a monolith. Prefer a page client that assembles smaller components rather than owning all JSX directly.
- Target under `250` lines for most components.
- If a component grows past roughly `300` lines, strongly prefer splitting it.
- If a component approaches `500+` lines, treat that as a refactor requirement, not a preference.
- Never create or extend a feature component beyond `500` lines without first refactoring it into smaller components, hooks, or utilities.
- If a feature needs multiple large sections, extract separate files such as `FeatureHeader`, `FeatureBoard`, `FeatureSummaryPanel`, `FeatureTable`, `FeatureFilters`, or `FeatureModal`.

## Hook Rules

- Extract a hook when stateful logic is reused, hard to scan inside a page/component, or mixes fetching with UI rendering.
- Name hooks with the `use...` convention and keep them in the owning feature's `hooks/` folder.
- Hooks should not perform privileged writes directly; use server actions for mutations.
- Hooks may coordinate calls to actions, query clients, transitions, filters, and derived UI state.
- Keep hooks focused on stateful behavior. If part of the logic becomes pure, move that part into `utils/`.
- Target under `250` lines for most hooks.
- If a hook grows past roughly `300` lines, split it by concern, for example:
  - `useFeaturePage`
  - `useFeatureFilters`
  - `useFeatureModal`
  - `useFeatureDragAndDrop`
  - `useFeatureMutations`
- Keep hooks responsible for orchestration and state, not large JSX blocks or pure formatter logic.
- Never create or extend a hook beyond `500` lines without first splitting it by concern.

## Utility Rules

- Keep utilities pure when possible.
- Put selectors, mappers, formatting, and derived-data helpers in `utils/`.
- Do not place React hooks or JSX in `utils/`.
- Prefer one utility file per concern, for example `budgetFormatters.ts`, `attendanceSelectors.ts`, or `payrollMappers.ts`.
- If a utility becomes shared across multiple features, move it to `lib/` only after it is clearly cross-domain.
- When a component contains multiple helper functions, extract them into `utils/` instead of leaving them inline.
- Prefer separate utility files by purpose, such as:
  - `featureFormatters.ts`
  - `featureSelectors.ts`
  - `featureMappers.ts`
  - `featureConstants.ts`

## Import Boundaries

- Prefer importing within the same feature first.
- Use `components/*` only for reusable cross-feature UI primitives.
- Use `lib/*` for shared infrastructure, auth, Supabase clients, and cross-feature business helpers.
- Use `types/*` for shared application-level types, and `features/*/types.ts` for feature-local types.
- Avoid circular dependencies between features.

## File Placement

- `app/(dashboard)/*/page.tsx`: route entry points only.
- `features/*/components/*`: feature UI.
- `features/*/hooks/*`: feature hooks.
- `features/*/utils/*`: feature utilities.
- `actions/*`: server actions and write operations.
- `components/*`: only truly shared cross-feature UI primitives.
- `lib/*`: app-wide infrastructure and cross-domain helpers.
- `types/*`: app-wide shared types.

## Preferred Workflow For New Code

- When adding a new feature:
  - create the route entry in `app/`
  - create the feature folder in `features/`
  - add feature components in `components/`
  - add stateful logic in `hooks/` if needed
  - add pure helpers in `utils/`
  - add mutations in `actions/` if the feature writes data
- When updating an existing feature, prefer matching its current local structure if it already follows these rules.

## Refactoring Preference

- When updating an oversized file, prefer improving the structure instead of adding more logic to the same file.
- If a page or feature client file grows too large, split it into:
  - UI sections in `components/`
  - state/data logic in `hooks/`
  - pure helper logic in `utils/`
  - server writes in `actions/`
- When creating a new feature, do not default to a single `PageClient` file that contains all state, handlers, helpers, modals, and layout.
- Prefer this shape for non-trivial features:
  - `components/<Feature>PageClient.tsx` as a thin assembler
  - `hooks/use<Feature>Page.ts` for page orchestration
  - additional hooks for focused concerns when needed
  - dedicated modal/panel/section components in `components/`
  - pure helpers in `utils/`
- Use the budget tracker refactor as the preferred pattern:
  - thin page client
  - extracted feature hook
  - extracted modal/header/board/summary components
  - extracted formatter utilities

## Current Repo Direction

- Existing examples already follow this pattern:
  - `features/dashboard/hooks/useHistoricalDashboardData.ts`
  - `features/analytics/utils/analyticsSelectors.ts`
  - `actions/budgetTracker.ts`
- Follow these patterns for new work unless the existing local structure in a specific feature clearly requires a different choice.
