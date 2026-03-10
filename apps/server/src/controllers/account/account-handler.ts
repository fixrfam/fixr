import { accountSchema } from "@fixr/schemas/account";
import { apiResponse } from "@/src/helpers/response";
import { queryAccountById } from "../../services/account.services";

export async function getAccountHandler({ userId }: { userId: string }) {
	const account = await queryAccountById(userId);

	return apiResponse({
		status: 200,
		error: null,
		code: "get_account_success",
		message: "Account retrieved successfully.",
		data: accountSchema.parse(account),
	});
}
