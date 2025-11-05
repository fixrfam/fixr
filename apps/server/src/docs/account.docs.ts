import { accountSchema } from '@fixr/schemas/account'
import { FastifySchema } from 'fastify'
import { z } from 'zod'
import { zodResponseSchema } from './types'

const getAccountSchema: FastifySchema = {
  tags: ['Account'],
  description: `Retrieves user account data`,
  summary: 'Get account',
  response: {
    404: zodResponseSchema({
      status: 404,
      error: 'Not Found',
      code: 'user_not_found',
      message: 'User not found',
      data: null,
    }).describe("Couldn't find user."),
    200: zodResponseSchema({
      status: 200,
      error: null,
      code: 'get_account_success',
      message: 'Account retrieved successfully.',
      data: accountSchema,
    }).describe('Account retrieved successfully.'),
  },
  security: [{ JWT: [] }],
}

const requestDeletionSchema: FastifySchema = {
  tags: ['Account'],
  description: `**Request account deletion and sends a confirmation email.**
    
When requested, the account is **not** deleted instantly. 
For confirmation, we generate a \`oneTimeToken\` of type \`account_deletion\`, save it on the database, and send it to the user email as a confirmation link, that will further hit the \`/account/confirm-deletion\` endpoint.

- Requests are valid for 30 minutes.
- Only one request can be up at a time.`,
  summary: 'Request deletion',
  response: {
    409: zodResponseSchema({
      status: 409,
      error: 'Conflict',
      code: 'existing_deletion_request',
      message:
        'Deletion request already exists. Finish it or wait until expiration to request a new one.',
      data: null,
    }).describe(
      'Deletion request already exists. Only one can be up at a time.',
    ),
    404: zodResponseSchema({
      status: 404,
      error: 'Not Found',
      code: 'user_not_found',
      message: 'User not found',
      data: null,
    }).describe("Couldn't find user."),
    201: zodResponseSchema({
      status: 201,
      error: null,
      code: 'deletion_request_accepted',
      message: 'Deletion request accepted, confirm email.',
      data: null,
    }).describe('Request accepted, user needs to confirm the email.'),
  },
  security: [{ JWT: [] }],
}

const confirmDeletionSchema: FastifySchema = {
  tags: ['Account'],
  description: `**Confirm deletion of account corresponding to the token.**
        
When the confirmation email is sent, a link to this API route is sent together with the confirmation token.

Once clicked, the account is deleted along with the single use token, then the user is redirected to the \`redirectUrl\`.
        `,
  summary: 'Confirm deletion',
  querystring: z.object({
    token: z.string(),
    redirectUrl: z.string().optional(),
  }),
  response: {
    404: zodResponseSchema({
      status: 404,
      error: 'Not Found',
      code: 'token_not_found',
      message: 'Token not found',
      data: null,
    }).describe('Provided token was not found.'),
    410: zodResponseSchema({
      status: 410,
      error: 'Gone',
      code: 'token_expired',
      message: 'Token expired',
      data: null,
    }).describe('The token is expired.'),
    400: zodResponseSchema({
      status: 400,
      error: 'Bad Request',
      code: 'invalid_token',
      message: 'Invalid token',
      data: null,
    }).describe('The token is invalid (mismatching type, for example).'),
    200: zodResponseSchema({
      status: 200,
      error: null,
      code: 'account_deletion_success',
      message: 'Account deleted sucessfully',
      data: null,
    }).describe('The account was successfully deleted.'),
  },
}

export const accountDocs = {
  getAccountSchema,
  requestDeletionSchema,
  confirmDeletionSchema,
}
