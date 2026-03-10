const encoder = new TextEncoder();
const _secretKey = encoder.encode(
	process.env.PASSWORD_SECRET || "default-secret-change-me"
);

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		{ name: "PBKDF2" },
		false,
		["deriveBits"]
	);
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt,
			iterations: 100_000,
			hash: "SHA-256",
		},
		key,
		256
	);
	const hashBuffer = new Uint8Array(derivedBits);
	const combined = new Uint8Array(salt.length + hashBuffer.length);
	combined.set(salt);
	combined.set(hashBuffer, salt.length);
	return btoa(String.fromCharCode(...combined));
}

export async function verifyPassword(
	password: string,
	hash: string
): Promise<boolean> {
	const combined = Uint8Array.from(atob(hash), (c) => c.charCodeAt(0));
	const salt = combined.slice(0, 16);
	const storedHash = combined.slice(16);
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		{ name: "PBKDF2" },
		false,
		["deriveBits"]
	);
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt,
			iterations: 100_000,
			hash: "SHA-256",
		},
		key,
		256
	);
	const computedHash = new Uint8Array(derivedBits);
	return (
		storedHash.length === computedHash.length &&
		storedHash.every((v, i) => v === computedHash[i])
	);
}
