import { describe, expect, it } from "vitest";
import { createFormatter } from "./format";

const en = createFormatter("en");
const ptBR = createFormatter("pt-BR");

const NOW = new Date("2026-03-14T12:00:00Z");
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const ago = (ms: number) => new Date(NOW.getTime() - ms);
const ahead = (ms: number) => new Date(NOW.getTime() + ms);

describe("createFormatter", () => {
	it("accepts a Date, an ISO string or a timestamp", () => {
		const iso = "2026-03-14T12:00:00Z";
		const options = { timeZone: "UTC" } as const;

		expect(en.date(iso, options)).toBe(en.date(new Date(iso), options));
		expect(en.date(NOW.getTime(), options)).toBe(en.date(NOW, options));
	});

	it("writes dates in the locale's order", () => {
		expect(ptBR.date(NOW, { timeZone: "UTC", dateStyle: "short" })).toBe(
			"14/03/2026"
		);
		expect(en.date(NOW, { timeZone: "UTC", dateStyle: "short" })).toBe(
			"3/14/26"
		);
	});

	it("includes the time in dateTime", () => {
		expect(ptBR.dateTime(NOW, { timeZone: "UTC" })).toContain("12:00");
	});

	it("charges in BRL by default and only changes how it is written", () => {
		expect(en.currency(1234.5)).toContain("R$");
		expect(en.currency(1234.5)).toContain("1,234.50");
		expect(ptBR.currency(1234.5)).toContain("1.234,50");
	});

	it("accepts another currency when asked", () => {
		expect(en.currency(10, "USD")).toBe("$10.00");
	});

	it("passes number options through", () => {
		expect(en.number(0.25, { style: "percent" })).toBe("25%");
	});
});

describe("relativeTime", () => {
	it.each([
		[ago(10 * SECOND), "10 seconds ago"],
		[ago(5 * MINUTE), "5 minutes ago"],
		[ago(3 * HOUR), "3 hours ago"],
		[ago(DAY), "yesterday"],
		[ago(3 * DAY), "3 days ago"],
		[ago(14 * DAY), "2 weeks ago"],
		[ago(90 * DAY), "3 months ago"],
		[ago(800 * DAY), "2 years ago"],
		[ahead(2 * DAY), "in 2 days"],
	])("formats %s as %j", (value, expected) => {
		expect(en.relativeTime(value, NOW)).toBe(expected);
	});

	it("writes the distance in the active locale", () => {
		expect(ptBR.relativeTime(ago(3 * DAY), NOW)).toBe("há 3 dias");
	});

	it("measures against the current time by default", () => {
		expect(en.relativeTime(new Date())).toBe("now");
	});
});
