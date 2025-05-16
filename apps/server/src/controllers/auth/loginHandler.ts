import bcrypt from "bcrypt";
import { FastifyReply } from "fastify";
import { z } from "zod";

import { apiResponse } from "@/src/helpers/response";

import { signJWT } from "../../helpers/jwt";
import { generateRefreshToken } from "../../helpers/tokens";
import { jwtPayload, loginUserSchema } from "@fixr/schemas/auth";
import { queryJWTPayloadByUserId, queryUserByEmail } from "../../services/auth.services";
import { setJWTCookie, setRefreshToken } from "../../services/tokens.services";

export async function loginHandler({
    body,
    response,
}: {
    body: z.infer<typeof loginUserSchema>;
    response: FastifyReply;
}) {
    const email = body.email.toLowerCase();
    //First check if the user exists

    const user = await queryUserByEmail(email);

    if (!user) {
        return response.status(404).send(
            apiResponse({
                status: 404,
                error: "Not Found",
                code: "user_not_found",
                message: "User not found",
                data: null,
            })
        );
    }

    if (!user.verified) {
        return response.status(403).send(
            apiResponse({
                status: 403,
                error: "Forbidden",
                code: "email_not_verified",
                message: "Email not verified",
                data: null,
            })
        );
    }

    //Then compares the sent password with the hashed password on the database
    const validPassword = await bcrypt.compare(body.password, user.passwordHash);

    if (!validPassword) {
        return response.status(401).send(
            apiResponse({
                status: 401,
                error: "Unauthorized",
                code: "invalid_password",
                message: "Invalid password",
                data: null,
            })
        );
    }

    const payload = await queryJWTPayloadByUserId(user.id);

    //If the password is valid, sign the JWT and set the new refresh token
    const token = signJWT({
        payload: jwtPayload.parse(payload),
    });

    const refreshToken = generateRefreshToken();
    await setRefreshToken(response, refreshToken, user.id);
    setJWTCookie(response, token);

    return response.status(200).send(
        apiResponse({
            status: 200,
            error: null,
            code: "login_success",
            message: "Logged in successfully",
            data: {
                token,
            },
        })
    );
}
