let counter = 0;

/** Monotonic per-worker counter used to keep factory data unique and deterministic. */
export function nextSeq() {
	counter += 1;
	return counter;
}

/** Zero-padded numeric string with exactly `length` digits, unique per call. */
export function uniqueDigits(length: number) {
	return String(nextSeq()).padStart(length, "0").slice(-length);
}
