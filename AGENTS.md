# Fixr — Agent Guardrails

Instructions for AI coding agents (Claude Code, Cursor, Copilot, etc.) working in this repository. This file is the open, tool-agnostic standard; `CLAUDE.md` imports it for Claude Code.

## Project overview

Fixr is a service-order management platform for electronics repair shops (see `README.md` for product context). It's a **Bun workspaces monorepo**:

```
apps/
 ├─ web/      Next.js — client/technician-facing app, JWT auth
 ├─ admin/    Next.js — internal admin panel, Clerk auth
 ├─ server/   Fastify REST API — business logic, DB access
 └─ workers/  BullMQ job processors (email, etc.)

packages/
 ├─ db/                 Drizzle ORM schema, migrations, MySQL connection
 ├─ schemas/            Zod schemas shared between frontend and backend
 ├─ constants/          Shared constants/enums (roles, cookies, masks, messages)
 ├─ env/                Centralized env var validation (Zod, per app)
 ├─ permissions/        RBAC ability definitions
 ├─ mail/                React Email templates + mail queue
 ├─ infra/               Deploy infrastructure
 └─ typescript-config/   Shared tsconfig bases
```

Each app/package with its own local conventions may have its own `CLAUDE.md` — check for one before working there.

## Commands

Run from the repo root unless noted:

- `bun run dev` — start server, web, workers in dev mode
- `bun run dev:admin` — start admin app in dev mode
- `bun run build` / `build:packages` / `build:apps` / `build:<app>` — build
- `bun run check-types` — TypeScript check across all workspaces
- `bun run lint` / `lint:write` — Biome check / autofix
- `bun run format` — `ultracite fix` (formats + safe lint fixes)
- `bun run db:start` / `db:stop` — MySQL + Redis via Docker
- `bun run db:migrate` — apply migrations
- `bun run db:generate` — generate migration SQL from schema changes
- `bun run db:studio` — Drizzle Studio GUI
- Inside `apps/server` or `apps/workers`: `bun run test` (Vitest)

## Code conventions

- **Formatting/linting**: Biome via the `ultracite` preset (`biome.json`). Tabs, double quotes, imports auto-organized. Don't hand-format against these rules or fight the formatter — run `bun run lint:write` instead of manual style edits.
- **TypeScript**: strict mode. Run `bun run check-types` after non-trivial changes.
- **IDs**: use `createId()` from `@paralleldrive/cuid2` for primary keys (`.$defaultFn(() => createId())` in Drizzle schema). Not UUID, not auto-increment.
- **Workspace imports**: use the `@fixr/<package>` workspace protocol with subpath exports, e.g. `@fixr/db/connection`, `@fixr/db/schema`, `@fixr/schemas/account`, `@fixr/permissions`. Don't deep-import across a package's internal file paths.
- **Env vars**: always go through `@fixr/env/<app>` (Zod-validated via `@t3-oss/env-core`). Never read `process.env` directly in app code — add the var to the relevant `packages/env/src/<app>.ts` first.

### Server (`apps/server`) module structure

Each feature lives under `src/modules/<name>/` with a fixed layout:

```
modules/<name>/
 ├─ routes/index.ts        Fastify route registration, wires preHandlers
 ├─ controllers/index.ts   Thin orchestration: parse request, call service, shape response
 ├─ services/index.ts      Business logic
 ├─ repositories/index.ts  Drizzle queries (data access only)
 ├─ schemas/index.ts       Module-local Zod schemas
 └─ errors/index.ts        Module's AppError registry (see below)
```

Follow this layering for new modules/endpoints — don't put query logic in controllers or business logic in repositories.

- **Errors**: every thrown error is a typed key from a registry built with `defineErrors({...})` (see `apps/server/src/modules/account/errors/index.ts` and `src/core/errors`). Throw with `throw new AppError("SOME_KEY")`; never throw raw `Error` or ad-hoc objects from route/controller/service code. Wrap route handlers with `withErrorHandler(...)`.
- **`tryCatch()`** (`src/core/lib/try-catch.ts`) wraps a promise into `{ data, error }` — prefer it over raw `try/catch` where it fits the existing style in that file.
- **Auth/RBAC**: JWT-based (`@fastify/jwt`), role lives at `user.company.role` in the JWT payload. `authenticate` middleware verifies the JWT and loads the user; `requirePermission(permissions.<resource>.<action>)` (from `@fixr/permissions`) gates routes. Add new permissions in `packages/permissions`, don't invent ad-hoc role checks in route handlers.
- **Caching**: repository methods use `@Cached({ ttl, key })` / `@InvalidateCache({ patterns })` decorators from `shared/infra/cache`. When a repository write invalidates cached reads, add the matching `@InvalidateCache` patterns.

### Frontend (`apps/web`, `apps/admin`)

- Next.js App Router. Route groups: `(public)` vs `(protected)` separate unauthenticated and authenticated routes.
- `apps/web` auth is JWT/cookie-based against `apps/server` (see `lib/auth/axios.ts`, `lib/auth/utils.ts`). `apps/admin` auth is **Clerk**, a separate system — don't mix the two apps' auth patterns.
- API calls from `apps/web` go through `lib/services/*.ts` using the shared `axios` instance and the `tryCatch()` helper (`lib/utils`), not raw `fetch`/`axios` calls scattered in components.
- `components/ui/**` and `components/magicui/**` are generated/vendored (shadcn-style) and excluded from Biome linting — treat them as vendored, avoid hand-editing unless intentionally customizing a primitive.

### Database (`packages/db`)

- Schema files live in `src/schema/*.ts` (Drizzle). To change the schema: edit the schema file, then run `bun run db:generate` to produce the migration — don't hand-write SQL in `drizzle/*.sql` or edit `drizzle/meta/*.json` snapshots.
- Shared validation schemas for DB-backed entities live in `packages/schemas`, consumed by both `apps/server` and frontend apps for consistent validation.

## Guardrails — do not do without explicit approval

- **Don't hand-edit generated migration files**: `packages/db/drizzle/*.sql` and `packages/db/drizzle/meta/*` are generated by `drizzle-kit`. Change the schema source and regenerate.
- **Don't commit env files** (`.env`, `.env.production`, etc.) or secrets. `.env.example` files are the place to document new required vars.
- **Don't touch deploy/infra** (`packages/infra`, `.github/workflows/deploy.yml`) or auth secrets (`JWT_SECRET`, `COOKIE_ENCRYPTION_SECRET`, Clerk keys) without the user explicitly asking.
- **Don't weaken RBAC** (removing/bypassing `requirePermission`, loosening `@fixr/permissions` ability rules) to make something "just work" — flag the permission gap instead.
- **Don't bypass Husky/lint-staged** (`--no-verify`) or leave `check-types`/`lint` failing.
- **Never push, and never commit unless explicitly asked.** When asked to commit, use `action(Scope): Message` (lowercase action, capitalized Scope, e.g. `feat(Account): Add avatar removal endpoint`) — enforced by `.husky/commit-msg`.
- Small changes can land directly on `develop`; larger features should get a branch named `action/scope/change` (e.g. `feat/service-orders/bulk-close`).

## Testing

Vitest is set up in `apps/server` and `apps/workers` (`bun run test` from inside the app). Coverage is currently minimal — check whether a module already has tests before assuming a suite exists, and don't remove the placeholder spec files as a way to "pass" checks.
