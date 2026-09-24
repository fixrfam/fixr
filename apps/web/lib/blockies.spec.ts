import { describe, expect, it } from "vitest";
import { createIconSVG } from "./blockies";

const decode = (dataUrl: string) =>
	atob(dataUrl.replace("data:image/svg+xml;base64,", ""));

describe("createIconSVG", () => {
	it("returns an SVG data URL", () => {
		const url = createIconSVG({ seed: "maria@fixr.test" });

		expect(url.startsWith("data:image/svg+xml;base64,")).toBe(true);
		expect(decode(url)).toMatch(/^<svg .*<\/svg>$/);
	});

	it("is deterministic for the same seed", () => {
		expect(createIconSVG({ seed: "a" })).toBe(createIconSVG({ seed: "a" }));
		expect(createIconSVG({ seed: "a" })).not.toBe(createIconSVG({ seed: "b" }));
	});

	it("uses size x scale for the dimensions and the given colors", () => {
		const svg = decode(
			createIconSVG({ seed: "a", size: 5, scale: 10, bgcolor: "#000000" })
		);

		expect(svg).toContain('width="50" height="50"');
		expect(svg).toContain('fill="#000000"');
	});
});
