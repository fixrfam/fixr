import { db, eq } from "@fixr/db/connection";
import { users } from "@fixr/db/schema";
import { InvalidateCache } from "../../../shared/infra/cache";

/** @description Credentials data access layer */
export class CredentialsRepository {
	/**
	 * Update a user's password hash
	 *
	 * @param userId - The user ID
	 * @param passwordHash - The new bcrypt hash
	 */
	@InvalidateCache({ patterns: ["user:*", "jwt:*", "account:*"] })
	static async updateUserPassword(userId: string, passwordHash: string) {
		const updatePass = db
			.update(users)
			.set({ passwordHash })
			.where(eq(users.id, userId));

		return await updatePass;
	}
}
