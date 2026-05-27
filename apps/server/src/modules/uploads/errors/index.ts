import { defineErrors } from "../../../core/utils/errors";

export const uploadsErrors = defineErrors({
	UPLOAD_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
});
