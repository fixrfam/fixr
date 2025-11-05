import { cookieKey } from '@fixr/constants/cookies'
import { FastifyReply } from 'fastify'
import { env } from '@/src/env'
import { apiResponse } from '@/src/helpers/response'
import { setUserVerified } from '../../services/auth.services'
import {
  deleteOneTimeToken,
  queryOneTimeToken,
} from '../../services/tokens.services'

export async function verifyHandler({
  token,
  redirectUrl,
  response,
}: {
  token: string
  redirectUrl?: string
  response: FastifyReply
}) {
  const oneTimeToken = await queryOneTimeToken(token)

  //Checks if the token exists, if it's not expired and if it's a confirmation token
  if (!oneTimeToken) {
    return response.status(404).send(
      apiResponse({
        status: 404,
        error: 'Not Found',
        code: 'token_not_found',
        message: 'Token not found',
        data: null,
      }),
    )
  }
  if (oneTimeToken.expiresAt < new Date()) {
    return response.status(410).send(
      apiResponse({
        status: 410,
        error: 'Gone',
        code: 'token_expired',
        message: 'Token expired',
        data: null,
      }),
    )
  }
  if (oneTimeToken.tokenType !== 'confirmation') {
    return response.status(400).send(
      apiResponse({
        status: 400,
        error: 'Bad Request',
        code: 'invalid_token',
        message: 'Invalid token',
        data: null,
      }),
    )
  }

  //If all checks succeed, update the user to be verified and delete the token
  const verifyUser = setUserVerified(oneTimeToken.user.id)
  const deleteToken = deleteOneTimeToken(oneTimeToken.token)
  await Promise.all([verifyUser, deleteToken])

  if (redirectUrl) {
    return response
      .setCookie(cookieKey('showVerifiedDialog'), 'true', {
        path: '/',
        httpOnly: false,
        sameSite: 'none',
        secure: true,
      })
      .status(302)
      .redirect(decodeURIComponent(redirectUrl))
  }

  return response.status(200).send(
    apiResponse({
      status: 200,
      error: null,
      code: 'email_verify_success',
      message: 'Email verified successfully',
      data: null,
    }),
  )
}
