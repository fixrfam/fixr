import { t } from "elysia";

export interface ApiResponseSchema<T = unknown> {
	status: number;
	error: string | null;
	message: string;
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
