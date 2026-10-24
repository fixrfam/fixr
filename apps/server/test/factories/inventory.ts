import { db } from "@fixr/db/connection";
import { parts, serviceParts, services, suppliers } from "@fixr/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { nextSeq, uniqueDigits } from "./sequence";

export async function makeSupplier(input: {
	companyId: string;
	name?: string;
}) {
	const seq = nextSeq();
	const supplier = {
		id: createId(),
		companyId: input.companyId,
		name: input.name ?? `Supplier ${seq}`,
		cnpj: uniqueDigits(14),
		contact: `Contact ${seq}`,
		phone: "11999999999",
		email: `supplier-${seq}@fixr.test`,
	};

	await db.insert(suppliers).values(supplier);

	return supplier;
}

export async function makePart(input: {
	companyId: string;
	supplierId: string;
	name?: string;
	category?: string;
	stock?: number;
	minStock?: number;
	costPrice?: number;
	salePrice?: number;
}) {
	const seq = nextSeq();
	const part = {
		id: createId(),
		companyId: input.companyId,
		supplierId: input.supplierId,
		sku: `SKU-${seq}`,
		name: input.name ?? `Part ${seq}`,
		description: null,
		category: input.category ?? "Baterias",
		costPrice: input.costPrice ?? 100,
		salePrice: input.salePrice ?? 180,
		stock: input.stock ?? 5,
		minStock: input.minStock ?? 1,
	};

	await db.insert(parts).values(part);

	return part;
}

export async function makeService(input: {
	companyId: string;
	name?: string;
	price?: number;
	partIds?: string[];
	deviceCategories?: string[];
}) {
	const seq = nextSeq();
	const service = {
		id: createId(),
		companyId: input.companyId,
		name: input.name ?? `Service ${seq}`,
		description: `Service description ${seq}`,
		estimatedDurationMinutes: 60,
		price: input.price ?? 150,
		deviceCategories: input.deviceCategories ?? ["Telefonia"],
		testInstructions: [],
		testParameters: [],
	};

	await db.insert(services).values(service);
	if (input.partIds?.length) {
		await db
			.insert(serviceParts)
			.values(
				input.partIds.map((partId) => ({ serviceId: service.id, partId }))
			);
	}

	return { ...service, partIds: input.partIds ?? [] };
}
