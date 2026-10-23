import { env } from "@fixr/env/db";
import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcryptjs";
import chalk from "chalk";
import { eq, sql } from "drizzle-orm";
import { db } from "../connection";
import {
	clients,
	companies,
	employees,
	modelCategories,
	modelMakers,
	models,
	serviceOrders,
	users,
} from "../schema";
import {
	CATEGORIES,
	CLIENTS,
	COMPANIES,
	MAKERS,
	SEED_PASSWORD,
	SERVICE_ORDERS,
} from "./data";

const args = new Set(process.argv.slice(2));
const reset = args.has("--reset");

const DAY_MS = 24 * 60 * 60 * 1000;

/** Appends the two check digits of a CPF (weights 10..2) or CNPJ base. */
function withCheckDigits(base: string, weights: (length: number) => number[]) {
	let digits = base;
	for (let i = 0; i < 2; i++) {
		const w = weights(digits.length);
		const sum = [...digits].reduce((acc, d, j) => acc + Number(d) * w[j], 0);
		const rest = sum % 11;
		digits += rest < 2 ? "0" : String(11 - rest);
	}
	return digits;
}

const cpf = (n: number) =>
	withCheckDigits(String(100_000_000 + n).slice(-9), (len) =>
		Array.from({ length: len }, (_, i) => len + 1 - i)
	);

const cnpj = (n: number) =>
	withCheckDigits(`${String(10_000_000 + n).slice(-8)}0001`, (len) =>
		Array.from({ length: len }, (_, i) => ((len - i - 1) % 8) + 2)
	);

const slugify = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");

function assertLocalDatabase() {
	const { hostname } = new URL(env.DB_URL);
	const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

	if (process.env.NODE_ENV === "production" || !isLocal) {
		console.error(
			chalk.redBright(
				`Refusing to seed: ${hostname} is not a local database (or NODE_ENV=production).`
			)
		);
		process.exit(1);
	}
}

async function truncateAll() {
	const [rows] = await db.execute(
		sql`SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'`
	);
	await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
	for (const { name } of rows as unknown as { name: string }[]) {
		if (name !== "__drizzle_migrations") {
			await db.execute(sql.raw(`TRUNCATE TABLE \`${name}\``));
		}
	}
	await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
}

async function seed() {
	const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
	let documentSeq = 1;

	await db.transaction(async (tx) => {
		const categoryIds = new Map<string, string>();
		for (const category of CATEGORIES) {
			const id = createId();
			await tx.insert(modelCategories).values({ id, ...category });
			categoryIds.set(category.slug, id);
		}

		const makerIds = new Map<string, string>();
		const modelCategory = new Map<string, string>();
		for (const maker of MAKERS) {
			const makerId = createId();
			makerIds.set(maker.slug, makerId);
			await tx.insert(modelMakers).values({
				id: makerId,
				name: maker.name,
				slug: maker.slug,
				url: `https://www.${maker.slug}.com`,
				deviceCount: maker.models.length,
			});
			for (const model of maker.models) {
				const slug = `${maker.slug}-${slugify(model.name)}`;
				modelCategory.set(`${maker.slug}:${model.name}`, model.category);
				await tx.insert(models).values({
					makerId,
					name: `${maker.name} ${model.name}`,
					slug,
					url: `https://www.${maker.slug}.com/${slug}`,
					categoryId: categoryIds.get(model.category),
				});
			}
		}

		const companyIds = new Map<string, string>();
		const employeeIds = new Map<string, string>();
		for (const company of COMPANIES) {
			const companyId = createId();
			companyIds.set(company.subdomain, companyId);
			await tx.insert(companies).values({
				id: companyId,
				name: company.name,
				subdomain: company.subdomain,
				address: company.address,
				cnpj: cnpj(companyIds.size),
			});

			for (const employee of company.employees) {
				const userId = createId();
				const employeeId = createId();
				employeeIds.set(employee.email, employeeId);
				await tx.insert(users).values({
					id: userId,
					email: employee.email,
					passwordHash,
					verified: true,
				});
				await tx.insert(employees).values({
					id: employeeId,
					name: employee.name,
					cpf: cpf(documentSeq++),
					role: employee.role,
					userId,
					companyId,
				});
			}
		}

		const clientIds: string[] = [];
		for (const client of CLIENTS) {
			const userId = createId();
			const clientId = createId();
			clientIds.push(clientId);
			await tx.insert(users).values({
				id: userId,
				email: client.email,
				passwordHash,
				verified: true,
			});
			await tx.insert(clients).values({
				id: clientId,
				name: client.name,
				phone: client.phone,
				cpf: cpf(documentSeq++),
				userId,
			});
		}

		for (const [index, order] of SERVICE_ORDERS.entries()) {
			const category = modelCategory.get(`${order.maker}:${order.model}`);
			const createdAt = new Date(Date.now() - order.daysAgo * DAY_MS);
			await tx.insert(serviceOrders).values({
				companyId: companyIds.get(order.company) as string,
				clientId: clientIds[order.client],
				employeeId: employeeIds.get(order.technician) as string,
				deviceMakerId: makerIds.get(order.maker) as string,
				deviceCategoryId: categoryIds.get(category as string) as string,
				deviceModel: order.model,
				imei: `35${String(209_900_000_000 + index).padStart(13, "0")}`,
				reportedDefect: order.defect,
				observations: order.observations,
				status: order.status,
				createdAt,
				updatedAt: createdAt,
			});
		}
	});
}

function printCredentials() {
	console.log(chalk.greenBright("\nDemo data seeded. Every account uses:"));
	console.log(`  password: ${chalk.bold(SEED_PASSWORD)}\n`);
	for (const company of COMPANIES) {
		console.log(chalk.bold(`  ${company.name} (${company.subdomain})`));
		for (const employee of company.employees) {
			console.log(`    ${employee.role.padEnd(11)} ${employee.email}`);
		}
	}
	console.log(chalk.bold("  Clients"));
	for (const client of CLIENTS) {
		console.log(`    ${"client".padEnd(11)} ${client.email}`);
	}
	console.log("");
}

(async () => {
	assertLocalDatabase();

	if (reset) {
		console.log(chalk.yellow("Truncating every table..."));
		await truncateAll();
	}

	const [existing] = await db
		.select({ id: companies.id })
		.from(companies)
		.where(eq(companies.subdomain, COMPANIES[0].subdomain))
		.limit(1);

	if (existing) {
		console.log(
			chalk.yellow(
				"Demo data is already there. Run `bun run setup --reset` to start over."
			)
		);
		printCredentials();
		process.exit(0);
	}

	await seed();
	printCredentials();
	process.exit(0);
})().catch((error) => {
	console.error(chalk.redBright("Seed failed:"), error);
	process.exit(1);
});
