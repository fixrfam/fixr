import { nonSensitiveUser } from "@repo/schemas/auth";
import { FastifyReply } from "fastify";
import { z } from "zod";

import { editAccountSchema } from "@repo/schemas/account";
import { queryUserById, updateUserById } from "../../services/account.services";

import { userJWT } from "@repo/schemas/auth";
import { apiResponse } from "@/src/helpers/response";

export async function getAccountHandler({
    userId,
    response,
}: {
    userId: string;
    response: FastifyReply;
}) {
    const user = await queryUserById(userId);

    return response.status(200).send(
        apiResponse({
            status: 200,
            error: null,
            code: "get_account_success",
            message: "Account retrieved successfully.",
            data: nonSensitiveUser.parse(user),
        })
    );
}

export async function editAccountHandler({
    body,
    user,
    response,
}: {
    body: z.infer<typeof editAccountSchema>;
    user: z.infer<typeof userJWT>;
    response: FastifyReply;
}) {
    const updatedUser = await updateUserById(body, user.id);

    return response.status(200).send(
        apiResponse({
            status: 200,
            error: null,
            code: "update_account_success",
            message: "Account data updated successfully",
            data: nonSensitiveUser.parse(updatedUser),
        })
    );
}
