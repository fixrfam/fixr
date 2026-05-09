import type { FastifyReply, FastifyRequest } from "fastify";
import { AccountService } from "../services";

/** @description Account request handlers */
export class AccountController {
	/**
	 * @description Get the authenticated user's account
	 */
	static async getAccount({
		userId,
		response,
	}: {
		userId: string;
		response: FastifyReply;
	}) {
		return AccountService.getAccount({ userId, response });
	}

	/**
	 * @description Request account deletion
	 */
	static async requestAccountDeletion({
		userId,
		request,
		response,
	}: {
		userId: string;
		request: FastifyRequest;
		response: FastifyReply;
	}) {
		return AccountService.requestAccountDeletion({
			userId,
			request,
			response,
		});
	}

	/**
	 * @description Confirm account deletion with token
	 */
	static async confirmAccountDeletion({
		token,
		redirectUrl,
		response,
	}: {
		token: string;
		redirectUrl?: string;
		response: FastifyReply;
	}) {
		return AccountService.confirmAccountDeletion({
			token,
			redirectUrl,
			response,
		});
	}
}
