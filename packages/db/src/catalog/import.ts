/**
 * Imports the scraped device catalog into the shared models (no company), so
 * every company can browse it and pick models on service orders.
 *
 *   bun run db:catalog --data ../devices.etl/data [--upload] [--dry-run]
 *
 * It is idempotent: models are matched by their source URL (or slug), uploads
 * by their R2 key, and running it again updates rows instead of adding new
 * ones. With `--upload`, images missing from R2 are uploaded first.
 */
import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import {
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { env } from "@fixr/env/catalog";
import { env as dbEnv } from "@fixr/env/db";
import { createId } from "@paralleldrive/cuid2";
import chalk from "chalk";
import { and, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../connection";
import {
	modelCategories,
	modelImages,
	modelMakers,
	models,
	uploads,
} from "../schema";
import {
	buildCatalog,
	CATALOG_CATEGORIES,
	type CatalogModel,
	type SourceName,
	slugify,
} from "./normalize";
import { readSource, SOURCE_FILES } from "./sources";

const BATCH = 200;
const TRAILING_SLASH_REGEX = /\/$/;

const CONTENT_TYPES: Record<string, string> = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".gif": "image/gif",
	".webp": "image/webp",
};

const { values: args } = parseArgs({
	options: {
		data: { type: "string" },
		images: { type: "string" },
		prefix: { type: "string", default: "devices/models/" },
		upload: { type: "boolean", default: false },
		"dry-run": { type: "boolean", default: false },
	},
});

const log = (message: string) => console.log(message);

function chunks<T>(items: T[], size = BATCH): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		out.push(items.slice(i, i + size));
	}
	return out;
}

interface CatalogImage {
	file: string;
	path: string;
	key: string;
	size: number;
	contentType: string;
}

function localImages(catalog: CatalogModel[], dir: string, prefix: string) {
	const images = new Map<string, CatalogImage>();
	for (const model of catalog) {
		if (!model.imageFile || images.has(model.imageFile)) {
			continue;
		}
		const path = join(dir, model.imageFile);
		const contentType = CONTENT_TYPES[extname(path).toLowerCase()];
		if (!(contentType && existsSync(path))) {
			continue;
		}
		images.set(model.imageFile, {
			file: model.imageFile,
			path,
			key: `${prefix}${model.imageFile}`,
			size: statSync(path).size,
			contentType,
		});
	}
	return images;
}

function r2() {
	if (
		!(env.R2_BUCKET_URL && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY)
	) {
		throw new Error(
			"--upload needs R2_BUCKET_URL, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY"
		);
	}
	const url = new URL(env.R2_BUCKET_URL);
	const bucket = url.pathname.split("/").filter(Boolean)[0];
	if (!bucket) {
		throw new Error("R2_BUCKET_URL must end with the bucket name");
	}
	const client = new S3Client({
		region: env.R2_REGION,
		endpoint: `${url.protocol}//${url.host}`,
		credentials: {
			accessKeyId: env.R2_ACCESS_KEY_ID,
			secretAccessKey: env.R2_SECRET_ACCESS_KEY,
		},
	});
	return { client, bucket };
}

async function uploadMissing(images: CatalogImage[], prefix: string) {
	const { client, bucket } = r2();
	const existing = new Set<string>();
	let token: string | undefined;
	do {
		const page = await client.send(
			new ListObjectsV2Command({
				Bucket: bucket,
				Prefix: prefix,
				ContinuationToken: token,
			})
		);
		for (const object of page.Contents ?? []) {
			if (object.Key) {
				existing.add(object.Key);
			}
		}
		token = page.NextContinuationToken;
	} while (token);

	const missing = images.filter((image) => !existing.has(image.key));
	log(
		`R2 ${bucket}: ${existing.size} images there, ${missing.length} to upload`
	);
	if (args["dry-run"]) {
		return;
	}

	for (const batch of chunks(missing, 8)) {
		await Promise.all(
			batch.map(async (image) => {
				await client.send(
					new PutObjectCommand({
						Bucket: bucket,
						Key: image.key,
						Body: await readFile(image.path),
						ContentType: image.contentType,
						CacheControl: "public, max-age=31536000, immutable",
					})
				);
			})
		);
	}
	log(chalk.green(`Uploaded ${missing.length} images`));
}

async function upsertCategories() {
	const existing = await db.select().from(modelCategories);
	const ids = new Map(existing.map((row) => [row.slug, row.id]));
	const missing = Object.entries(CATALOG_CATEGORIES)
		.filter(([slug]) => !ids.has(slug))
		.map(([slug, name]) => ({ id: createId(), slug, name }));

	if (missing.length > 0 && !args["dry-run"]) {
		await db.insert(modelCategories).values(missing);
	}
	for (const row of missing) {
		ids.set(row.slug, row.id);
	}
	log(`Categories: ${missing.length} new, ${existing.length} kept`);
	return ids;
}

async function upsertMakers(catalog: CatalogModel[]) {
	const existing = await db.select().from(modelMakers);
	const ids = new Map(existing.map((row) => [row.slug, row.id]));
	const wanted = new Map<string, { name: string; url: string }>();
	for (const model of catalog) {
		const slug = slugify(model.maker);
		if (!wanted.has(slug)) {
			wanted.set(slug, { name: model.maker, url: model.makerUrl });
		}
	}

	const missing = [...wanted]
		.filter(([slug]) => !ids.has(slug))
		.map(([slug, maker]) => ({ id: createId(), slug, ...maker }));

	if (missing.length > 0 && !args["dry-run"]) {
		await db.insert(modelMakers).values(missing);
	}
	for (const row of missing) {
		ids.set(row.slug, row.id);
	}
	log(`Makers: ${missing.length} new, ${wanted.size - missing.length} kept`);
	return ids;
}

async function upsertModels(
	catalog: CatalogModel[],
	makerIds: Map<string, string>,
	categoryIds: Map<string, string>
) {
	const shared = await db
		.select({ id: models.id, slug: models.slug, url: models.url })
		.from(models)
		.where(isNull(models.companyId));
	const byUrl = new Map(shared.map((row) => [row.url, row.id]));
	const bySlug = new Map(shared.map((row) => [row.slug, row.id]));

	const rows = catalog.map((model) => {
		const id = byUrl.get(model.url) ?? bySlug.get(model.slug) ?? createId();
		return {
			id,
			makerId: makerIds.get(slugify(model.maker))!,
			categoryId: model.category
				? (categoryIds.get(model.category) ?? null)
				: null,
			name: model.name,
			slug: model.slug,
			url: model.url,
			companyId: null,
			...model.values,
		};
	});

	const updated = rows.filter(
		(row) => byUrl.has(row.url) || bySlug.has(row.slug)
	);
	log(`Models: ${rows.length - updated.length} new, ${updated.length} updated`);
	if (args["dry-run"]) {
		return new Map(catalog.map((model, i) => [model, rows[i]!.id]));
	}

	// Every column but the id follows the scraped data on a re-run.
	const columns = Object.keys(rows[0] ?? {}).filter((key) => key !== "id");
	const set = Object.fromEntries(
		columns.map((key) => {
			const column = models[key as keyof typeof models.$inferInsert];
			return [key, sql.raw(`values(\`${column.name}\`)`)];
		})
	);

	for (const batch of chunks(rows)) {
		await db.insert(models).values(batch).onDuplicateKeyUpdate({ set });
	}
	return new Map(catalog.map((model, i) => [model, rows[i]!.id]));
}

async function upsertImages(
	catalog: CatalogModel[],
	modelIds: Map<CatalogModel, string>,
	images: Map<string, CatalogImage>
) {
	const publicBase =
		env.R2_PUBLIC_BASE_URL?.replace(TRAILING_SLASH_REGEX, "") ?? "";
	const keys = [...images.values()].map((image) => image.key);
	const uploadIds = new Map<string, string>();

	for (const batch of chunks(keys, 1000)) {
		const rows = await db
			.select({ id: uploads.id, key: uploads.key })
			.from(uploads)
			.where(and(inArray(uploads.key, batch), isNull(uploads.companyId)));
		for (const row of rows) {
			uploadIds.set(row.key, row.id);
		}
	}

	const newUploads = [...images.values()]
		.filter((image) => !uploadIds.has(image.key))
		.map((image) => ({
			id: createId(),
			companyId: null,
			employeeId: null,
			purpose: "model_image" as const,
			key: image.key,
			url: publicBase ? `${publicBase}/${image.key}` : image.key,
			fileName: image.file.slice(0, 255),
			contentType: image.contentType,
			sizeInBytes: image.size,
			status: "completed",
		}));
	for (const row of newUploads) {
		uploadIds.set(row.key, row.id);
	}

	const linked = new Set<string>();
	const ids = [...modelIds.values()];
	for (const batch of chunks(ids, 1000)) {
		const rows = await db
			.select({ modelId: modelImages.modelId, uploadId: modelImages.uploadId })
			.from(modelImages)
			.where(inArray(modelImages.modelId, batch));
		for (const row of rows) {
			linked.add(`${row.modelId}:${row.uploadId}`);
		}
	}
	const withPrimary = new Set([...linked].map((pair) => pair.split(":")[0]));

	const newLinks = catalog.flatMap((model) => {
		const image = model.imageFile ? images.get(model.imageFile) : undefined;
		const modelId = modelIds.get(model)!;
		const uploadId = image ? uploadIds.get(image.key) : undefined;
		if (!uploadId || linked.has(`${modelId}:${uploadId}`)) {
			return [];
		}
		return [
			{
				id: createId(),
				modelId,
				uploadId,
				isPrimary: !withPrimary.has(modelId),
				position: 0,
			},
		];
	});

	log(
		`Images: ${newUploads.length} new uploads, ${newLinks.length} new model links`
	);
	if (args["dry-run"]) {
		return;
	}
	for (const batch of chunks(newUploads)) {
		await db.insert(uploads).values(batch);
	}
	for (const batch of chunks(newLinks)) {
		await db.insert(modelImages).values(batch);
	}
}

async function refreshMakerCounts() {
	if (args["dry-run"]) {
		return;
	}
	await db
		.update(modelMakers)
		.set({
			deviceCount: sql`(select count(*) from ${models} where ${models.makerId} = ${modelMakers.id})`,
		})
		.where(sql`1 = 1`);
}

async function main() {
	if (!args.data) {
		throw new Error("Pass --data with the devices.etl data folder");
	}
	const dataDir = resolve(args.data);
	const imagesDir = resolve(args.images ?? join(dataDir, "images/models"));
	const prefix = args.prefix ?? "devices/models/";

	const host = new URL(dbEnv.DB_URL).host;
	log(
		`${args["dry-run"] ? chalk.yellow("Dry run against") : "Importing into"} ${chalk.bold(host)}`
	);

	const sources = (Object.keys(SOURCE_FILES) as SourceName[]).map((source) => {
		const scraped = readSource(dataDir, source);
		log(`${source}: ${scraped.length} scraped models`);
		return { source, models: scraped };
	});
	const catalog = buildCatalog(sources);
	const images = localImages(catalog, imagesDir, prefix);
	log(`Catalog: ${catalog.length} models, ${images.size} images`);

	if (args.upload) {
		await uploadMissing([...images.values()], prefix);
	}

	const categoryIds = await upsertCategories();
	const makerIds = await upsertMakers(catalog);
	const modelIds = await upsertModels(catalog, makerIds, categoryIds);
	await upsertImages(catalog, modelIds, images);
	await refreshMakerCounts();

	log(chalk.green(args["dry-run"] ? "Dry run done" : "Catalog imported"));
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(chalk.red("Catalog import failed:"), error);
		process.exit(1);
	});
