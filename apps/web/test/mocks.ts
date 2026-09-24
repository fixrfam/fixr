import { vi } from "vitest";

/**
 * Shared mocks for Next.js navigation, toasts and the Turnstile widget.
 * Import this module from a spec *before* the component under test.
 */
export const router = {
	push: vi.fn(),
	replace: vi.fn(),
	refresh: vi.fn(),
	back: vi.fn(),
	prefetch: vi.fn(),
};

export const navigation = {
	params: { subdomain: "fixr" } as Record<string, string>,
	pathname: "/dashboard/fixr/home",
};

vi.mock("next/navigation", () => ({
	useRouter: () => router,
	useParams: () => navigation.params,
	usePathname: () => navigation.pathname,
	useSearchParams: () => new URLSearchParams(),
	redirect: vi.fn(),
}));

export const toast = {
	success: vi.fn(),
	error: vi.fn(),
	warning: vi.fn(),
	info: vi.fn(),
};

vi.mock("@pheralb/toast", () => ({ toast }));

/** Turnstile resolves a token right away, like Cloudflare's always-pass test key. */
vi.mock("@/components/auth/turnstile", async () => {
	const { useEffect, useRef } = await import("react");
	return {
		Turnstile: ({
			onToken,
			onLoad,
		}: {
			onToken: (token: string | null) => void;
			onLoad?: () => void;
		}) => {
			// Callers pass inline callbacks, so fire once on mount (like the real widget).
			const callbacks = useRef({ onToken, onLoad });
			useEffect(() => {
				callbacks.current.onLoad?.();
				callbacks.current.onToken("turnstile-test-token");
			}, []);
			return null;
		},
	};
});
