# Prodisenyo Payroll

Next.js payroll and operations platform for attendance, payroll processing, analytics, dashboards, and budget tracking.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
npm start
```

## Project Structure

```text
app/                    Route entry points and layouts
actions/                Server actions and write operations
features/               Domain code organized by feature
components/             Shared cross-feature UI components
lib/                    App-wide infrastructure and shared helpers
types/                  Shared application types
public/                 Static assets
supabase/               Supabase-related files
```

## Architecture Rules

This repo follows a feature-first structure.

- Keep route files in `app/` thin.
- Put feature code in `features/<feature-name>/`.
- Split feature code into `components/`, `hooks/`, `utils/`, and `types.ts` when needed.
- Put privileged mutations and writes in `actions/*.ts`.
- Keep shared UI in `components/`.
- Keep cross-feature infrastructure and helpers in `lib/`.
- Keep shared types in `types/`.

Preferred feature layout:

```text
features/<feature-name>/
  components/
  hooks/
  utils/
  types.ts
```

## Naming Conventions

- React component files: PascalCase
- Hook files: `use...`
- Utility files: camelCase
- Action files: camelCase by domain
- Feature folder names: kebab-case

Examples from this repo:

- `features/dashboard/hooks/useHistoricalDashboardData.ts`
- `features/analytics/utils/analyticsSelectors.ts`
- `actions/budgetTracker.ts`

## Development Notes

- Prefer adding new UI and logic inside the owning feature instead of placing everything directly in `app/`.
- If a page or client component gets too large, split UI into `components/`, stateful logic into `hooks/`, pure helpers into `utils/`, and writes into `actions/`.
- Avoid putting database write logic directly inside React components.

## Codex Repo Rules

Project-specific Codex instructions live in [`AGENTS.md`](./AGENTS.md).

If you want Codex to follow this structure consistently in this folder, keep `AGENTS.md` up to date whenever the architecture changes.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
