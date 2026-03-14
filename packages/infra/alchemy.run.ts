// packages/infra/src/deploy.ts

import fs from "node:fs";
import path from "node:path";
import alchemy from "alchemy";
import { Nextjs } from "alchemy/cloudflare";
import { GitHubComment } from "alchemy/github";
import { CloudflareStateStore } from "alchemy/state";
import { config } from "dotenv";

const safeLoad = (p: string) => {
  try {
    const resolved = path.resolve(p);
    if (fs.existsSync(resolved)) {
      config({ path: resolved });
      console.log(`Loaded env from ${resolved}`);
    }
  } catch (err) {
    console.log(err);
  }
};

safeLoad(".env.production");
safeLoad("../../apps/web/.env.production");
safeLoad("../../apps/server/.env.production");
safeLoad("../../apps/admin/.env.production");
safeLoad("../../packages/db/.env.production");
safeLoad("../../packages/mail/.env.production");
safeLoad("../../packages/infra/.env.production");

const stage = process.env.STAGE || "dev";

const app = await alchemy(`fixr-${stage}`, {
  stateStore: (scope) => new CloudflareStateStore(scope, { forceUpdate: true }),
});

interface CloudFlareDomainConfig {
  domainName: string;
  adopt?: boolean;
}

const parseDomains = (envName: string): CloudFlareDomainConfig[] => {
  const domains = process.env[envName]?.split(",").map((d) => d.trim());

  const mapped = domains?.map((domain) => {
    return { domainName: domain, adopt: true };
  });

  return mapped ?? [];
};

export const web = await Nextjs("web", {
  cwd: "../../apps/web",
  adopt: true,
  domains: parseDomains("FRONTEND_PUBLIC_DOMAINS"),
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
  domains: parseDomains("ADMIN_PUBLIC_DOMAINS"),
  bindings: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY as string,
    REDIS_URL: process.env.REDIS_URL as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env
      .NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL as string,
  },
});

if (process.env.PULL_REQUEST) {
  // if this is a PR, add a comment to the PR with the preview URL
  await GitHubComment("preview-comment", {
    owner: "fixrfam",
    repository: "fixr",
    issueNumber: Number(process.env.PULL_REQUEST),
    body: `## 🚀 Preview Deployed

Your changes have been deployed to a preview environment:

**Website:** ${web.url}
**Admin:** ${admin.url}

Built from commit ${process.env.GITHUB_SHA?.slice(0, 7)}

+---
<sub>🤖 This comment updates automatically with each push.</sub>`,
  });
}

console.log(`Web  ---> ${web.url}`);
console.log(`Admin -> ${admin.url}`);

await app.finalize();
