import bcrypt from "bcrypt";

/** @description Hash a plaintext password using bcrypt with 10 rounds */
export async function hashPassword(password: string) {
	// Using rounds parameter directly is more efficient than generating salt separately
	return await bcrypt.hash(password, 10);
}
