import { env } from "@fixr/env/db";
import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcryptjs";
import chalk from "chalk";
import { eq, sql } from "drizzle-orm";
import { db } from "../connection";
import {
	companies,
	customers,
	employees,
	modelCategories,
	modelMakers,
	models,
	parts,
	serviceOrders,
	serviceParts,
	services,
	suppliers,
	users,
} from "../schema";
import {
	CATEGORIES,
	COMPANIES,
	CUSTOMERS,
	MAKERS,
	PARTS,
	SEED_PASSWORD,
	SERVICE_ORDERS,
	SERVICES,
	SUPPLIERS,
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

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Suppliers, parts and services of one company (each company gets its own copy). */
async function seedInventory(tx: Transaction, companyId: string) {
	const supplierIds = new Map<string, string>();
	for (const [index, { key, ...supplier }] of SUPPLIERS.entries()) {
		const supplierId = createId();
		supplierIds.set(key, supplierId);
		await tx.insert(suppliers).values({
			id: supplierId,
			companyId,
			cnpj: cnpj(100 + index),
			...supplier,
		});
	}

	const partIds = new Map<string, string>();
	for (const { key, supplier, ...part } of PARTS) {
		const partId = createId();
		partIds.set(key, partId);
		await tx.insert(parts).values({
			id: partId,
			companyId,
			supplierId: supplierIds.get(supplier) as string,
			...part,
		});
	}

	for (const { parts: partKeys, ...service } of SERVICES) {
		const serviceId = createId();
		await tx.insert(services).values({ id: serviceId, companyId, ...service });
		await tx.insert(serviceParts).values(
			partKeys.map((key) => ({
				serviceId,
				partId: partIds.get(key) as string,
			}))
		);
	}
}

/**
 * Customers are company-scoped: a person served by two shops has one record
 * in each, all linked to the same customer login. Returns ids keyed by
 * `company:customerIndex`.
 */
async function seedCustomers(
	tx: Transaction,
	{
		companyIds,
		passwordHash,
		cpfs,
	}: { companyIds: Map<string, string>; passwordHash: string; cpfs: string[] }
) {
	const userIds: string[] = [];
	for (const customer of CUSTOMERS) {
		const userId = createId();
		userIds.push(userId);
		await tx.insert(users).values({
			id: userId,
			email: customer.email,
			passwordHash,
			verified: true,
		});
	}

	const customerIds = new Map<string, string>();
	for (const order of SERVICE_ORDERS) {
		const key = `${order.company}:${order.customer}`;
		if (customerIds.has(key)) {
			continue;
		}
		const customer = CUSTOMERS[order.customer];
		const customerId = createId();
		customerIds.set(key, customerId);
		await tx.insert(customers).values({
			id: customerId,
			companyId: companyIds.get(order.company) as string,
			name: customer.name,
			email: customer.email,
			phone: customer.phone,
			cpf: cpfs[order.customer],
			address: customer.address,
			city: customer.city,
			state: customer.state,
			userId: userIds[order.customer],
		});
	}

	return customerIds;
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
				email: company.email,
				phone: company.phone,
				website: company.website,
				cnpj: cnpj(companyIds.size),
			});

			await seedInventory(tx, companyId);

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

		const customerIds = await seedCustomers(tx, {
			companyIds,
			passwordHash,
			cpfs: CUSTOMERS.map(() => cpf(documentSeq++)),
		});

		for (const [index, order] of SERVICE_ORDERS.entries()) {
			const category = modelCategory.get(`${order.maker}:${order.model}`);
			const createdAt = new Date(Date.now() - order.daysAgo * DAY_MS);
			await tx.insert(serviceOrders).values({
				companyId: companyIds.get(order.company) as string,
				customerId: customerIds.get(
					`${order.company}:${order.customer}`
				) as string,
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
	console.log(chalk.bold("  Customers"));
	for (const customer of CUSTOMERS) {
		console.log(`    ${"customer".padEnd(11)} ${customer.email}`);
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
