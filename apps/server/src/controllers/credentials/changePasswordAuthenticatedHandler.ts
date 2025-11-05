import { userJWT } from "@fixr/schemas/auth"
import { changePasswordAuthenticatedSchema } from "@fixr/schemas/credentials"
import bcrypt from "bcrypt"
import { FastifyReply } from "fastify"
import { z } from "zod"
import { apiResponse } from "@/src/helpers/response"
import { hashPassword } from "../../helpers/hash-password"
import { queryUserById } from "../../services/auth.services"
import { updateUserPassword } from "../../services/credentials.services"

export async function changePasswordAuthenticatedHandler({
  user,
  body,
  response,
}: {
  user: z.infer<typeof userJWT>
  body: z.infer<typeof changePasswordAuthenticatedSchema>
  response: FastifyReply
}) {
  const userData = await queryUserById(user.id)

  const validPassword = await bcrypt.compare(body.old, userData.passwordHash)

  if (!validPassword) {
    return response.status(401).send(
      apiResponse({
        status: 401,
        error: "Unauthorized",
        code: "invalid_password",
        message: "Invalid password",
        data: null,
      }),
    )
  }

  if (body.old === body.new) {
    return response.status(400).send(
      apiResponse({
        status: 400,
        error: "Bad Request",
        code: "equal_passwords",
        message: "Old password and new password are the same",
        data: null,
      }),
    )
  }

  const hashedPassword = await hashPassword(body.new)

  await updateUserPassword(user.id, hashedPassword)

  return response.status(200).send(
    apiResponse({
      status: 200,
      error: null,
      code: "password_update_success",
      message: "Password updated successfully!",
      data: null,
    }),
  )
}
