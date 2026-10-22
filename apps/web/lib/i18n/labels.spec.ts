import { createTranslator, hasTranslation } from "@fixr/i18n";
import { employeeRoles } from "@fixr/schemas/roles";
import { describe, expect, it } from "vitest";
import { STATUS_STYLE_MAP } from "@/lib/utils/service-orders";
import { roleLabelKeys, serviceOrderStatusKeys } from "./labels";

describe("roleLabelKeys", () => {
	it("maps every employee role", () => {
		expect(Object.keys(roleLabelKeys).sort()).toEqual(
			[...employeeRoles.options].sort()
		);
	});

	it.each(Object.values(roleLabelKeys))("%s exists in the catalog", (key) => {
		expect(hasTranslation(key)).toBe(true);
	});

	it("renders a role in each locale", () => {
		expect(createTranslator("en").t(roleLabelKeys.technician)).toBe(
			"Technician"
		);
		expect(createTranslator("pt-BR").t(roleLabelKeys.technician)).toBe(
			"Técnico"
		);
	});
});

describe("serviceOrderStatusKeys", () => {
	it("maps every styled status", () => {
		expect(Object.keys(serviceOrderStatusKeys).sort()).toEqual(
			Object.keys(STATUS_STYLE_MAP).sort()
		);
	});

	it.each(
		Object.values(serviceOrderStatusKeys)
	)("%s exists in the catalog", (key) => {
		expect(hasTranslation(key)).toBe(true);
	});
});
