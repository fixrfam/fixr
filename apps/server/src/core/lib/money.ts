/**
 * Money helpers. Amounts are BRL numbers with two decimals (the `money` DB
 * column); sums go through cents so floating point never leaks into totals.
 */

const toCents = (value: number) => Math.round(value * 100);
const fromCents = (cents: number) => cents / 100;

/** `unitPrice * quantity`, rounded to cents. */
export function lineTotal({
	unitPrice,
	quantity,
}: {
	unitPrice: number;
	quantity: number;
}) {
	return fromCents(toCents(unitPrice) * quantity);
}

/** Subtotals per item type and the overall total of a list of priced items. */
export function itemTotals(
	items: { type: "part" | "service"; unitPrice: number; quantity: number }[]
) {
	let parts = 0;
	let services = 0;

	for (const item of items) {
		const cents = toCents(item.unitPrice) * item.quantity;
		if (item.type === "part") {
			parts += cents;
		} else {
			services += cents;
		}
	}

	return {
		parts: fromCents(parts),
		services: fromCents(services),
		total: fromCents(parts + services),
	};
}
