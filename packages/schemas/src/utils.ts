import { z } from "zod";

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
