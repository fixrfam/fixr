# E2E (Playwright)

End-to-end tests for `apps/web` against a real `apps/server`, MySQL and Redis.

```bash
bun run test:e2e            # from the repo root (needs Docker)
bun run --filter e2e test:ui
bun run --filter e2e stack:down   # remove the e2e containers
```

## What starts

`playwright.config.ts` declares two `webServer`s:

1. `scripts/start-api.ts` — `docker compose -f e2e/docker-compose.yml up --wait` (MySQL on **3307**, Redis on **6380**, tmpfs storage), creates the schema with `drizzle-kit push`, then runs `apps/server` on **3334**. It never touches the dev database (3306/6379).
2. `next dev` for `apps/web` on **3100**, pointed at the e2e API.

Locally, already running servers are reused (`reuseExistingServer`); on CI everything starts fresh.

## Data

`global-setup.ts` runs before the suite, every time:

- truncates every table and flushes Redis;
- inserts the two tenants (`alfa`, `beta`) and their admins directly — company creation requires a Clerk admin session and public sign-up is disabled, so there is no API path for it;
- creates one employee per role in `alfa` **through the API** (`POST /companies/alfa/employees`), so seeding also exercises the API;
- logs every role in through the API and stores `.auth/<role>.json` (`storageState`), so tests start logged in with `test.use({ storageState: authFile("manager") })`.

Seeded users and the shared password live in `fixtures/data.ts`.

## Turnstile

Cloudflare Turnstile is stubbed on both sides so the suite never depends on `challenges.cloudflare.com`:

- browser: `support/turnstile.ts` serves a fake widget script (`page.route`) that immediately returns a token; it also marks `<html data-turnstile-ready>` once rendered, which tests wait for (`waitForTurnstile(page)`) before typing, so React never drops input typed before hydration;
- API: `support/stub-turnstile.mjs` is preloaded into the e2e API process only (`tsx --import`) and answers `siteverify` with success.

No production code changes are involved; the real verification is unit-tested in `apps/server/src/core/lib/turnstile.spec.ts`.

## Rules

- No `waitForTimeout`; use web-first assertions (`await expect(locator).toBeVisible()`).
- Select by role and label, never by CSS class.
- Tests run serially (`workers: 1`) against the shared seeded data.
- Traces, screenshots and videos are kept on failure (`test-results/`), plus the HTML report (`playwright-report/`).
