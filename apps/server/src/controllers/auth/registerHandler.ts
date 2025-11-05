import { APP_NAME } from '@fixr/constants/app'
import {
  emailDisplayName,
  sendAccountVerificationEmail,
} from '@fixr/mail/services'
import { createUserSchema } from '@fixr/schemas/auth'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { env } from '@/src/env'
import { apiResponse } from '@/src/helpers/response'
import { hashPassword } from '../../helpers/hash-password'
import {
  createUser,
  deleteUser,
  queryUserByEmail,
} from '../../services/auth.services'
import { createOneTimeToken } from '../../services/tokens.services'

export async function registerHandler({
  body,
  request,
  response,
}: {
  body: z.infer<typeof createUserSchema>
  request: FastifyRequest
  response: FastifyReply
}) {
  const email = body.email.toLowerCase()
  const existingEmail = await queryUserByEmail(email)

  //First, check if the email is already taken
  if (existingEmail) {
    return response.status(409).send(
      apiResponse({
        status: 409,
        error: 'Conflict',
        code: 'email_already_used',
        message: 'Email is already registered.',
        data: null,
      }),
    )
  }

  //Then hash the password and insert the user on the database
  const hashedPassword = await hashPassword(body.password)

  const newUser = await createUser({
    displayName: body.displayName,
    email: email,
    passwordHash: hashedPassword,
  })

  const oneTimeToken = await createOneTimeToken({
    email: newUser.email,
    userId: newUser.id,
    tokenType: 'confirmation',
  })

  const redirectUrl = `${env.FRONTEND_URL}/auth/login`

  const verificationUrl = `${request.protocol}://${request.host}/auth/verify?token=${encodeURIComponent(oneTimeToken.token)}&redirectUrl=${encodeURIComponent(redirectUrl)}`

  await sendAccountVerificationEmail({
    to: newUser.email,
    appName: APP_NAME,
    verificationUrl: verificationUrl,
    displayName: newUser.displayName ?? emailDisplayName(newUser.email),
  }).catch(async () => {
    await deleteUser(newUser.id)

    return response.status(500).send(
      apiResponse({
        status: 500,
        error: 'Internal Server Error',
        code: 'verification_email_failed',
        message: 'Failed to send verification email',
        data: null,
      }),
    )
  })

  return response.status(201).send(
    apiResponse({
      status: 201,
      error: null,
      code: 'user_registered_success',
      message: 'User registered successfully',
      data: null,
    }),
  )
}
