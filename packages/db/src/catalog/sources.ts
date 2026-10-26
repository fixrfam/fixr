import { Database } from "bun:sqlite";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ScrapedModel, SourceName } from "./normalize";

/** SQLite file of each source, as `devices.etl` names them in its data folder. */
export const SOURCE_FILES: Record<SourceName, string> = {
	gsmarena: "gsm_devices.db",
	laptopmedia: "lpm_devices.db",
	displayspecs: "devices.db",
};

const SNAKE_CASE_REGEX = /_([a-z])/g;

const toCamel = (key: string) =>
	key.replace(SNAKE_CASE_REGEX, (_, char: string) => char.toUpperCase());

/** Reads the scraped models (with their maker) of one source. */
export function readSource(dataDir: string, source: SourceName) {
	const file = join(dataDir, SOURCE_FILES[source]);
	if (!existsSync(file)) {
		return [];
	}

	const sqlite = new Database(file, { readonly: true });
	try {
		const rows = sqlite
			.query(
				`select m.*, k.name as maker_name, k.url as maker_url
				 from models m join makers k on k.id = m.maker_id
				 where m.scraped = 1`
			)
			.all() as Record<string, unknown>[];

		return rows.map(
			(row) =>
				Object.fromEntries(
					Object.entries(row).map(([key, value]) => [toCamel(key), value])
				) as unknown as ScrapedModel
		);
	} finally {
		sqlite.close();
	}
}
