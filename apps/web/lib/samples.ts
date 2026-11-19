import type { ModelListItem } from "@fixr/schemas/models";
import type { z } from "zod";
import type { dataSchema as apiKeySchema } from "@/components/dashboard/api-keys/columns";
import type { dataSchema as employeeSchema } from "@/components/dashboard/employees/columns";
import type {
	PartTableRow,
	ServiceTableRow,
	SupplierTableRow,
} from "@/components/dashboard/parts/table/data";
import type { CustomerRow } from "@/lib/services/customers";
import type { DepartmentRow } from "@/lib/services/departments";
import type { DeviceRow } from "@/lib/services/devices";
import type { Estimate } from "@/lib/services/estimates";
import type {
	PortalEstimateSummary,
	PortalServiceOrderSummary,
} from "@/lib/services/portal";
import type {
	ServiceOrderItems,
	ServiceOrderRow,
} from "@/lib/services/service-orders";

/**
 * Stand-ins that skeletons are measured from while the real records load.
 * Their text is never shown, only its length, so it reads like typical data.
 */

/** `count` copies of `row` with distinct ids, to draw a table or list from. */
function sampleRows<T extends { id: string | number }>(row: T, count = 6): T[] {
	return Array.from(
		{ length: count },
		(_, index) =>
			({
				...row,
				id: typeof row.id === "number" ? index : `sample-${index}`,
			}) as T
	);
}

const DATE = "2026-01-01T12:00:00.000Z";
const relation = { id: "sample", name: "Sample name" };

export const SAMPLE_CUSTOMERS = sampleRows<CustomerRow>({
	id: "sample",
	name: "Maria Aparecida Souza",
	cpf: "00000000000",
	email: "maria.souza@email.com",
	phone: "00000000000",
	alternativePhone: null,
	address: null,
	city: "São Paulo",
	state: "SP",
	createdAt: DATE,
});

export const SAMPLE_SERVICES = sampleRows<ServiceTableRow>({
	id: "sample",
	name: "Screen replacement",
	description: "Replace the display assembly",
	estimatedDurationMinutes: 60,
	price: 15_000,
	partsPrice: 30_000,
	totalPrice: 45_000,
	partIds: [],
	deviceCategories: ["smartphones"],
	testInstructions: [],
	testParameters: [],
	parts: [],
});

export const SAMPLE_SUPPLIERS = sampleRows<SupplierTableRow>({
	id: "sample",
	name: "Distribuidora Peças Ltda",
	cnpj: "00000000000000",
	contact: "João Pereira",
	phone: "00000000000",
	email: "contato@pecas.com.br",
	partsCount: 12,
});

export const SAMPLE_PARTS = sampleRows<PartTableRow>({
	id: "sample",
	sku: "SKU-000000",
	name: "Display OLED 6.1",
	description: null,
	category: "Displays",
	costPrice: 20_000,
	salePrice: 30_000,
	stock: 10,
	minStock: 2,
	supplierId: "sample",
	supplier: { id: "sample", name: "Distribuidora Peças" },
	stockStatus: "in_stock",
});

export const SAMPLE_DEVICES = sampleRows<DeviceRow>({
	id: "sample",
	customerId: "sample",
	modelId: "sample",
	imei: "000000000000000",
	serialNumber: null,
	notes: null,
	status: "in_shop",
	createdAt: DATE,
	updatedAt: DATE,
	customer: { ...relation, cpf: "00000000000", phone: "00000000000" },
	model: { ...relation, slug: "sample", imageUrl: null },
	maker: relation,
	category: { ...relation, slug: "smartphones" },
});

export const SAMPLE_DEPARTMENTS = sampleRows<DepartmentRow>(
	{
		id: "sample",
		name: "Bancada técnica",
		leaderId: "sample",
		leader: { id: "sample", name: "Carlos Henrique", cpf: "00000000000" },
		membersCount: 4,
		createdAt: DATE,
	},
	4
);

export const SAMPLE_SERVICE_ORDERS = sampleRows<ServiceOrderRow>({
	id: "sample",
	number: 1000,
	customerId: "sample",
	employeeId: "sample",
	departmentId: "sample",
	assigneeId: "sample",
	deviceId: "sample",
	reportedDefect: "Screen does not turn on",
	observations: null,
	status: "diagnosing",
	createdAt: DATE,
	updatedAt: DATE,
	customer: {
		...relation,
		cpf: "00000000000",
		phone: "00000000000",
		email: null,
	},
	employee: relation,
	department: relation,
	assignee: { ...relation, cpf: "00000000000" },
	device: {
		id: "sample",
		imei: "000000000000000",
		serialNumber: null,
		status: "in_shop",
	},
	model: { ...relation, slug: "sample", imageUrl: null },
	deviceMaker: relation,
	deviceCategory: { ...relation, slug: "smartphones" },
});

export const SAMPLE_ESTIMATES = sampleRows<Estimate>({
	id: "sample",
	serviceOrderId: "sample",
	number: 1000,
	status: "sent",
	discountPercentage: 0,
	validUntil: DATE,
	notes: null,
	sentTo: null,
	sentAt: DATE,
	respondedAt: null,
	rejectionReason: null,
	createdAt: DATE,
	updatedAt: DATE,
	customer: {
		...relation,
		phone: "00000000000",
		email: null,
	},
	serviceOrder: { id: "sample", number: 1000, status: "diagnosing" },
	device: {
		model: { ...relation, slug: "sample", imageUrl: null },
		maker: "Sample",
		category: "Smartphones",
	},
	itemsCount: 3,
	totals: {
		parts: 30_000,
		services: 15_000,
		subtotal: 45_000,
		discount: 0,
		total: 45_000,
	},
});

export const SAMPLE_MODELS = sampleRows<ModelListItem>({
	id: "sample",
	name: "Galaxy S24 Ultra",
	slug: "sample",
	imageUrl: null,
	status: "Available",
	price: null,
	announced: "2024, January",
	released: null,
	displaySize: "6.8 inches",
	displaySizeInches: 6.8,
	displayResolution: "1440 x 3120 pixels",
	chipset: "Snapdragon 8 Gen 3",
	cpu: null,
	internalMemory: "256GB 12GB RAM",
	battery: "5000 mAh",
	colorsHex: null,
	isCustom: false,
	maker: { id: "sample", name: "Samsung", slug: "samsung" },
	category: { id: "sample", name: "Smartphones", slug: "smartphones" },
} as ModelListItem);

export const SAMPLE_EMPLOYEES = sampleRows<z.infer<typeof employeeSchema>>({
	id: "sample",
	name: "Ana Beatriz Lima",
	cpf: "00000000000",
	phone: "00000000000",
	role: "technician",
	createdAt: new Date(DATE),
	userId: "sample",
	companyId: "sample",
	account: {
		id: "sample",
		email: "ana.lima@email.com",
		avatarUrl: null,
		createdAt: new Date(DATE),
	},
	departments: [relation],
} as z.infer<typeof employeeSchema>);

export const SAMPLE_API_KEYS = sampleRows<z.infer<typeof apiKeySchema>>(
	{
		id: "sample",
		name: "Integração ERP",
		prefix: "fxr_00000000",
		employeeId: "sample",
		companyId: "sample",
		scopes: ["serviceOrders:read"],
		expiresAt: null,
		lastUsedAt: null,
		revokedAt: null,
		createdAt: new Date(DATE),
	} as z.infer<typeof apiKeySchema>,
	3
);

const sampleItem = {
	id: "sample",
	serviceOrderId: "sample",
	partId: null,
	serviceId: "sample",
	parentItemId: null,
	type: "service",
	name: "Screen replacement",
	quantity: 1,
	unitPrice: 15_000,
	total: 15_000,
	createdAt: new Date(DATE),
	updatedAt: new Date(DATE),
} satisfies ServiceOrderItems["items"][number];

export const SAMPLE_ORDER_ITEMS: ServiceOrderItems = {
	items: [
		sampleItem,
		{
			...sampleItem,
			id: "sample-part",
			type: "part",
			partId: "sample",
			serviceId: null,
			parentItemId: "sample",
			name: "Display OLED 6.1",
			unitPrice: 30_000,
			total: 30_000,
		},
		{ ...sampleItem, id: "sample-cleaning", name: "Internal cleaning" },
	],
	totals: { parts: 30_000, services: 30_000, total: 60_000 },
};

const sampleShop = { name: "Assistência Técnica", logoUrl: null };

export const SAMPLE_PORTAL_ORDERS = sampleRows<PortalServiceOrderSummary>(
	{
		id: "sample",
		code: "SHOP-1000",
		status: "fixing",
		deviceMaker: "Samsung",
		deviceModel: "Galaxy S24 Ultra",
		deviceCategory: "smartphones",
		deviceImageUrl: null,
		createdAt: DATE,
		updatedAt: DATE,
		company: sampleShop,
		pendingEstimate: false,
	},
	3
);

export const SAMPLE_PORTAL_ESTIMATES = sampleRows<PortalEstimateSummary>(
	{
		id: "sample",
		number: 1000,
		status: "sent",
		validUntil: DATE,
		sentAt: DATE,
		respondedAt: null,
		expired: false,
		serviceOrderId: "sample",
		serviceOrderCode: "SHOP-1000",
		company: sampleShop,
		deviceMaker: "Samsung",
		deviceModel: "Galaxy S24 Ultra",
		deviceCategory: "smartphones",
		deviceImageUrl: null,
		totals: {
			parts: 30_000,
			services: 15_000,
			subtotal: 45_000,
			discount: 0,
			total: 45_000,
		},
	},
	3
);
