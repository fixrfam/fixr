import type { FastifyReply } from "fastify";
import { type ErrorKey, errors } from "../errors";
import { apiResponse, httpStatusCodes } from "./response";

/**
 * Application-level error with typed error codes from the central registry.
 *
 * Throw this in controllers/services and handle it in the error-handler middleware.
 * Every possible error is registered upfront for full type safety.
 */
export class AppError extends Error {
	/** @property {string} code - Machine-readable error code sent in API responses */
	code: string;

	/** @property {number} status - HTTP status code */
	status: number;

	/** @property {unknown} [details] - Additional error context or metadata */
	details?: unknown;

	/**
	 * @param {ErrorKey} key - Error key from the central error registry
	 * @param {unknown} [details] - Optional error details
	 */
	constructor(key: ErrorKey, details?: unknown) {
		const { code, message, status } = errors[key];
		super(message);
		this.name = "AppError";
		this.code = code;
		this.status = status;
		this.details = details;
	}

	/**
	 * Send the error response through a Fastify reply.
	 *
	 * @param {FastifyReply} response - Fastify reply object
	 */
	send(response: FastifyReply) {
		return response.status(this.status).send(
			apiResponse({
				status: this.status,
				error: httpStatusCodes[this.status],
				code: this.code,
				message: this.message,
				data: this.details ?? null,
			})
		);
	}
}
