# Migration: Fastify → Elysia (Cloudflare Workers)

## Overview

Migrate `@apps/server` from Fastify to Elysia for Cloudflare Workers deployment.

## Current Stack

- **Framework**: Fastify 5.x
- **Auth**: `@fastify/jwt` + `@fastify/cookie`
- **CORS**: `@fastify/cors`
- **Static**: `@fastify/static`
- **Docs**: `@fastify/swagger` + `@fastify/swagger-ui` + `@scalar/fastify-api-reference`
- **Validation**: `fastify-type-provider-zod`
- **Queue**: BullMQ (external Redis)

## Target Stack

- **Framework**: Elysia + `@elysiajs/adapter/cloudflare-worker`
- **Auth**: `@elysiajs/cookie` + custom JWT (use `jose` lib)
- **CORS**: Built-in or `@elysiajs/cors`
- **Static**: Cloudflare Assets
- **Docs**: `@elysiajs/openapi` or `@cloudflare/itty-router-openapi`
- **Validation**: Elysia native (TypeBox) or `elysia/zod`
- **Queue**: BullMQ (unchanged - external Redis)

## Known Limitations on CF Workers

| Feature      | Status | Workaround                                                   |
| ------------ | ------ | ------------------------------------------------------------ |
| Static files | ❌     | Use Cloudflare Assets                                        |
| OpenAPI      | ⚠️     | Check `@elysiajs/openapi`; fallback to `itty-router-openapi` |
| JWT          | ⚠️     | Use `jose` lib instead of `@fastify/jwt`                     |

## Migration Steps

### Phase 1: Dependencies

#### Remove

```bash
@fastify/cookie
@fastify/cors
@fastify/jwt
@fastify/static
@fastify/swagger
@fastify/swagger-ui
@scalar/fastify-api-reference
fastify
fastify-type-provider-zod
```

#### Add

```bash
elysia
@elysiajs/adapter/cloudflare-worker
@elysiajs/cookie
@elysiajs/jwt  # or skip, use jose directly
@elysiajs/cors
@elysiajs/openapi  # or @cloudflare/itty-router-openapi
jose  # for JWT verification
```

### Phase 2: Configuration Files

#### Create `wrangler.toml`

```toml
name = "fixr-api"
main = "src/server.ts"
compatibility_date = "2025-09-01"
compatibility_flags = ["nodejs_compat"]

[assets]
bucket = "./public"
```

#### Update `tsconfig.json`

- Ensure `moduleResolution: "bundler"` for OpenAPI type generation

### Phase 3: Server Entry (`src/server.ts`)

#### Before (Fastify)

```typescript
import fastify from 'fastify';

const server = fastify({ logger: true })
  .withTypeProvider<ZodTypeProvider>();

server.register(fastifyJwt, { secret: env.JWT_SECRET, cookie: { ... } });
server.register(fastifyCookie, { secret: env.COOKIE_ENCRYPTION_SECRET });
server.register(fastifyCors, { origin: [...] });
server.register(fastifyStatic, { root: join(cwd(), 'public') });
server.register(authRoutes, { prefix: '/auth' });

server.listen({ port: Number(env.NODE_PORT), host: '::' });
```

#### After (Elysia)

```typescript
import { Elysia } from "elysia";
import { CloudflareAdapter } from "@elysiajs/adapter/cloudflare-worker";
import { cors } from "@elysiajs/cors";
import { cookie } from "@elysiajs/cookie";

const app = new Elysia()
  .use(cors({ origin: [env.FRONTEND_URL], credentials: true }))
  .use(cookie({ secret: env.COOKIE_ENCRYPTION_SECRET }))
  .use(jwt({ secret: env.JWT_SECRET, cookie: "session" }))
  .use(authRoutes)
  .use(accountRoutes)
  // ... other routes
  .get("/", () => "Hello from Fixr API!")
  .onError(({ error }) => {
    // Handle ZodError and other errors
  })
  .use(elysiaSwagger()) // or openapi
  .compile(); // Required for CF Workers

export default app;
```

### Phase 4: Route Conversion

#### Before (Fastify)

```typescript
// src/routes/auth.routes.ts
export function authRoutes(fastify: FastifyTypedInstance) {
  fastify.post('/login', { schema: ... }, withErrorHandler(async (req, res) => {
    const body = await loginUserSchema.parseAsync(req.body);
    // ...
  }));
}
```

#### After (Elysia)

```typescript
// src/routes/auth.routes.ts
import { Elysia, t } from "elysia";

export const authRoutes = new Elysia({ prefix: "/auth" }).post(
  "/login",
  async ({ body, cookie, set }) => {
    const data = await loginUserSchema.parseAsync(body);
    // ...
  },
  {
    schema: authDocs.loginSchema,
  },
);
```

### Phase 5: Middleware Conversion

#### Before (Fastify - `src/middlewares/authenticate.ts`)

```typescript
export const authenticate = async (req: FastifyRequest, res: FastifyReply) => {
  await req.jwtVerify();
  const { id } = req.user;
  // ...
};
```

#### After (Elysia)

```typescript
export const authenticate = async ({ jwtVerify, cookie, status }: Context) => {
  const token = cookie.session?.value;
  if (!token) {
    status(401);
    return { error: "Unauthorized" };
  }
  const { id } = await jwtVerify(token);
  // ...
};
```

### Phase 6: Static Files

#### Before

```typescript
server.register(fastifyStatic, {
  root: join(cwd(), "public"),
  prefix: "/public/",
});
```

#### After

- Remove static plugin entirely
- Add to `wrangler.toml`:

```toml
[assets]
bucket = "./public"
```

- Serve from Cloudflare's built-in static file serving

### Phase 7: JWT/Cookie Auth

#### Install jose (recommended)

```bash
bun add jose
```

#### Usage

```typescript
import { jwtVerify, SignJWT } from "jose";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

export async function signToken(payload: object) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}
```

### Phase 8: OpenAPI

#### Option A: @elysiajs/openapi

```typescript
import { openapi } from "@elysiajs/openapi";

app.use(
  openapi({
    documentation: {
      info: { title: "Fixr API", version: "1.0.0" },
      // ...
    },
  }),
);
```

#### Option B: @cloudflare/itty-router-openapi

If @elysiajs/openapi fails on CF Workers, switch to itty-router-openapi which is CF-native.

### Phase 9: Error Handling

#### Before (Fastify)

```typescript
server.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    reply.status(400).send(apiResponse({ ... }));
  }
});
```

#### After (Elysia)

```typescript
app.onError(({ error, set }) => {
  if (error instanceof ZodError) {
    set.status = 400;
    return apiResponse({ status: 400, ... });
  }
});
```

## Development Workflow

### Local Development (Bun)

```bash
bun run dev  # Original development server
```

### CF Workers Development

```bash
wrangler dev src/server.ts --port 8787
```

### Deployment

```bash
wrangler deploy
```

## Testing Checklist

- [ ] Auth: Login, Register, Logout, Token refresh
- [ ] Protected routes: JWT validation works
- [ ] Static files: Served from `/public/*`
- [ ] OpenAPI docs: Accessible at `/docs` or `/openapi`
- [ ] CORS: Cross-origin requests work
- [ ] Queue: Email worker connects to external Redis
- [ ] Error handling: Zod validation errors return proper format

## Rollback Plan

If migration fails:

1. Keep Fastify version in git branch
2. Deploy Fastify to separate CF Worker if needed
3. Roll back to Bun/Node deployment

## References

- [Elysia + Cloudflare Workers](https://elysiajs.com/integrations/cloudflare-worker)
- [Migrate from Fastify](https://elysiajs.com/migrate/from-fastify)
- [Elysia OpenAPI](https://elysiajs.com/plugins/openapi)
- [itty-router-openapi](https://itty.dev/itty-router-openapi)
