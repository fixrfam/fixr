import { describe, expect, it, vi } from "vitest";
import { numberInputProps } from "./number-input";

const field = (value: unknown) => ({
	name: "price",
	value,
	onChange: vi.fn(),
	onBlur: vi.fn(),
	ref: vi.fn(),
	disabled: false,
});

const changeEvent = (value: string, valueAsNumber: number) =>
	({ target: { value, valueAsNumber } }) as never;

describe("numberInputProps", () => {
	it("renders a decimal number input", () => {
		const props = numberInputProps(field(10) as never);

		expect(props).toMatchObject({ type: "number", inputMode: "decimal" });
		expect(props.value).toBe(10);
	});

	it("shows an empty input while the field is undefined", () => {
		expect(numberInputProps(field(undefined) as never).value).toBe("");
	});

	it("keeps zero instead of clearing it", () => {
		expect(numberInputProps(field(0) as never).value).toBe(0);
	});

	it("sends numbers, not strings, to the form", () => {
		const f = field(undefined);

		numberInputProps(f as never).onChange(changeEvent("12.5", 12.5));

		expect(f.onChange).toHaveBeenCalledWith(12.5);
	});

	it("clears the field with null, so react-hook-form does not restore the default", () => {
		const f = field(3);

		numberInputProps(f as never).onChange(changeEvent("", Number.NaN));

		expect(f.onChange).toHaveBeenCalledWith(null);
	});

	it("shows an empty input once the field was cleared", () => {
		expect(numberInputProps(field(null) as never).value).toBe("");
	});
});
