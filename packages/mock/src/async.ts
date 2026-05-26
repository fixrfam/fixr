import { mockServiceOrders } from "./options/table-order";

export function delay(ms?: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms ?? 1000));
}

export function randomDelay(min = 150, max = 1500): Promise<void> {
	const delay = Math.random() * (max - min) + min;
	return new Promise((resolve) => setTimeout(resolve, delay));
}

export async function getServiceOrderById(id: string) {
	await randomDelay();
	return mockServiceOrders.find((item) => item.id === id) ?? null;
}
