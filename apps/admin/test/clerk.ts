import { vi } from "vitest";

/**
 * Clerk test double for apps/admin (Clerk-only; never reuse apps/web's JWT helpers here).
 * Call `signIn()` / `signOut()` to switch the state `useAuth()` reports.
 */
export const clerk = {
	isSignedIn: false,
	token: null as string | null,
	getToken: vi.fn(async () => clerk.token),
};

export function signIn(token = "clerk-session-token") {
	clerk.isSignedIn = true;
	clerk.token = token;
}

export function signOut() {
	clerk.isSignedIn = false;
	clerk.token = null;
}

vi.mock("@clerk/nextjs", () => ({
	useAuth: () => ({
		isLoaded: true,
		isSignedIn: clerk.isSignedIn,
		getToken: clerk.getToken,
	}),
	ClerkProvider: ({ children }: { children: unknown }) => children,
	SignedIn: ({ children }: { children: unknown }) =>
		clerk.isSignedIn ? children : null,
	SignedOut: ({ children }: { children: unknown }) =>
		clerk.isSignedIn ? null : children,
}));

export const toast = { success: vi.fn(), error: vi.fn() };
vi.mock("@pheralb/toast", () => ({ toast }));
