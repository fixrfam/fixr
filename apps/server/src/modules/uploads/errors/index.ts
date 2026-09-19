import { defineErrors } from "../../../core/utils/errors";

export const uploadsErrors = defineErrors({
	UPLOAD_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	UPLOAD_SIZE_EXCEEDED: {
		code: "upload_size_exceeded",
		message: "Arquivo excede o limite de tamanho permitido.",
		status: 413,
	},
});
