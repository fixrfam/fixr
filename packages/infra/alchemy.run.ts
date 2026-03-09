import alchemy from "alchemy";
import { config } from "dotenv";

config({ path: "../../apps/web/.env" });
config({ path: "../../apps/server/.env" });
config({ path: "../../apps/admin/.env" });
config({ path: "../../packages/db/.env" });
config({ path: "../../packages/mail/.env" });
config({ path: "../../packages/infra/.env" });

const app = await alchemy("fixr");

// NOTE: Cloudflare Workers cannot run traditional Node.js servers like Fastify
// The server uses Node.js built-in modules (node:path, node:process), native modules (bcrypt),
// and Fastify which are incompatible with Cloudflare Workers runtime.
//
// To deploy the server, use a Node.js-compatible platform like:
// - Railway (railway.app)
// - Render (render.com)
// - Fly.io (fly.io)
// - DigitalOcean App Platform
// - AWS Lambda with adapter
//
// Uncomment and adapt the code below if you create a Workers-compatible adapter:

/*
export const server = await Worker("server", {
	cwd: "../../apps/server",
	entrypoint: "src/server.ts",
	compatibility: "node",
	bundle: {
		external: ["@mapbox/node-pre-gyp", "mock-aws-s3", "aws-sdk", "nock"],
		loader: {
			".html": "text",
		},
	},
	bindings: {
		// Database
		DB_URL: alchemy.secret.env.DB_URL!,
		MYSQL_ROOT_PASSWORD: alchemy.secret.env.MYSQL_ROOT_PASSWORD!,
		MYSQL_DATABASE: alchemy.env.MYSQL_DATABASE!,
		MYSQL_USER: alchemy.env.MYSQL_USER!,
		MYSQL_PASSWORD: alchemy.secret.env.MYSQL_PASSWORD!,

		// Redis
		REDIS_URL: alchemy.secret.env.REDIS_URL!,
		REDIS_PASSWORD: alchemy.secret.env.REDIS_PASSWORD!,

		// Server Config
		NODE_PORT: alchemy.env.NODE_PORT!,
		FRONTEND_URL: alchemy.env.FRONTEND_URL!,

		// Authentication
		JWT_SECRET: alchemy.secret.env.JWT_SECRET!,
		COOKIE_ENCRYPTION_SECRET: alchemy.secret.env.COOKIE_ENCRYPTION_SECRET!,
		COOKIE_DOMAIN: alchemy.env.COOKIE_DOMAIN!,

		// Google OAuth
		GOOGLE_AUTH_CLIENT_ID: alchemy.secret.env.GOOGLE_AUTH_CLIENT_ID!,
		GOOGLE_AUTH_CLIENT_SECRET: alchemy.secret.env.GOOGLE_AUTH_CLIENT_SECRET!,
		GOOGLE_AUTH_REDIRECT_URI: alchemy.env.GOOGLE_AUTH_REDIRECT_URI!,

		// Email
		RESEND_KEY: alchemy.secret.env.RESEND_KEY!,
	},
	dev: {
		port: 3333,
	},
});

console.log(`🚀 Server deployed at: ${server.url}`);
*/
// Finalize the application
await app.finalize();
