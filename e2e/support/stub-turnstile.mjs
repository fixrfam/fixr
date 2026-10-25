/**
 * Preloaded into the e2e API process only (`node --import`). Answers
 * Cloudflare's siteverify endpoint locally so e2e never depends on
 * challenges.cloudflare.com; every other request goes through untouched.
 * Production code is not changed: the real verification is unit-tested in
 * apps/server/src/core/lib/turnstile.spec.ts.
 */
const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const realFetch = globalThis.fetch;

globalThis.fetch = (input, init) => {
	const url = typeof input === "string" ? input : (input?.url ?? String(input));
	if (url === SITEVERIFY) {
		return Promise.resolve(Response.json({ success: true }));
	}
	return realFetch(input, init);
};
