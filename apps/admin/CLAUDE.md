Local context for `apps/admin`. Read the root `AGENTS.md` first — this only covers what's specific to this app.

## Stack

Next.js App Router, **Clerk** for auth (`@clerk/nextjs`, `@clerk/backend`) — this is separate from `apps/web`'s JWT/cookie auth system against `apps/server`. Don't reuse `apps/web`'s `lib/auth` patterns here or vice versa.

## Structure

- `app/(public)/...` vs `app/(protected)/...` route groups, same convention as `apps/web`.
- `components/ui` is vendored (shadcn-style) — treat as generated, avoid hand-editing unless deliberately customizing a primitive.
- Runs on port `6969` in dev (`bun run dev:admin` from root).

## Don't

- Don't introduce a second auth mechanism here — Clerk is the only auth system for this app.
- Don't duplicate Zod schemas already defined in `@fixr/schemas`.
