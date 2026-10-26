import type { EmployeeRole } from "@fixr/permissions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { ReactElement } from "react";
import { SessionProvider } from "@/lib/hooks/use-session";
import { render } from "./render";
import { employeeSession } from "./session";

/**
 * `render` inside a fresh React Query client (no retries, so errors surface at
 * once) and an in-memory URL, signed in as an employee with `role`.
 */
export function renderWithQuery(
	ui: ReactElement,
	{
		role = "admin",
		searchParams,
	}: {
		role?: EmployeeRole;
		/** Initial URL query, for components that keep their state there. */
		searchParams?: string;
	} = {}
) {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return render(
		<QueryClientProvider client={client}>
			<NuqsTestingAdapter hasMemory searchParams={searchParams}>
				<SessionProvider session={employeeSession(role)}>{ui}</SessionProvider>
			</NuqsTestingAdapter>
		</QueryClientProvider>
	);
}
