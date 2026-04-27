export function delay(ms?: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms ?? 1000));
}

export function randomDelay(min = 150, max = 1500): Promise<void> {
	const delay = Math.random() * (max - min) + min;
	return new Promise((resolve) => setTimeout(resolve, delay));
}
