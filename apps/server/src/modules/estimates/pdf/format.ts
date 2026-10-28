const NON_DIGITS = /\D/g;

/** `12.345.678/0001-90` from stored digits; other values pass through. */
export function formatCnpj(value: string) {
	const d = value.replace(NON_DIGITS, "");
	if (d.length !== 14) {
		return value;
	}
	return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** `123.456.789-09` from stored digits; other values pass through. */
export function formatCpf(value: string) {
	const d = value.replace(NON_DIGITS, "");
	if (d.length !== 11) {
		return value;
	}
	return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** `(11) 98765-4321` / `(11) 3456-7890` from stored digits; other values pass through. */
export function formatPhone(value: string) {
	const d = value.replace(NON_DIGITS, "");
	if (d.length === 11) {
		return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
	}
	if (d.length === 10) {
		return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
	}
	return value;
}
