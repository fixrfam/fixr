import { and, eq, gte, like, lte, or, type SQL } from "@fixr/db/connection";
import {
	clients,
	deviceBrands,
	deviceCategories,
	employees,
	serviceOrders,
} from "@fixr/db/schema";
import type { getServiceOrdersQuerySchema } from "@fixr/schemas/service-orders";
import type { z } from "zod";

function endOfDay(date: Date) {
	const end = new Date(date);
	end.setHours(23, 59, 59, 999);
	return end;
}

export function buildServiceOrdersListFilter({
	companyId,
	filters,
}: {
	companyId: string;
	filters: Pick<
		z.infer<typeof getServiceOrdersQuerySchema>,
		| "query"
		| "deviceCategoryId"
		| "employeeId"
		| "status"
		| "dateFrom"
		| "dateTo"
	>;
}) {
	const conditions: SQL[] = [eq(serviceOrders.companyId, companyId)];

	if (filters.deviceCategoryId) {
		conditions.push(
			eq(serviceOrders.deviceCategoryId, filters.deviceCategoryId)
		);
	}

	if (filters.employeeId) {
		conditions.push(eq(serviceOrders.employeeId, filters.employeeId));
	}

	if (filters.status) {
		conditions.push(eq(serviceOrders.status, filters.status));
	}

	if (filters.dateFrom) {
		conditions.push(gte(serviceOrders.createdAt, filters.dateFrom));
	}

	if (filters.dateTo) {
		conditions.push(lte(serviceOrders.createdAt, endOfDay(filters.dateTo)));
	}

	if (filters.query) {
		conditions.push(
			or(
				like(serviceOrders.deviceModel, `%${filters.query}%`),
				like(serviceOrders.reportedDefect, `%${filters.query}%`),
				like(clients.name, `%${filters.query}%`)
			)!
		);
	}

	return and(...conditions);
}

export const serviceOrdersListJoins = [
	{
		type: "inner" as const,
		table: clients,
		on: eq(clients.id, serviceOrders.clientId),
	},
	{
		type: "inner" as const,
		table: employees,
		on: eq(employees.id, serviceOrders.employeeId),
	},
	{
		type: "inner" as const,
		table: deviceCategories,
		on: eq(deviceCategories.id, serviceOrders.deviceCategoryId),
	},
	{
		type: "inner" as const,
		table: deviceBrands,
		on: eq(deviceBrands.id, serviceOrders.deviceBrandId),
	},
];

export const serviceOrdersListSelect = {
	id: serviceOrders.id,
	companyId: serviceOrders.companyId,
	clientId: serviceOrders.clientId,
	employeeId: serviceOrders.employeeId,
	deviceBrandId: serviceOrders.deviceBrandId,
	deviceCategoryId: serviceOrders.deviceCategoryId,
	deviceModel: serviceOrders.deviceModel,
	imei: serviceOrders.imei,
	reportedDefect: serviceOrders.reportedDefect,
	observations: serviceOrders.observations,
	status: serviceOrders.status,
	createdAt: serviceOrders.createdAt,
	updatedAt: serviceOrders.updatedAt,
	client: {
		id: clients.id,
		name: clients.name,
	},
	employee: {
		id: employees.id,
		name: employees.name,
	},
	deviceCategory: {
		id: deviceCategories.id,
		name: deviceCategories.name,
	},
	deviceBrand: {
		id: deviceBrands.id,
		name: deviceBrands.name,
	},
};
