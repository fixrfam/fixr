import type { ControllerRenderProps, FieldValues } from "react-hook-form";

/**
 * Bridges a react-hook-form field holding a number to an `<Input type="number">`.
 *
 * An emptied input sets the field to `null`, not `undefined`: react-hook-form
 * reads `undefined` as "use the default value", which brought back the old
 * number when editing (clearing "6" and typing "42" gave "642").
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
			field.onChange(e.target.value === "" ? null : e.target.valueAsNumber),
	} as const;
}
