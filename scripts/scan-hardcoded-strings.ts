/**
 * Finds user facing text that is still written inline in the frontend apps.
 *
 * It is a helper, not a gate: JSX text and a handful of copy-carrying props
 * are matched with regexes, so it reports candidates for a human to judge.
 * Run it after touching UI: `bun run i18n:scan`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const ROOTS = ["apps/web", "apps/admin"];
const SKIPPED_DIRECTORIES = new Set([
	"node_modules",
	".next",
	".open-next",
	"dist",
	".turbo",
]);

/** Props whose value is read by a person. */
const COPY_PROPS =
	/\b(?:placeholder|title|label|description|alt|aria-label|tooltip|emptyMessage)\s*=\s*"([^"]{3,160})"/g;
const JSX_TEXT = />\s*([A-Za-zÀ-ÿ][^<>{}\n]{2,160}?)\s*</g;
/** Anything that looks like an id, a class name or a path is not copy. */
const NOT_COPY = /^[-a-z0-9_:/[\]. ]+$/;
/** Type syntax and expressions the JSX matcher picks up by accident. */
const LOOKS_LIKE_CODE =
	/[=(){}[\]]|&&|\|\||\?\.|\b(?:extends|new|typeof|const|let|var|function|interface|type|import|export)\b/;
/** Copy always carries words; a row of bullets or digits does not. */
const HAS_WORDS = /[A-Za-zÀ-ÿ]{2}/;

function walk(directory: string): string[] {
	return readdirSync(directory).flatMap((entry) => {
		if (SKIPPED_DIRECTORIES.has(entry)) {
			return [];
		}

		const path = join(directory, entry);

		if (statSync(path).isDirectory()) {
			return walk(path);
		}

		return [".ts", ".tsx"].includes(extname(path)) ? [path] : [];
	});
}

function findings(source: string): string[] {
	const hits = new Set<string>();

	for (const [, value] of source.matchAll(COPY_PROPS)) {
		if (HAS_WORDS.test(value)) {
			hits.add(value);
		}
	}

	for (const [, value] of source.matchAll(JSX_TEXT)) {
		if (HAS_WORDS.test(value) && value.includes(" ")) {
			hits.add(value);
		}
	}

	return [...hits].filter(
		(hit) => !(NOT_COPY.test(hit) || LOOKS_LIKE_CODE.test(hit))
	);
}

let total = 0;

for (const root of ROOTS) {
	for (const file of walk(root)) {
		const hits = findings(readFileSync(file, "utf8"));

		if (hits.length > 0) {
			total += hits.length;
			console.log(`\n${file}`);
			for (const hit of hits) {
				console.log(`   ${hit}`);
			}
		}
	}
}

console.log(
	total === 0
		? "\nNo inline copy found."
		: `\n${total} candidate string(s) left inline. Move the real copy into @fixr/i18n.`
);
