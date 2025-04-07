import { FastifySchema } from "fastify";
import { z } from "zod";

export type RouteDoc = FastifySchema;

export type ApiResponseSchema<T = unknown> = {
    status: number;
    error: string | null;
    message: string;
    code: string;
    data: T | null;
};

export const zodResponseSchema = <T extends z.ZodTypeAny>({
    status,
    error,
    message,
    code,
    data,
}: Omit<ApiResponseSchema, "data"> & { data: T | null }) => {
    return z.object({
        status: z.literal(status),
        error: z.literal(error),
        message: z.literal(message),
        code: z.literal(code),
        data: data === null ? z.literal(null) : data,
    });
};
