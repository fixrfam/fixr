import type { FastifyReply, FastifyRequest } from "fastify";
import { extractApiKeyToken, parseApiKey } from "../lib/api-key";
import { authenticateApiKey } from "./authenticate-api-key";
import { authenticateEmployee } from "./authenticate-employee";

/**
 * Accepts either a session JWT or an integration key on the same route.
 *
 * The credential is chosen by the shape of the token rather than by trying one
 * and falling back to the other, so a bad integration key reports why it failed
 * instead of being reported as an invalid JWT.
 *
 * Both paths populate `request.user` and `request.ability` the same way, so
 * everything downstream, including `requirePermission`, is unaware of which one
 * was used.
 *
 * Routes tied to a human session (`/auth`, `/credentials`, `/account`) and the
 * API key routes themselves keep using `authenticateEmployee` alone: a leaked
 * key must not be able to mint more keys or change the account it belongs to.
 */
export const authenticateEmployeeOrApiKey = async (
	request: FastifyRequest,
	response: FastifyReply
): Promise<void> => {
	const token = extractApiKeyToken(request.headers);

	if (token && parseApiKey(token)) {
		await authenticateApiKey(request, response);
		return;
	}

	await authenticateEmployee(request, response);
};
