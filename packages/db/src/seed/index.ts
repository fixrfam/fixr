import { env } from "@fixr/env/db";
import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcryptjs";
import chalk from "chalk";
import { eq, sql } from "drizzle-orm";
import { db } from "../connection";
import {
	clients,
	companies,
	devices,
	employees,
	modelCategories,
	modelMakers,
	models,
	parts,
	serviceOrderHistory,
	serviceOrderSequences,
	serviceOrderStatusValues,
	serviceOrders,
	serviceParts,
	services,
	suppliers,
	users,
} from "../schema";
import {
	CATEGORIES,
	CLIENTS,
	COMPANIES,
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
 * in each, all linked to the same client login. Returns ids keyed by
 * `company:clientIndex`.
 */
async function seedClients(
	tx: Transaction,
	{
		companyIds,
		passwordHash,
		cpfs,
	}: { companyIds: Map<string, string>; passwordHash: string; cpfs: string[] }
) {
	const userIds: string[] = [];
	for (const client of CLIENTS) {
		const userId = createId();
		userIds.push(userId);
		await tx.insert(users).values({
			id: userId,
			email: client.email,
			passwordHash,
			verified: true,
		});
	}

	const clientIds = new Map<string, string>();
	for (const order of SERVICE_ORDERS) {
		const key = `${order.company}:${order.client}`;
		if (clientIds.has(key)) {
			continue;
		}
		const client = CLIENTS[order.client];
		const clientId = createId();
		clientIds.set(key, clientId);
		await tx.insert(clients).values({
			id: clientId,
			companyId: companyIds.get(order.company) as string,
			name: client.name,
			email: client.email,
			phone: client.phone,
			cpf: cpfs[order.client],
			address: client.address,
			city: client.city,
			state: client.state,
			userId: userIds[order.client],
		});
	}

	return clientIds;
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
		const modelIds = new Map<string, string>();
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
				const modelId = createId();
				modelIds.set(`${maker.slug}:${model.name}`, modelId);
				await tx.insert(models).values({
					id: modelId,
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

		const clientIds = await seedClients(tx, {
			companyIds,
			passwordHash,
			cpfs: CLIENTS.map(() => cpf(documentSeq++)),
		});

		await seedServiceOrders(tx, {
			companyIds,
			clientIds,
			employeeIds,
			modelIds,
		});
	});
}

/** One device per customer and model; the latest order says where it is. */
async function seedServiceOrders(
	tx: Transaction,
	{
		companyIds,
		clientIds,
		employeeIds,
		modelIds,
	}: {
		companyIds: Map<string, string>;
		clientIds: Map<string, string>;
		employeeIds: Map<string, string>;
		modelIds: Map<string, string>;
	}
) {
	const deviceIds = new Map<string, string>();
	const latestOrder = new Map<string, number>();
	const lastNumber = new Map<string, number>();
	// Oldest first, so each company's numbers follow the order they were opened.
	const byAge = [...SERVICE_ORDERS.entries()].sort(
		([, a], [, b]) => b.daysAgo - a.daysAgo
	);
	for (const [index, order] of byAge) {
		const companyId = companyIds.get(order.company) as string;
		const clientId = clientIds.get(
			`${order.company}:${order.client}`
		) as string;
		const createdAt = new Date(Date.now() - order.daysAgo * DAY_MS);
		const deviceKey = `${clientId}:${order.maker}:${order.model}`;
		let deviceId = deviceIds.get(deviceKey);
		if (!deviceId) {
			deviceId = createId();
			deviceIds.set(deviceKey, deviceId);
			await tx.insert(devices).values({
				id: deviceId,
				companyId,
				clientId,
				modelId: modelIds.get(`${order.maker}:${order.model}`) as string,
				imei: `35${String(209_900_000_000 + index).padStart(13, "0")}`,
				createdAt,
			});
		}
		if (
			order.daysAgo <= (latestOrder.get(deviceId) ?? Number.POSITIVE_INFINITY)
		) {
			latestOrder.set(deviceId, order.daysAgo);
			await tx
				.update(devices)
				.set({ status: deviceStatusFor(order.status) })
				.where(eq(devices.id, deviceId));
		}
		const number = (lastNumber.get(companyId) ?? 0) + 1;
		lastNumber.set(companyId, number);
		const serviceOrderId = createId();
		const employeeId = employeeIds.get(order.technician) as string;
		await tx.insert(serviceOrders).values({
			id: serviceOrderId,
			companyId,
			number,
			clientId,
			employeeId,
			deviceId,
			reportedDefect: order.defect,
			observations: order.observations,
			status: order.status,
			createdAt,
			updatedAt: createdAt,
		});
		await tx
			.insert(serviceOrderHistory)
			.values(statusHistory(serviceOrderId, employeeId, order, createdAt));
	}
	for (const [companyId, number] of lastNumber) {
		await tx
			.insert(serviceOrderSequences)
			.values({ companyId, lastNumber: number });
	}
}

/**
 * The order walked the lifecycle step by step up to its status, spread over
 * its first days (at most until now), so the demo timeline has entries.
 */
function statusHistory(
	serviceOrderId: string,
	employeeId: string,
	order: (typeof SERVICE_ORDERS)[number],
	createdAt: Date
) {
	const path = serviceOrderStatusValues.slice(
		0,
		serviceOrderStatusValues.indexOf(order.status) + 1
	);
	const span = Math.min(order.daysAgo, 3) * DAY_MS;
	return path.map((toStatus, step) => ({
		serviceOrderId,
		fromStatus: step === 0 ? null : path[step - 1],
		toStatus,
		employeeId,
		createdAt: new Date(
			createdAt.getTime() + (span * step) / Math.max(path.length - 1, 1)
		),
	}));
}

function deviceStatusFor(status: (typeof SERVICE_ORDERS)[number]["status"]) {
	if (status === "delivered") {
		return "with_customer" as const;
	}
	return status === "ready"
		? ("ready_for_pickup" as const)
		: ("in_shop" as const);
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
