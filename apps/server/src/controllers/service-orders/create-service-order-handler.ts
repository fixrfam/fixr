import type { jwtPayload } from "@fixr/schemas/auth";
import type { createServiceOrderMockSchema } from "@fixr/schemas/service-orders";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { isAllowedCompanyPhotoUrl } from "@/src/config/r2";
import {
	createServiceOrderWithPhotos,
	getClientById,
	getDeviceBrandById,
	getDeviceCategoryById,
	getEmployeeByUserId,
} from "@/src/services/service-orders/service-orders.services";
import { apiResponse } from "@/src/core/lib/response";

export async function createServiceOrderHandler({
	userJwt,
	subdomain,
	data,
	response,
}: {
	userJwt: z.infer<typeof jwtPayload>;
	subdomain: string;
	data: z.infer<typeof createServiceOrderMockSchema>;
	response: FastifyReply;
}) {
	if (!userJwt.company) {
		return response.status(404).send(
			apiResponse({
				status: 404,
				error: "Not Found",
				code: "company_not_found",
				message: "There's no companies bound to your account",
				data: null,
			})
		);
	}

	const isSameCompany = userJwt.company.subdomain === subdomain;

	if (!isSameCompany) {
		return response.status(403).send(
			apiResponse({
				status: 403,
				error: "Forbidden",
				code: "not_allowed",
				message: "You are not allowed to perform this action.",
				data: null,
			})
		);
	}

	const employee = await getEmployeeByUserId(userJwt.id);

	if (!employee || employee.companyId !== userJwt.company.id) {
		return response.status(403).send(
			apiResponse({
				status: 403,
				error: "Forbidden",
				code: "employee_not_found",
				message: "Employee profile not found for this account.",
				data: null,
			})
		);
	}

	const [client, deviceBrand, deviceCategory] = await Promise.all([
		getClientById(data.clientId),
		getDeviceBrandById(data.deviceBrandId),
		getDeviceCategoryById(data.deviceCategoryId),
	]);

	if (!client) {
		return response.status(404).send(
			apiResponse({
				status: 404,
				error: "Not Found",
				code: "client_not_found",
				message: "Client not found.",
				data: null,
			})
		);
	}

	if (!deviceBrand) {
		return response.status(404).send(
			apiResponse({
				status: 404,
				error: "Not Found",
				code: "device_brand_not_found",
				message: "Device brand not found.",
				data: null,
			})
		);
	}

	if (!deviceCategory) {
		return response.status(404).send(
			apiResponse({
				status: 404,
				error: "Not Found",
				code: "device_category_not_found",
				message: "Device category not found.",
				data: null,
			})
		);
	}

	const companyId = userJwt.company.id;

	const invalidPhoto = data.photos.find(
		(photo) => !isAllowedCompanyPhotoUrl(photo.url, companyId)
	);

	if (invalidPhoto) {
		return response.status(400).send(
			apiResponse({
				status: 400,
				error: "Bad Request",
				code: "invalid_photo_url",
				message:
					"Photo URL must come from a pre-signed upload for this company.",
				data: null,
			})
		);
	}

	const { serviceOrder, photos } = await createServiceOrderWithPhotos({
		companyId: userJwt.company.id,
		employeeId: employee.id,
		data,
	});

	return response.status(201).send(
		apiResponse({
			status: 201,
			error: null,
			code: "create_service_order_success",
			message: "Service order created successfully.",
			data: {
				...serviceOrder,
				photos,
			},
		})
	);
}
