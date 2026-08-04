# Repository Guidelines

## Project Structure & Module Organization

Roomly is an npm-workspaces monorepo:

- `apps/api/` — Express/TypeScript modular monolith. Features live under `src/modules/<feature>` and separate routes, controllers, services, repositories, schemas, and types. Prisma schema, migrations, and seed are in `apps/api/prisma/` and `src/database/`.
- `apps/web/` — Vite/React frontend. Pages are in `src/pages/`; reusable feature code is under `src/features/`; shared UI, API client, providers, and styles are in `src/components/`, `src/lib/`, `src/app/`, and `src/styles/`.
- `packages/shared/` — public API contracts, enums, and shared types only; do not expose backend internals.
- `docker-compose.yml` — PostgreSQL, API, and production nginx-served web services.

Keep tests close to the code they cover, using names such as `booking-overlap.test.ts`.

## Build, Test, and Development Commands

- `npm run dev` — start API and Vite web development servers.
- `npm run build` — build shared types, API, and web bundles.
- `npm run typecheck` — run TypeScript checks across workspaces.
- `npm test` — run all Vitest suites.
- `npm run lint` — run ESLint across workspaces.
- `npm run format` / `npm run format:check` — format or verify formatting.
- `npm run db:migrate` and `npm run db:seed` — deploy Prisma migrations and load idempotent fixtures.
- `docker compose up --build` — run the full stack at `http://localhost:3000`.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, semicolons, single quotes, trailing commas, and a 100-character print width. Run Prettier and ESLint before committing. Use PascalCase for React components, camelCase for functions and variables, and kebab-case for filenames. Keep HTTP concerns in controllers, business rules in services, and database access in repositories.

## Testing Guidelines

Vitest is the test runner; Supertest covers API behavior. Add focused unit tests for pure business logic and integration tests for endpoint changes. Run `npm test`, plus typecheck and lint, before opening a PR.

## Commit & Pull Request Guidelines

Use Conventional Commits, matching project history: `feat(web): ...`, `fix(api): ...`, or `feat: ...`. Keep commits focused. PRs should explain user-visible behavior, list validation commands, mention migrations or environment changes, and include desktop/mobile screenshots for UI work. Link the relevant issue when one exists.

## Security & Configuration

Copy `.env.example` to `.env`; never commit credentials, session secrets, or local database data. Validate required API environment variables at runtime. Store booking timestamps in UTC and apply `Europe/Kyiv` working-hour rules through the existing service layer.
