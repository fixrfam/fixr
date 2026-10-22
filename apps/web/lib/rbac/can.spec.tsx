/**
 * UI gating only hides what a role can't use. It does NOT replace server-side
 * RBAC: every API route is enforced by requirePermission(), locked by the
 * route sweep in apps/server/test/integration/rbac (see issue #114).
 */

import { type EmployeeRole, permissions } from "@fixr/permissions";
import { AbilityProvider, Can, useAbility } from "@fixr/permissions/react";
import { render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

/** AbilityProvider's `role` prop is an employee role, not an ARIA role (spread keeps a11y lint quiet). */
function WithRole({
	employeeRole,
	children,
}: {
	employeeRole: EmployeeRole;
	children: ReactNode;
}) {
	return (
		<AbilityProvider {...{ role: employeeRole }}>{children}</AbilityProvider>
	);
}

describe("<Can>", () => {
	it("renders children when the role has the permission", () => {
		render(
			<WithRole employeeRole="manager">
				<Can permission={permissions.employees.create}>
					<button type="button">Novo funcionário</button>
				</Can>
			</WithRole>
		);

		expect(
			screen.getByRole("button", { name: "Novo funcionário" })
		).toBeInTheDocument();
	});

	it("renders the fallback (or nothing) when it does not", () => {
		render(
			<WithRole employeeRole="technician">
				<Can
					fallback={<p>Sem acesso</p>}
					permission={permissions.employees.create}
				>
					<button type="button">Novo funcionário</button>
				</Can>
				<Can permission={permissions.employees.read}>
					<a href="/employees">Funcionários</a>
				</Can>
			</WithRole>
		);

		expect(
			screen.queryByRole("button", { name: "Novo funcionário" })
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "Funcionários" })
		).not.toBeInTheDocument();
		expect(screen.getByText("Sem acesso")).toBeInTheDocument();
	});

	it("denies everything outside a provider (loading state)", () => {
		const { result } = renderHook(() => useAbility());

		expect(result.current.isLoading).toBe(true);
		expect(result.current.can(permissions.account.read)).toBe(false);
	});

	it("exposes the role's ability once provided", () => {
		const { result } = renderHook(() => useAbility(), {
			wrapper: ({ children }) => (
				<WithRole employeeRole="warehouse">{children}</WithRole>
			),
		});

		expect(result.current.isLoading).toBe(false);
		expect(result.current.can(permissions.inventory.update)).toBe(true);
		expect(result.current.cannot(permissions.serviceOrders.read)).toBe(true);
	});
});
