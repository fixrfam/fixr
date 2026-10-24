import type { EmployeeRole } from "@fixr/permissions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { SessionProvider } from "@/lib/hooks/use-session";
import { render } from "./render";
import { employeeSession } from "./session";

/**
 * `render` inside a fresh React Query client (no retries, so errors surface at
 * once), signed in as an employee with `role`.
 */
export function renderWithQuery(
	ui: ReactElement,
	{ role = "admin" }: { role?: EmployeeRole } = {}
) {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return render(
		<QueryClientProvider client={client}>
			<SessionProvider session={employeeSession(role)}>{ui}</SessionProvider>
		</QueryClientProvider>
	);
}
