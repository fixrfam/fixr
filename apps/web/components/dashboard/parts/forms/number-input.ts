import type { ControllerRenderProps, FieldValues } from "react-hook-form";

/**
 * Bridges a react-hook-form field holding a number to an `<Input type="number">`,
 * keeping the field `undefined` while the input is empty.
 */
export function numberInputProps<T extends FieldValues>(
	field: ControllerRenderProps<T>
) {
	return {
		...field,
		type: "number",
		inputMode: "decimal",
		value: field.value ?? "",
		onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
			field.onChange(
				e.target.value === "" ? undefined : e.target.valueAsNumber
			),
	} as const;
}
