import { t } from "elysia";
import { type ErrorKey, errors } from "../errors";

export interface ApiResponseSchema<T = unknown> {
	status: number;
	error: string | null;
	message: string | null;
	code: string;
	data: T | null;
}

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

export const errorResponse = (key: ErrorKey) => createErrorSchema(key);

export const errorResponses = (...keys: ErrorKey[]) =>
	t.Union(keys.map(createErrorSchema));
