import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function tryCatch<T>(
	promise: Promise<T>
): Promise<{ data: T; error: null } | { data: null; error: unknown }> {
	try {
		const data = await promise;
		return { data, error: null };
	} catch (error) {
		return { data: null, error };
	}
}

export function apiResponse<T>({
	status,
	error,
	code,
	message,
	data,
}: {
	status: number;
	error: string | null;
	code: string;
	message: string;
	data: T;
}) {
	return {
		status,
		error,
		code,
		message,
		data,
	};
}

export function generateRandomPassword(length = 16): string {
	const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	const lowercase = "abcdefghijklmnopqrstuvwxyz";
	const numbers = "0123456789";
	const special = "#?!@$%^&*-";
	const allChars = uppercase + lowercase + numbers + special;

	let password = "";

	// Ensure at least one character from each required category
	password += uppercase[Math.floor(Math.random() * uppercase.length)];
	password += lowercase[Math.floor(Math.random() * lowercase.length)];
	password += numbers[Math.floor(Math.random() * numbers.length)];
	password += special[Math.floor(Math.random() * special.length)];

	// Fill the rest with random characters
	for (let i = password.length; i < length; i++) {
		password += allChars[Math.floor(Math.random() * allChars.length)];
	}

	// Shuffle the password to avoid predictable patterns
	return password
		.split("")
		.sort(() => Math.random() - 0.5)
		.join("");
}
