import { defineErrors } from "../../../core/utils/errors";

/** @description Error definitions for the categories module */
export const categoriesErrors = defineErrors({
	CATEGORY_NOT_FOUND: {
		code: "category_not_found",
		message: "Category not found.",
		status: 404,
	},
});
