import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createDeviceSchema,
	getDevicesQuerySchema,
	patchDeviceSchema,
} from "@fixr/schemas/devices";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { DevicesService } from "../services";

type UserJwt = z.infer<typeof jwtPayload>;

/** @description Customer devices request handlers */
export class DevicesController {
	static listDevices(
		params: {
			userJwt: UserJwt;
			subdomain: string;
			response: FastifyReply;
		} & z.infer<typeof getDevicesQuerySchema>
	) {
		return DevicesService.listDevices(params);
	}

	static getDevice(params: {
		userJwt: UserJwt;
		subdomain: string;
		deviceId: string;
		response: FastifyReply;
	}) {
		return DevicesService.getDevice(params);
	}

	static createDevice(params: {
		userJwt: UserJwt;
		subdomain: string;
		data: z.infer<typeof createDeviceSchema>;
		response: FastifyReply;
	}) {
		return DevicesService.createDevice(params);
	}

	static patchDevice(params: {
		userJwt: UserJwt;
		subdomain: string;
		deviceId: string;
		data: z.infer<typeof patchDeviceSchema>;
		response: FastifyReply;
	}) {
		return DevicesService.patchDevice(params);
	}

	static deleteDevice(params: {
		userJwt: UserJwt;
		subdomain: string;
		deviceId: string;
		response: FastifyReply;
	}) {
		return DevicesService.deleteDevice(params);
	}
}
