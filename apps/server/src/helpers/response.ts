import { PaginatedData, type ApiResponse } from "@repo/schemas/utils";

export const apiResponse = ({ status, error, message, code, data }: ApiResponse) => {
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
    418: "I'm a teapot",
    429: "Too Many Requests",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
};
