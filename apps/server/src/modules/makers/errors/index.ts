import { defineErrors } from "../../../core/utils/errors";

/** @description Error definitions for the makers module */
export const makersErrors = defineErrors({
	MAKER_NOT_FOUND: {
		code: "maker_not_found",
		message: "Maker not found.",
		status: 404,
	},
	MAKER_PAGE_OUT_OF_BOUNDS: {
		code: "page_out_of_bounds",
		message: "The requested page exceeds the total number of pages.",
		status: 416,
	},
});
