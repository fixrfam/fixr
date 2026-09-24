/**
 * Deterministic, non-secret env for the test suites. Loaded through Vitest's
 * `test.env`, so it is in place before any `@fixr/env/*` module validates.
 *
 * The integration global setup overrides DB_URL/REDIS_URL with the
 * Testcontainers URLs.
 */
export const testEnv = {
	NODE_ENV: "test",
	NODE_PORT: "3333",
	JWT_SECRET: "test-jwt-secret-0123456789abcdef0123456789",
	COOKIE_ENCRYPTION_SECRET: "test-cookie-secret-0123456789abcdef012345",
	COOKIE_DOMAIN: "localhost",
	FRONTEND_URL: "http://localhost:3000",
	ADMIN_URL: "http://localhost:6969",
	GOOGLE_AUTH_CLIENT_ID: "test-google-client-id",
	GOOGLE_AUTH_CLIENT_SECRET: "test-google-client-secret",
	GOOGLE_AUTH_REDIRECT_URI: "http://localhost:3333/auth/google/callback",
	CLERK_SECRET_KEY: "sk_test_clerk",
	TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
	R2_ACCESS_KEY_ID: "test-access-key",
	R2_SECRET_ACCESS_KEY: "test-secret-key",
	R2_BUCKET_URL: "https://r2.test.local/fixr-test",
	R2_PUBLIC_BASE_URL: "https://cdn.test.local",
	R2_REGION: "auto",
	R2_PRESIGN_EXPIRES_IN: "600",
	RESEND_KEY: "re_test",
	// Unit tests never open a connection: the pool is lazy and Redis is mocked.
	DB_URL: "mysql://test:test@127.0.0.1:3306/fixr_test",
	REDIS_URL: "redis://default:test@127.0.0.1:6379/0",
	MYSQL_ROOT_PASSWORD: "test",
	MYSQL_DATABASE: "fixr_test",
	MYSQL_USER: "test",
	MYSQL_PASSWORD: "test",
	REDIS_PASSWORD: "test",
};
