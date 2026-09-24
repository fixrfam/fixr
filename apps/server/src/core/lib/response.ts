import type { ApiResponse, PaginatedData } from "@fixr/schemas/utils";
import type { FastifyReply } from "fastify";

export const apiResponse = ({
	status,
	error,
	message,
	code,
	data,
}: ApiResponse) => {
	return { status, error, message, code, data };
};

export const paginatedData = ({ records, pagination }: PaginatedData) => {
	return { records, pagination };
};

export const httpStatusCodes: Record<number, string> = {
	200: "OK",
	201: "Created",
	204: "No Content",
	301: "Moved Permanently",
	302: "Found",
	304: "Not Modified",
	400: "Bad Request",
	401: "Unauthorized",
	403: "Forbidden",
	404: "Not Found",
	405: "Method Not Allowed",
	409: "Conflict",
	410: "Gone",
	416: "Range Not Satisfiable",
	418: "I'm a teapot",
	429: "Too Many Requests",
	500: "Internal Server Error",
	501: "Not Implemented",
	502: "Bad Gateway",
	503: "Service Unavailable",
	504: "Gateway Timeout",
};

/**
 * Send an error envelope, bypassing the route's response schema.
 *
 * Route docs declare error responses with literal values (one code per
 * status). Serializing a different error through them (e.g. a validation
 * error on a route that documents a 400 `invalid_token`) fails and turns the
 * reply into a generic 500, so error envelopes are serialized as plain JSON.
 */
export function sendErrorResponse(reply: FastifyReply, body: ApiResponse) {
	return reply
		.status(body.status)
		.type("application/json; charset=utf-8")
		.serializer(JSON.stringify)
		.send(apiResponse(body));
}
