import { z, ZodObject, ZodRawShape } from "zod";

export type ApiResponse<T = unknown> = {
    status: number;
    error: string | null;
    message: string;
    code: string;
    data: T | null;
};

export const apiResponseSchema = z
    .object({
        status: z
            .number()
            .describe(
                "The [HTTP status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) for the response."
            ),
        error: z
            .string()
            .nullable()
            .describe("The error that occurred. Will be `null` when there is no error."),
        message: z
            .string()
            .describe("A message for the developers to better understand the response."),
        code: z.string().describe("A code used by the frontend to show user feedback."),
        data: z.unknown().nullable().describe("Data that the user requested / error information."),
    })
    .describe("All the api responses are returned in this format.");

export type PaginatedData<T = unknown> = {
    records: T[];
    pagination: {
        total_records: number;
        total_pages: number;
        current_page: number;
        next_page: number | null;
        prev_page: number | null;
    };
};

export const paginatedDataSchema = (recordSchema: ZodObject<ZodRawShape>) =>
    z
        .object({
            records: z.array(z.object(recordSchema.shape)),
            pagination: z.object({
                total_records: z.number().describe("Total number of records in the database."),
                total_pages: z
                    .number()
                    .describe("Total number of pages that this query will contain."),
                current_page: z.number().describe("Current page number."),
                next_page: z.number().nullable().describe("Next page (if there is one)."),
                prev_page: z.number().nullable().describe("Previous page (if there is one)."),
            }),
        })
        .describe("All paginated responses are returned in this format.");

export const getPaginatedDataSchema = z.object({
    page: z.coerce.number().gte(1),
    perPage: z.coerce.number().gte(1).lte(100).optional(),
    query: z.string().optional(),
    sort: z.enum(["newer", "older"]).optional(),
});
