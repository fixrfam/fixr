import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
	it.each([
		["Galaxy S24 Ultra", "galaxy-s24-ultra"],
		["  iPhone   15  ", "iphone-15"],
		["Moto G (5ª geração)", "moto-g-5-gerao"],
		["a--b", "a-b"],
		["-edge-", "edge"],
		["", ""],
	])("slugify(%j) = %j", (input, expected) => {
		expect(slugify(input)).toBe(expected);
	});

	it("drops accented characters instead of transliterating them", () => {
		// Locks current behavior: "Câmera" becomes "cmera", not "camera".
		expect(slugify("Câmera")).toBe("cmera");
	});
});
