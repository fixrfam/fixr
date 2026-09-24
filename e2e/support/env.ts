/** Ports and env shared by the e2e launcher scripts and the Playwright config. */
export const API_PORT = 3334;
export const WEB_PORT = 3100;
export const API_URL = `http://localhost:${API_PORT}`;
export const WEB_URL = `http://localhost:${WEB_PORT}`;
export const DB_URL = "mysql://e2e:e2e@127.0.0.1:3307/fixr_e2e";
export const REDIS_URL = "redis://127.0.0.1:6380/0";

/** Cloudflare's documented always-pass Turnstile test keys. */
export const TURNSTILE_SITE_KEY = "1x00000000000000000000AA";
export const TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

/** Non-secret values: e2e never uses production credentials. */
export const apiEnv = {
	NODE_ENV: "test",
	NODE_PORT: String(API_PORT),
	DB_URL,
	REDIS_URL,
	MYSQL_ROOT_PASSWORD: "e2e",
	MYSQL_DATABASE: "fixr_e2e",
	MYSQL_USER: "e2e",
	MYSQL_PASSWORD: "e2e",
	REDIS_PASSWORD: "unused-e2e",
	JWT_SECRET: "e2e-jwt-secret-0123456789abcdef0123456789",
	COOKIE_ENCRYPTION_SECRET: "e2e-cookie-secret-0123456789abcdef01234",
	COOKIE_DOMAIN: "localhost",
	FRONTEND_URL: WEB_URL,
	ADMIN_URL: "http://localhost:6969",
	GOOGLE_AUTH_CLIENT_ID: "e2e-google-client",
	GOOGLE_AUTH_CLIENT_SECRET: "e2e-google-secret",
	GOOGLE_AUTH_REDIRECT_URI: `${API_URL}/auth/google/callback`,
	CLERK_SECRET_KEY: "sk_test_e2e",
	TURNSTILE_SECRET_KEY,
	RESEND_KEY: "re_e2e",
	R2_ACCESS_KEY_ID: "e2e",
	R2_SECRET_ACCESS_KEY: "e2e",
	R2_BUCKET_URL: "https://r2.e2e.local/fixr-e2e",
	R2_PUBLIC_BASE_URL: "https://cdn.e2e.local",
	R2_REGION: "auto",
	R2_PRESIGN_EXPIRES_IN: "600",
};

export const webEnv = {
	NEXT_PUBLIC_API_URL: API_URL,
	NEXT_PUBLIC_APP_URL: WEB_URL,
	NEXT_PUBLIC_DOCS_URL: "https://docs.fixr.com.br",
	NEXT_PUBLIC_LINKTREE_URL: "https://linktr.ee/fixrfam",
	NEXT_PUBLIC_TURNSTILE_SITE_KEY: TURNSTILE_SITE_KEY,
};
