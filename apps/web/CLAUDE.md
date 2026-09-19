Local context for `apps/web`. Read the root `AGENTS.md` first — this only covers what's specific to this app.

## Stack

Next.js App Router, Tailwind + shadcn/ui (`components/ui`), React Hook Form + Zod (`@hookform/resolvers`) for forms, TanStack Query for server state, `@fixr/permissions` (React bindings via `packages/permissions/src/react.tsx`) for client-side ability checks.

## Structure

- `app/(public)/...` — unauthenticated routes (auth pages, legal, downtime).
- `app/(protected)/...` — authenticated routes (dashboard).
- `lib/auth/` — JWT/cookie auth against `apps/server` (`axios.ts` is the configured client, `utils.ts` has token helpers). This is a different auth system from `apps/admin`'s Clerk — don't cross-wire them.
- `lib/services/` — one file per API resource, wrapping the shared `axios` instance with `tryCatch()`. New API calls go here, not inline `fetch`/`axios` in components.
- `lib/rbac/` — client-side permission checks mirroring the server's `@fixr/permissions` roles; use these instead of re-deriving role logic in components.
- `components/ui/**` and `components/magicui/**` are vendored/generated (shadcn-style) and excluded from Biome — avoid hand-editing unless deliberately customizing a primitive.

## Don't

- Don't call the server API directly from components with raw `fetch`/`axios` — go through `lib/services`.
- Don't duplicate a Zod schema that already exists in `@fixr/schemas` — import and reuse it so frontend/backend validation stays in sync.
- Don't reimplement role/permission checks locally — use `lib/rbac` / `@fixr/permissions`.
