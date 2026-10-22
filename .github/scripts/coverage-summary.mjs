/**
 * Builds a markdown table from every workspace's coverage/coverage-summary.json
 * (Vitest `json-summary` reporter) for the CI job summary and the PR comment.
 * Usage: node .github/scripts/coverage-summary.mjs > coverage.md
 */
import { existsSync, readFileSync } from "node:fs";

const WORKSPACES = [
	"apps/server",
	"apps/workers",
	"apps/web",
	"apps/admin",
	"packages/permissions",
	"packages/schemas",
	"packages/constants",
	"packages/mail",
];
const METRICS = ["lines", "branches", "functions", "statements"];

const rows = [];
for (const workspace of WORKSPACES) {
	const file = `${workspace}/coverage/coverage-summary.json`;
	if (!existsSync(file)) {
		rows.push(`| \`${workspace}\` | ${METRICS.map(() => "—").join(" | ")} |`);
		continue;
	}
	const { total } = JSON.parse(readFileSync(file, "utf8"));
	rows.push(
		`| \`${workspace}\` | ${METRICS.map((m) => `${total[m].pct.toFixed(1)}%`).join(" | ")} |`
	);
}

console.log(`<!-- coverage-summary -->
### Unit test coverage

| Workspace | Lines | Branches | Functions | Statements |
| -- | --: | --: | --: | --: |
${rows.join("\n")}

Thresholds are enforced per workspace in each \`vitest.config.ts\` (see \`TESTING.md\`).`);
