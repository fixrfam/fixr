export function formatDate(
	date: Date | string | number | undefined,
	opts: Intl.DateTimeFormatOptions = {}
) {
	if (!date) {
		return "";
	}

	try {
		return new Intl.DateTimeFormat("en-US", {
			month: opts.month ?? "long",
			day: opts.day ?? "numeric",
			year: opts.year ?? "numeric",
			...opts,
		}).format(new Date(date));
	} catch (_err) {
		return "";
	}
}

const NON_DIGITS = /\D/g;

/** Format stored phone digits as `(11) 98765-4321` / `(11) 3456-7890`. Other values pass through. */
export function formatPhone(value: string | null | undefined) {
	const digits = (value ?? "").replace(NON_DIGITS, "");
	if (digits.length === 11) {
		return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
	}
	if (digits.length === 10) {
		return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
	}
	return value ?? "";
}

/** Format stored CNPJ digits as `12.345.678/0001-90`. Other values pass through. */
export function formatCnpj(value: string | null | undefined) {
	const digits = (value ?? "").replace(NON_DIGITS, "");
	if (digits.length !== 14) {
		return value ?? "";
	}
	return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}
