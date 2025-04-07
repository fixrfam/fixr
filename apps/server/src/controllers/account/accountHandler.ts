import { FastifyReply } from "fastify";

import { queryAccountById } from "../../services/account.services";

import { apiResponse } from "@/src/helpers/response";
import { accountSchema } from "@repo/schemas/account";

export async function getAccountHandler({
    userId,
    response,
}: {
    userId: string;
    response: FastifyReply;
}) {
    const account = await queryAccountById(userId);

    return response.status(200).send(
        apiResponse({
            status: 200,
            error: null,
            code: "get_account_success",
            message: "Account retrieved successfully.",
            data: accountSchema.parse(account),
        })
    );
}
