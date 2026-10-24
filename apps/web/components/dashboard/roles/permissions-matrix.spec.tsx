import { createTranslator } from "@fixr/i18n";
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { permissionCount } from "@/components/dashboard/roles/matrix";
import { render } from "@/test/render";
import { PermissionsMatrix } from "./permissions-matrix";

const { t } = createTranslator("pt-BR");

/** The table row of an action inside a resource group. */
function rowOf(resource: string, action: string) {
	const rows = screen.getAllByRole("row");
	const start = rows.findIndex((row) => row.textContent === resource);
	return rows
		.slice(start + 1)
		.find((row) => within(row).queryByText(action, { exact: true }))!;
}

describe("PermissionsMatrix", () => {
	it("describes every role with its permission count", () => {
		render(<PermissionsMatrix />);

		expect(
			screen.getByText(t("permissions.roleDescriptions.guest"))
		).toBeInTheDocument();
		expect(
			screen.getByText(
				t("permissions.matrix.count", { count: permissionCount("warehouse") })
			)
		).toBeInTheDocument();
	});

	it("marks who can delete parts", () => {
		render(<PermissionsMatrix />);

		const row = rowOf(
			t("permissions.resources.parts"),
			t("permissions.actions.delete")
		);
		const cells = within(row).getAllByRole("img");

		// technician, warehouse, financial, manager, admin
		expect(cells.map((cell) => cell.getAttribute("aria-label"))).toEqual([
			t("permissions.matrix.notAllowed"),
			t("permissions.matrix.notAllowed"),
			t("permissions.matrix.notAllowed"),
			t("permissions.matrix.notAllowed"),
			t("permissions.matrix.allowed"),
		]);
	});

	it("highlights the viewer's role", () => {
		render(<PermissionsMatrix currentRole="technician" />);

		expect(
			screen.getByText(t("permissions.matrix.yourRole"))
		).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: t("roles.technician") })
		).toHaveClass("text-primary");
	});
});
