/** Short, readable reference of a service order: the end of its id. */
export function orderNumber(id: string) {
	return id.slice(-6).toUpperCase();
}
