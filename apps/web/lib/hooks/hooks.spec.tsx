import {
	act,
	render,
	renderHook,
	screen,
	waitFor,
} from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { toast } from "@/test/mocks";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { useSidebarStore } from "./stores/use-sidebar-store";
import { useAvatar } from "./use-avatar";
import { useMediaQuery } from "./use-media-query";
import { useScrollPosition } from "./use-scroll-position";
import { SessionProvider, useSession } from "./use-session";

const sessionPayload = {
	id: "ckx1y2z3a4b5c6d7e8f9g0h1",
	email: "maria@fixr.test",
	displayName: "Maria",
	avatarUrl: null,
	profileType: "employee",
	company: {
		id: "ckx1y2z3a4b5c6d7e8f9g0h2",
		name: "Fixr",
		subdomain: "fixr",
		role: "manager",
	},
	createdAt: "2024-01-01T00:00:00.000Z",
	iat: 1,
	exp: 9_999_999_999,
};

function SessionView() {
	const { session } = useSession();
	return <p>{session ? session.email : "anonymous"}</p>;
}

describe("useSession / SessionProvider", () => {
	it("throws outside the provider", () => {
		vi.spyOn(console, "error").mockImplementation(() => undefined);

		expect(() => renderHook(() => useSession())).toThrow(
			"useSession must be used within SessionProvider"
		);
	});

	it("uses the initial session without fetching", async () => {
		let fetched = 0;
		server.use(
			http.get("*/api/auth/session", () => {
				fetched += 1;
				return HttpResponse.json(sessionPayload);
			})
		);

		render(
			<SessionProvider session={sessionPayload as never}>
				<SessionView />
			</SessionProvider>
		);

		expect(screen.getByText("maria@fixr.test")).toBeInTheDocument();
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(fetched).toBe(0);
	});

	it("loads the session once when none is given (no refetch loop)", async () => {
		let fetched = 0;
		server.use(
			http.get("*/api/auth/session", () => {
				fetched += 1;
				return HttpResponse.json(sessionPayload);
			})
		);

		render(
			<SessionProvider>
				<SessionView />
			</SessionProvider>
		);

		expect(await screen.findByText("maria@fixr.test")).toBeInTheDocument();
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(fetched).toBe(1);
	});

	it("stays anonymous when the session endpoint returns null or fails", async () => {
		server.use(http.get("*/api/auth/session", () => HttpResponse.json(null)));

		render(
			<SessionProvider>
				<SessionView />
			</SessionProvider>
		);

		await waitFor(() =>
			expect(screen.getByText("anonymous")).toBeInTheDocument()
		);
	});

	it("drops an expired/invalid session instead of crashing", async () => {
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		server.use(
			http.get("*/api/auth/session", () =>
				HttpResponse.json({ email: "broken" })
			)
		);

		render(
			<SessionProvider>
				<SessionView />
			</SessionProvider>
		);

		await waitFor(() => expect(console.error).toHaveBeenCalled());
		expect(screen.getByText("anonymous")).toBeInTheDocument();
	});
});

describe("useAvatar", () => {
	const wrapper = ({ children }: { children: ReactNode }) => (
		<SessionProvider session={sessionPayload as never}>
			{children}
		</SessionProvider>
	);

	beforeEach(() => {
		setSessionCookie(fakeJwt());
		server.use(
			http.get("*/api/auth/session", () => HttpResponse.json(sessionPayload))
		);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("removes the avatar through the API and clears it locally", async () => {
		server.use(
			http.delete(apiUrl("/account/avatar"), () =>
				HttpResponse.json(envelope(null, { code: "remove_avatar_success" }))
			)
		);
		const { result } = renderHook(() => useAvatar("https://cdn/a.png"), {
			wrapper,
		});

		await act(async () => {
			await result.current.handleRemove();
		});

		expect(result.current.avatarUrl).toBeNull();
		expect(result.current.isRemoving).toBe(false);
		expect(toast.success).toHaveBeenCalled();
	});

	it("keeps the avatar and shows an error when the API fails", async () => {
		server.use(
			http.delete(apiUrl("/account/avatar"), () =>
				HttpResponse.json(envelope(null, { status: 500 }), { status: 500 })
			)
		);
		const { result } = renderHook(() => useAvatar("https://cdn/a.png"), {
			wrapper,
		});

		await act(async () => {
			await result.current.handleRemove();
		});

		expect(result.current.avatarUrl).toBe("https://cdn/a.png");
		expect(toast.error).toHaveBeenCalled();
	});
});

describe("useMediaQuery", () => {
	it("follows matchMedia changes", () => {
		const listeners = new Set<(event: { matches: boolean }) => void>();
		const mql = {
			matches: false,
			addEventListener: (
				_: string,
				fn: (event: { matches: boolean }) => void
			) => listeners.add(fn),
			removeEventListener: (
				_: string,
				fn: (event: { matches: boolean }) => void
			) => listeners.delete(fn),
		};
		vi.stubGlobal(
			"matchMedia",
			vi.fn(() => mql)
		);

		const { result, unmount } = renderHook(() =>
			useMediaQuery("(min-width: 768px)")
		);
		expect(result.current).toBe(false);

		act(() => {
			for (const fn of listeners) fn({ matches: true });
		});
		expect(result.current).toBe(true);

		unmount();
		expect(listeners.size).toBe(0);
		vi.unstubAllGlobals();
	});
});

describe("useScrollPosition", () => {
	it("tracks window.scrollY", () => {
		const { result } = renderHook(() => useScrollPosition());
		expect(result.current).toEqual({ scrollY: 0, hasScrolled: false });

		act(() => {
			Object.defineProperty(window, "scrollY", {
				value: 120,
				configurable: true,
			});
			window.dispatchEvent(new Event("scroll"));
		});

		expect(result.current).toEqual({ scrollY: 120, hasScrolled: true });
		Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
	});
});

describe("useSidebarStore", () => {
	afterEach(() => {
		// The store is global: reset it so state does not leak between specs.
		useSidebarStore.setState({ isOpen: false });
	});

	it("opens, closes and toggles", () => {
		const { open, close, toggle } = useSidebarStore.getState();

		open();
		expect(useSidebarStore.getState().isOpen).toBe(true);
		close();
		expect(useSidebarStore.getState().isOpen).toBe(false);
		toggle();
		expect(useSidebarStore.getState().isOpen).toBe(true);
		toggle();
		expect(useSidebarStore.getState().isOpen).toBe(false);
	});
});
