import { db } from "@fixr/db/connection";
import { users } from "@fixr/db/schema";
import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcryptjs";
import { nextSeq } from "./sequence";

/** Satisfies `passwordSchema` (upper, lower, digit, special, >= 8 chars). */
export const DEFAULT_PASSWORD = "Str0ng!Pass";

// Hashing is slow on purpose; do it once and reuse the hash for the default password.
const defaultPasswordHash = bcrypt.hashSync(DEFAULT_PASSWORD, 4);

export interface MakeUserInput {
	email?: string;
	password?: string;
	verified?: boolean;
	avatarUrl?: string | null;
}

export async function makeUser(input: MakeUserInput = {}) {
	const id = createId();
	const user = {
		id,
		email: input.email ?? `user${nextSeq()}@fixr.test`,
		passwordHash:
			input.password === undefined
				? defaultPasswordHash
				: bcrypt.hashSync(input.password, 4),
		verified: input.verified ?? true,
		avatarUrl: input.avatarUrl ?? null,
	};

	await db.insert(users).values(user);

	return { ...user, password: input.password ?? DEFAULT_PASSWORD };
}
