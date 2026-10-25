# Testing

How Fixr is tested, where tests live and the rules every new test follows. AI agents: `AGENTS.md` points here — follow these conventions.

## Stack

| Layer | Tool |
| -- | -- |
| Unit + integration (server, workers, packages) | [Vitest](https://vitest.dev) |
| Unit + component (web, admin) | Vitest + React Testing Library + jsdom |
| HTTP mocking on the frontend | [MSW](https://mswjs.io) |
| Integration DB | [Testcontainers](https://testcontainers.com) (real MySQL 8 + Redis 7) |
| E2E | [Playwright](https://playwright.dev) |

Vitest is pinned once in the root `workspaces.catalog` and every workspace uses `"vitest": "catalog:"`. Don't pin a version inside a workspace.

## Commands

From the repo root:

| Command | What it runs | Needs Docker |
| -- | -- | -- |
| `bun run test` | Unit tests of every workspace (alias of `test:unit`) | no |
| `bun run test:unit` | Same as above | no |
| `bun run test:integration` | `apps/server` integration suite against real MySQL/Redis | **yes** |
| `bun run test:ci` | Unit tests with coverage (what CI runs) | no |
| `bun run test:e2e` | Playwright suite in `e2e/` | **yes** |

Inside a workspace: `bun run test` (everything that workspace has), `bun run test:watch`, `bun run test:unit`, and in `apps/server` also `bun run test:integration`.

## Where tests live

| Kind | File name | Location |
| -- | -- | -- |
| Unit | `*.spec.ts` / `*.spec.tsx` | Next to the file under test (`services/index.spec.ts`) |
| Integration (server) | `*.spec.ts` | `apps/server/test/integration/<module>/` |
| E2E | `*.e2e.ts` | `e2e/tests/` |
| Shared helpers | — | `test/helpers/` of the workspace |
| Factories | — | `test/factories/` of the workspace |

## Rules

- **Unit tests never touch the network, MySQL or Redis.** Repositories and external SDKs are mocked with `vi.mock`. In `apps/server`, `config/redis` is replaced by an in-memory stub for every unit spec (`test/setup-unit.ts`).
- **Integration tests never mock the repository layer.** They go through `app.inject()` → routes → middlewares → services → repositories → Drizzle → real MySQL/Redis. Only third-party services outside our stack are stubbed (Cloudflare Turnstile, Resend, R2 presigning).
- **No snapshot tests of API payloads.** The Zod schema is the contract; assert on the fields that matter.
- **Arrange / Act / Assert**, one behavior per `it`.
- **Name tests after the behavior, not the method**: `it("rejects login with a wrong password")`, not `it("login")`.
- **Zod assertions use paths, not messages**: `schema.safeParse(x)` and assert on `result.success` and `result.error.issues[].path` — messages change, paths don't.
- **Time is faked, never slept**: `vi.useFakeTimers()` / `vi.setSystemTime()` for expirations; Playwright uses web-first assertions, never `waitForTimeout`.
- **Frontend tests query like a user**: `getByRole` / `getByLabelText`, `userEvent` over `fireEvent`, no assertions on internal component state. HTTP goes through MSW, not `vi.mock("axios")`.
- **Don't test vendored UI**: `components/ui/**` and `components/magicui/**` are generated (shadcn-style) and excluded.
- **Security rules are locked by tests.** The RBAC matrix (`packages/permissions`), the route guard sweep (`apps/server/test/integration/rbac`) and tenant-isolation cases fail loudly when a permission or guard changes. Update them deliberately, never to "make CI green".

## Server integration harness (`apps/server`)

```
apps/server/
 ├─ vitest.config.ts          projects: "unit" and "integration"
 └─ test/
     ├─ env.ts                deterministic, non-secret env for every suite
     ├─ global-setup.ts       starts MySQL + Redis containers, creates the schema
     ├─ setup-unit.ts         mocks Redis for unit specs
     ├─ setup-integration.ts  wires container URLs, stubs Turnstile/Resend, truncates between tests
     ├─ helpers/
     │   ├─ app.ts            createTestApp() → buildApp({ logger: false, docs: false })
     │   ├─ auth.ts           createEmployeeSession(app, { role }), signSession(), authedInject()
     │   └─ db.ts             truncateAll(), resetState()
     └─ factories/            makeCompany(), makeEmployee({ role }), makeClient(), makeMaker(), ...
```

- `@fixr/db/connection` creates its pool from `env.DB_URL` **at import time**, so the containers are started in Vitest's `globalSetup` (main process) and the URLs are handed to the workers with `provide()`/`inject()` before any app module is imported.
- The schema is created with `drizzle-kit push` from `packages/db/src/schema` (the migration chain in `packages/db/drizzle` does not currently apply to an empty database — see the note in `test/global-setup.ts`).
- Isolation: every test starts from empty tables (`TRUNCATE` with `FOREIGN_KEY_CHECKS=0`) and an empty Redis (`FLUSHDB`). Files run sequentially against the shared containers.
- Turnstile is stubbed in integration tests (`vi.mock` of `core/lib/turnstile`); the real verification is unit-tested with a mocked `fetch`. In e2e the Cloudflare **test keys** (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`) are used, which always pass.
- Import the app with `buildApp()` from `src/app.ts`. `src/server.ts` is only the process entrypoint (it calls `listen()`).

### Running without Docker

`bun run test` / `bun run test:unit` never need Docker. If Docker isn't available, skip `test:integration` locally and let CI run it (GitHub's `ubuntu-latest` runners ship with Docker).

## E2E (`e2e/`)

See `e2e/README.md`. Playwright starts `apps/server` and `apps/web` against a dedicated database (never the dev database), seeds data **through the API**, and reuses a `storageState` per role so tests don't log in repeatedly.

## CI (`.github/workflows/ci.yml`)

| Job | Runs | When |
| -- | -- | -- |
| `Lint` | `bun run lint:ci` | every PR, push to `develop`/`main` |
| `Types` | `bun run check-types:ci` | every PR, push to `develop`/`main` |
| `Unit tests` | `bun run test:ci` (coverage + thresholds, summary posted on the PR) | every PR, push to `develop`/`main` |
| `Integration tests (server)` | `bun run test:integration` (Docker on `ubuntu-latest`) | every PR, push to `develop`/`main` |
| `E2E tests` | `bun run test:e2e` (HTML report + traces uploaded on failure) | PRs to `main`, push to `develop`/`main`, manual |

- New pushes to a PR cancel the previous run (`cancel-in-progress: true`).
- No secrets are used: every suite ships its own deterministic, non-secret test env (`apps/server/test/env.ts`, `e2e/support/env.ts`). Never wire production secrets into CI.
- **Required checks**: mark `Lint`, `Types` and `Unit tests` (and ideally `Integration tests (server)`) as required in the branch protection of `develop` and `main` (GitHub → Settings → Branches). That is what stops a PR with a broken test from being merged.
- **Relation with `deploy.yml`**: the deploy workflow is intentionally left independent (it is infra, see `AGENTS.md` guardrails). It deploys previews for PRs to `main` and production on pushes to `main`. With the checks above required on `main`, nothing reaches `main` (and therefore production) without green CI; previews for a red PR can still be built, which is fine for review. If deploys should also wait for CI, gate the job with `workflow_run` on `CI` — a change to `deploy.yml` that needs an explicit decision.

## Coverage

Coverage uses the V8 provider (`bun run test:ci`). Thresholds start low on purpose — the codebase starts from zero — and are stricter for security-critical code (`packages/permissions`, `apps/server/src/core/middlewares`). Raise them as coverage grows; never lower them to get a PR through.
