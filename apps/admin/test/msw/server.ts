import { setupServer } from "msw/node";

export const API_URL = "http://api.test";
export const apiUrl = (path: string) => `${API_URL}${path}`;

export function envelope<T>(data: T, { status = 200, code = "ok" } = {}) {
	return {
		status,
		error: status >= 400 ? "Error" : null,
		code,
		message: code,
		data,
	};
}

export const server = setupServer();
