import { zodResponseSchema } from "./types";

/** Error responses shared by every company-scoped CRUD module. */
export const companyScopedErrors = {
	403: zodResponseSchema({
		status: 403,
		error: "Forbidden",
		code: "not_allowed",
		message: "You are not authorized to access this company.",
		data: null,
	}).describe("Not allowed to access this company."),
	404: zodResponseSchema({
		status: 404,
		error: "Not Found",
		code: "company_not_found",
		message: "There's no companies bound to your account",
		data: null,
	}).describe("User is not associated with a company."),
};

export const pageOutOfBoundsError = zodResponseSchema({
	status: 416,
	error: "Range Not Satisfiable",
	code: "page_out_of_bounds",
	message: "The requested page exceeds the total number of pages.",
	data: null,
}).describe("Requested page exceeds total pages.");

/** A 404 for a missing resource of the module (overrides the company 404 in the docs). */
export const notFoundError = (code: string, message: string) =>
	zodResponseSchema({
		status: 404,
		error: "Not Found",
		code,
		message,
		data: null,
	}).describe(message);

export const conflictError = (code: string, message: string) =>
	zodResponseSchema({
		status: 409,
		error: "Conflict",
		code,
		message,
		data: null,
	}).describe(message);
