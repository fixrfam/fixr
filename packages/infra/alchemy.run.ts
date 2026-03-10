import alchemy from "alchemy";
import { Nextjs, Worker } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: ".env.production" });
config({ path: "../../apps/web/.env.production" });
config({ path: "../../apps/server/.env.production" });
config({ path: "../../apps/admin/.env.production" });
config({ path: "../../apps/worker/.env.production" });
config({ path: "../../packages/db/.env.production" });
config({ path: "../../packages/mail/.env.production" });
config({ path: "../../packages/infra/.env.production" });

const app = await alchemy("fixr");

export const worker = await Worker("worker", {
	cwd: "../../apps/worker",
	entrypoint: "src/index.ts",
	compatibilityDate: "2025-09-01",
	compatibilityFlags: ["nodejs_compat"],
	bindings: {
		REDIS_URL: process.env.REDIS_URL as string,
	},
	dev: {
		port: 8788,
	},
});

export const web = await Nextjs("web", {
	cwd: "../../apps/web",
	adopt: true,
	domains: process.env.FRONTEND_PUBLIC_DOMAINS!.split(",").map((d) => d.trim()),
	bindings: {
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL as string,
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL as string,
		NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL as string,
		NEXT_PUBLIC_LINKTREE_URL: process.env.NEXT_PUBLIC_LINKTREE_URL as string,
	},
});

export const admin = await Nextjs("admin", {
	cwd: "../../apps/admin",
	adopt: true,
	domains: process.env.ADMIN_PUBLIC_DOMAINS!.split(",").map((d) => d.trim()),
	bindings: {
		CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY as string,
		REDIS_URL: process.env.REDIS_URL as string,
		FRONTEND_URL: process.env.FRONTEND_URL as string,
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env
			.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string,
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL as string,
	},
});

console.log(`Web ---------------> ${web.url}`);
console.log(`Admin -------------> ${admin.url}`);
console.log(`Auxiliary Workers -> ${worker.url}`);

await app.finalize();
