import { db } from "@fixr/db/connection";
import { serviceOrders } from "@fixr/db/schema";
import type { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import { createId } from "@paralleldrive/cuid2";
import type { z } from "zod";
import { nextSeq } from "./sequence";

export async function makeServiceOrder(input: {
	companyId: string;
	clientId: string;
	employeeId: string;
	deviceMakerId: string;
	deviceCategoryId: string;
	status?: z.infer<typeof serviceOrderStatuses>;
	deviceModel?: string;
	createdAt?: Date;
}) {
	const serviceOrder = {
		id: createId(),
		companyId: input.companyId,
		clientId: input.clientId,
		employeeId: input.employeeId,
		deviceMakerId: input.deviceMakerId,
		deviceCategoryId: input.deviceCategoryId,
		deviceModel: input.deviceModel ?? `Device ${nextSeq()}`,
		reportedDefect: "Tela quebrada",
		status: input.status ?? "pending",
		...(input.createdAt ? { createdAt: input.createdAt } : {}),
	};

	await db.insert(serviceOrders).values(serviceOrder);

	return serviceOrder;
}
