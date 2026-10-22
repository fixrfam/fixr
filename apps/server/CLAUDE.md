Local context for `apps/server`. Read the root `AGENTS.md` first — this only covers what's specific to this app.

## Stack

Fastify + `fastify-type-provider-zod` (Zod is the source of truth for both validation and OpenAPI schema generation — don't hand-write JSON schema). Drizzle ORM over MySQL, Redis, BullMQ-adjacent (actual job processing lives in `apps/workers`), Cloudflare R2 for uploads (`@aws-sdk/client-s3`), Clerk for the admin-facing endpoints that need it.

## Adding a route

1. Add/extend the module under `src/modules/<name>/` following the `routes/controllers/services/repositories/schemas/errors` layout (see root `AGENTS.md`).
2. Register the route plugin in `src/server.ts` (`await server.register(xRoutes, { prefix: "..." })`) and add its OpenAPI tag to the `tags` array there if it's a new module.
3. Add a docs schema entry in `src/core/docs/<module>.docs.ts` — this drives the Scalar/Swagger UI at `/docs` and `/reference`. Don't skip it; every route in existing modules has one.
4. Gate with `[authenticate, requirePermission(permissions.<resource>.<action>)]` in `preHandler` unless the route is intentionally public (e.g. health check, email confirmation links).
5. Wrap the handler body in `withErrorHandler(...)`.

## Auth specifics

- Session JWT is read from a signed cookie (`cookieKey("session")` from `@fixr/constants/cookies`) via `@fastify/jwt` + `@fastify/cookie`, configured in `server.ts`.
- Refresh tokens and one-time tokens (email confirmation, password reset, account deletion) are separate DB tables (`refresh_tokens`, `one_time_tokens`) — see `modules/auth` and `modules/account` for the patterns before adding another token-based flow.
- `request.ability` (RBAC) is populated in two places: the `authenticate` middleware and `setupRBAC`'s `onRequest` hook. If you touch one, check the other stays consistent.

## Errors

Central error handling in `server.ts` has three layers, in this order: `ZodError` (request/response shape) → `AppError` (domain errors, see `core/lib/app-error.ts`) → Fastify schema validation errors. New domain errors go through a module's `defineErrors({...})` registry, not a new ad-hoc handler.

## Don't

- Don't add new S3/R2 upload logic outside `modules/uploads` and `core/lib/r2.ts` — there's already a purpose-based presign pattern to extend.
- Don't call `db` directly from a controller or route — always through a repository.
- Don't skip the `core/docs/*.docs.ts` entry for a new route; the OpenAPI spec is generated from it and consumed by `/docs`.
