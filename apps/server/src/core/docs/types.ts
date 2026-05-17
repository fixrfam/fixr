import { t } from "elysia";
import { type ErrorKey, errors } from "../errors";

export interface ApiResponseSchema<T = unknown> {
	status: number;
	error: string | null;
	message: string | null;
	code: string;
	data: T | null;
}

/**
 * Build an Elysia response schema for a known success response.
 *
 * @param args - The known response fields (status, error, message, code, data)
 * @param args.status - The HTTP status code
 * @param args.error - The error string (null for success)
 * @param args.message - The developer-friendly message
 * @param args.code - The machine-readable code
 * @param args.data - The response data schema, or null
 */
export const elysiaResponseSchema = <
	T extends ReturnType<typeof t.Object> | null,
>({
	status,
	error,
	message: _,
	code,
	data,
}: Omit<ApiResponseSchema, "data"> & { data: T | null }) => {
	return t.Object({
		status: t.Literal(status),
		error: error === null ? t.Null() : t.Literal(error),
		message: t.String(),
		code: t.Literal(code),
		data: data === null ? t.Null() : data,
	});
};

/** Build a typed Elysia object schema from an error registry key */
const createErrorSchema = (key: ErrorKey) => {
	const { status, code, message } = errors[key];
	return t.Object({
		status: t.Literal(status),
		error: t.Literal(message),
		message: t.Null(),
		code: t.Literal(code),
		data: t.Null(),
	});
};

/**
 * Typed error response schema for a single error key.
 *
 * The returned schema uses literal values for `status`, `error`, and `code`
 * so the OpenAPI docs show exactly what the endpoint returns.
 *
 * @param key - Error key from the central error registry
 */
export const errorResponse = (key: ErrorKey) => createErrorSchema(key);

/**
 * Typed error response union for multiple error keys sharing a status code.
 *
 * Wraps each error schema in a `t.Union` so the OpenAPI docs show all
 * possible error variants for the given status code.
 *
 * @param keys - One or more error keys from the central error registry
 */
export const errorResponses = (...keys: ErrorKey[]) =>
	t.Union(keys.map(createErrorSchema));
