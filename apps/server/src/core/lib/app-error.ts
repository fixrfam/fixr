import { type ErrorKey, errors } from "../errors";
import { apiResponse } from "./response";

/**
 * Application-level error with typed error codes from the central registry.
 *
 * Throw this in controllers/services and handle it in the global error handler.
 * Every possible error is registered upfront for full type safety.
 */
export class AppError extends Error {
	/** Machine-readable error code sent in API responses */
	code: string;

	/** HTTP status code */
	status: number;

	/** Additional error context or metadata */
	details?: unknown;

	/**
	 * @param key - Error key from the central error registry
	 * @param details - Optional error details
	 */
	constructor(key: ErrorKey, details?: unknown) {
		const { code, message, status } = errors[key];
		super(message);
		this.name = "AppError";
		this.code = code;
		this.status = status;
		this.details = details;
	}

	/** Build the API response object for this error */
	toResponse() {
		return apiResponse({
			status: this.status,
			error: this.message,
			code: this.code,
			message: null,
			data: this.details ?? null,
		});
	}
}
