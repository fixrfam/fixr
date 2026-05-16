import { type ErrorKey, errors } from "../errors";
import { apiResponse } from "./response";

export class AppError extends Error {
	code: string;

	status: number;

	details?: unknown;

	constructor(key: ErrorKey, details?: unknown) {
		const { code, message, status } = errors[key];
		super(message);
		this.name = "AppError";
		this.code = code;
		this.status = status;
		this.details = details;
	}

	toResponse() {
		return apiResponse({
			status: this.status,
			error: null,
			code: this.code,
			message: this.message,
			data: this.details ?? null,
		});
	}
}
