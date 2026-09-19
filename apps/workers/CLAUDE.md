Local context for `apps/workers`. Read the root `AGENTS.md` first — this only covers what's specific to this app.

## Stack

BullMQ processors over Redis (`ioredis`). `src/index.ts` boots the worker(s); `src/workers/*.ts` holds one file per queue/processor (e.g. `email-worker.ts`, which consumes `@fixr/mail` templates and sends via Resend/nodemailer).

## Adding a worker

1. Add a new file under `src/workers/` for the queue processor.
2. Register/start it in `src/index.ts` alongside the existing ones.
3. If it needs new env vars, add them to `packages/env/src/workers.ts` — don't read `process.env` directly.
4. Jobs enqueued from `apps/server` should use a shared queue name/constant (check `@fixr/constants`) so producer and consumer stay in sync.

## Don't

- Don't put business logic that belongs in `apps/server` (e.g. things that should go through a module's `services/`) here — this app should stay focused on queue consumption and side effects (email, etc.).
