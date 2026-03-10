# Migration: Fastify → Elysia (Cloudflare Workers)

Migrate `apps/server` from Fastify 5 to Elysia for Cloudflare Workers. Move BullMQ workers to a new `apps/worker` CF Worker app.

---

## ⚠️ Known Pitfalls & How They're Handled

| Issue | Severity | Fix |
|---|---|---|
| `bcrypt` uses native bindings — incompatible with CF Workers | 🔴 | Replace with `bcryptjs` (same API, pure JS) |
| `mysql2` uses TCP — CF Workers need Cloudflare Hyperdrive | 🔴 | Add wrangler Hyperdrive binding; user to provision Hyperdrive ID |
| `BullMQ`/`ioredis` TCP (worker side) | 🔴 | Move to `apps/worker` CF Worker with `nodejs_compat` + `cloudflare:sockets` |
| `nodemailer` is Node-only | 🟡 | Stays in `apps/worker` only — never imported by `apps/server` |
| `node:path`/`node:process` in `server.ts` | 🟡 | Removed with static serving (replaced by CF Assets) |
| `fastify-type-provider-zod` error helpers | 🟡 | Removed; single `onError` in Elysia replaces all error handlers |
| `isFastifyError()` utility | 🟡 | Deleted; Elysia throws standard errors |
| Route `function(fastify)` plugin pattern | 🟡 | Converted to `new Elysia({ prefix })` instances |
| `withErrorHandler` HOC | 🟡 | Deleted; Elysia global `onError` covers this |
| `request.user` from `@fastify/jwt` | 🟡 | Replaced by `derive({ user })` from `authenticate` plugin |
| `google-auth-library` HTTP in CF Workers | 🟡 | Should work under `nodejs_compat`; test after migration |

---

## Proposed Changes

### 1. Dependencies

#### [MODIFY] [package.json](file:///home/rick/dev/projects/facul/fixr.bun/apps/server/package.json)

**Remove**: `fastify`, `@fastify/cookie`, `@fastify/cors`, `@fastify/jwt`, `@fastify/static`, `@fastify/swagger`, `@fastify/swagger-ui`, `@scalar/fastify-api-reference`, `fastify-type-provider-zod`, `jsonwebtoken`, `@types/jsonwebtoken`, `bcrypt`, `@types/bcrypt`

**Add**: `elysia`, `@elysiajs/adapter`, `@elysiajs/cors`, `@elysiajs/cookie`, `@elysiajs/swagger`, `jose`, `bcryptjs`, `@types/bcryptjs`

**devDep add**: `wrangler` (from catalog)

---

### 2. Configuration

#### [NEW] [wrangler.toml](file:///home/rick/dev/projects/facul/fixr.bun/apps/server/wrangler.toml)

```toml
name = "fixr-api"
main = "src/server.ts"
compatibility_date = "2025-09-01"
compatibility_flags = ["nodejs_compat"]

[assets]
bucket = "./public"

# [[hyperdrive]]
# binding = "HYPERDRIVE"
# id = "<your-hyperdrive-id>"
```

#### [MODIFY] [tsconfig.json](file:///home/rick/dev/projects/facul/fixr.bun/apps/server/tsconfig.json)

Add `"moduleResolution": "bundler"`.

---

### 3. Server Entry

#### [MODIFY] [server.ts](file:///home/rick/dev/projects/facul/fixr.bun/apps/server/src/server.ts)

Full rewrite using Elysia. Remove `startEmailWorker()`, `node:path`/`node:process`, all Fastify imports.

---

### 4. JWT Helper

#### [NEW] [jwt.ts](file:///home/rick/dev/projects/facul/fixr.bun/apps/server/src/helpers/jwt.ts)

`verifyToken` and `signToken` using `jose` (WebCrypto-compatible).

---

### 5. Auth Middlewares

#### [MODIFY] [authenticate.ts](file:///home/rick/dev/projects/facul/fixr.bun/apps/server/src/middlewares/authenticate.ts)
#### [MODIFY] [authenticate-employee.ts](file:///home/rick/dev/projects/facul/fixr.bun/apps/server/src/middlewares/authenticate-employee.ts)

Convert from Fastify `preHandler` functions to Elysia `new Elysia().derive(...)` plugins that inject `{ user }` into context.

#### [DELETE] [utils.ts](file:///home/rick/dev/projects/facul/fixr.bun/apps/server/src/middlewares/utils.ts)
#### [DELETE] [with-error-handler.ts](file:///home/rick/dev/projects/facul/fixr.bun/apps/server/src/middlewares/with-error-handler.ts)

---

### 6. Routes

#### [MODIFY] all route files

Convert `function routes(fastify: FastifyTypedInstance)` → `export const routes = new Elysia({ prefix })`. Files:
- `src/routes/auth.routes.ts`
- `src/routes/account.routes.ts`
- `src/routes/credentials.routes.ts`
- `src/routes/companies/companies.routes.ts`
- `src/routes/companies/employees/employees.routes.ts`

---

### 7. Controllers

#### [MODIFY] all `src/controllers/**`

Remove `FastifyReply` params. Controllers return values instead of calling `reply.status(x).send(y)`. Status codes set via returned object or thrown `error()`.

---

### 8. bcrypt → bcryptjs

#### [MODIFY] all files importing `bcrypt`

`import bcrypt from "bcrypt"` → `import bcrypt from "bcryptjs"` (API identical).

---

### 9. `apps/worker` — New CF Worker App

#### [NEW] `apps/worker/`

```
apps/worker/
  package.json          # name: "worker", deps: bullmq, ioredis, @fixr/mail, @fixr/env
  wrangler.toml         # nodejs_compat, cloudflare:sockets
  src/index.ts          # CF Worker entry: export default { fetch, scheduled }
  src/workers/
    email-worker.ts     # moved from apps/server/src/queue/workers/email-worker.ts
```

BullMQ + ioredis work via Cloudflare TCP socket support (`nodejs_compat` + `cloudflare:sockets` flags).

#### [DELETE] `apps/server/src/queue/` (moved to worker app)

---

### 10. Interfaces

#### [DELETE] `src/interfaces/fastify.ts`

`FastifyTypedInstance` no longer needed.

---

## Verification Plan

```bash
# Type check after migration
cd apps/server && bun run check-types
cd apps/worker && bun run check-types

# Local CF runtime dev
cd apps/server && wrangler dev --port 8787
cd apps/worker && wrangler dev --port 8788
```

| Endpoint | Expected |
|---|---|
| `GET /` | `200 Hello from Fixr API!` |
| `GET /docs` | `200` Swagger UI |
| `POST /auth/login` | `200` / correct error |
| `GET /account` | `401` without session |
| `GET /companies` | `401` without session |
