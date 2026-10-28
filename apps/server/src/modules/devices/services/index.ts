import { devices } from "@fixr/db/schema";
import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createDeviceSchema,
	getDevicesQuerySchema,
	patchDeviceSchema,
} from "@fixr/schemas/devices";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { AppError } from "../../../core/lib/app-error";
import { withModelImageUrl } from "../../../core/lib/model-image";
import {
	getPaginatedCount,
	getPaginatedRecords,
	paginationMeta,
} from "../../../core/lib/pagination";
import { apiResponse, paginatedData } from "../../../core/lib/response";
import { DevicesRepository, deviceJoins, deviceSelect } from "../repositories";

type UserJwt = z.infer<typeof jwtPayload>;

/** Blank optional texts are stored as null. */
function emptyToNull<T extends Record<string, unknown>>(data: T) {
	return Object.fromEntries(
		Object.entries(data).map(([key, value]) => [
			key,
			value === "" ? null : value,
		])
	) as T;
}

/** @description Business logic for the customers' devices */
export class DevicesService {
	/** Resolve the caller's company, refusing a subdomain that isn't theirs. */
	private static resolveCompanyId(userJwt: UserJwt, subdomain: string) {
		if (!userJwt.company) {
			throw new AppError("DEVICE_COMPANY_NOT_FOUND");
		}
		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("DEVICE_NOT_ALLOWED");
		}
		return userJwt.company.id;
	}

	/** An active device of the company. Deleted or foreign devices are reported as not found. */
	private static async queryOwnDevice(deviceId: string, companyId: string) {
		const device = await DevicesRepository.queryDeviceOfCompany(
			deviceId,
			companyId
		);
		if (!device) {
			throw new AppError("DEVICE_NOT_FOUND");
		}
		return withModelImageUrl(device);
	}

	private static async assertUsableModel(modelId: string, companyId: string) {
		const model = await DevicesRepository.queryModelForCompany(
			modelId,
			companyId
		);
		if (!model) {
			throw new AppError("DEVICE_MODEL_NOT_FOUND");
		}
	}

	static async listDevices({
		userJwt,
		subdomain,
		page,
		perPage,
		query,
		sort,
		customerId,
		status,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		response: FastifyReply;
	} & z.infer<typeof getDevicesQuerySchema>) {
		const companyId = DevicesService.resolveCompanyId(userJwt, subdomain);
		const PER_PAGE = perPage ?? 10;
		const filter = DevicesRepository.buildListFilter(companyId, {
			query,
			customerId,
			status,
		});

		const [records, totalRecords] = await Promise.all([
			getPaginatedRecords({
				table: devices,
				select: deviceSelect,
				skip: (page - 1) * PER_PAGE,
				take: PER_PAGE,
				where: filter,
				order: DevicesRepository.buildOrder(sort),
				joins: deviceJoins,
			}),
			getPaginatedCount({ table: devices, where: filter, joins: deviceJoins }),
		]);

		const pagination = paginationMeta({
			page,
			perPage: PER_PAGE,
			totalRecords,
			recordsOnPage: records.length,
		});

		if (!pagination) {
			throw new AppError("DEVICE_PAGE_OUT_OF_BOUNDS");
		}

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "list_devices_success",
				message: "Devices retrieved successfully.",
				data: paginatedData({
					records: await Promise.all(
						(records as { model: { imageKey: string | null } }[]).map(
							withModelImageUrl
						)
					),
					pagination,
				}),
			})
		);
	}

	static async getDevice({
		userJwt,
		subdomain,
		deviceId,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		deviceId: string;
		response: FastifyReply;
	}) {
		const companyId = DevicesService.resolveCompanyId(userJwt, subdomain);
		const device = await DevicesService.queryOwnDevice(deviceId, companyId);
		const serviceOrders =
			await DevicesRepository.queryRecentServiceOrders(deviceId);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "get_device_success",
				message: "Device retrieved successfully.",
				data: { ...device, serviceOrders },
			})
		);
	}

	static async createDevice({
		userJwt,
		subdomain,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		data: z.infer<typeof createDeviceSchema>;
		response: FastifyReply;
	}) {
		const companyId = DevicesService.resolveCompanyId(userJwt, subdomain);

		const customer = await DevicesRepository.queryCustomerOfCompany(
			data.customerId,
			companyId
		);
		if (!customer) {
			throw new AppError("DEVICE_CUSTOMER_NOT_FOUND");
		}
		await DevicesService.assertUsableModel(data.modelId, companyId);

		const deviceId = await DevicesRepository.insertDevice({
			...emptyToNull(data),
			companyId,
		});
		const device = await DevicesService.queryOwnDevice(deviceId, companyId);

		return response.status(201).send(
			apiResponse({
				status: 201,
				error: null,
				code: "create_device_success",
				message: "Device created successfully.",
				data: device,
			})
		);
	}

	static async patchDevice({
		userJwt,
		subdomain,
		deviceId,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		deviceId: string;
		data: z.infer<typeof patchDeviceSchema>;
		response: FastifyReply;
	}) {
		const companyId = DevicesService.resolveCompanyId(userJwt, subdomain);
		await DevicesService.queryOwnDevice(deviceId, companyId);

		if (data.modelId) {
			await DevicesService.assertUsableModel(data.modelId, companyId);
		}
		if (Object.keys(data).length > 0) {
			await DevicesRepository.updateDevice(deviceId, emptyToNull(data));
		}

		const device = await DevicesService.queryOwnDevice(deviceId, companyId);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "patch_device_success",
				message: "Device updated successfully.",
				data: device,
			})
		);
	}

	/** Soft delete: the device disappears from the API but its service orders keep pointing to it. */
	static async deleteDevice({
		userJwt,
		subdomain,
		deviceId,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		deviceId: string;
		response: FastifyReply;
	}) {
		const companyId = DevicesService.resolveCompanyId(userJwt, subdomain);
		await DevicesService.queryOwnDevice(deviceId, companyId);

		await DevicesRepository.updateDevice(deviceId, { deletedAt: new Date() });

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "delete_device_success",
				message: "Device deleted successfully.",
				data: null,
			})
		);
	}
}
