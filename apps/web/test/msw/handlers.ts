import { HttpResponse, http } from "msw";

export const API_URL = "http://api.test";

/** Build a URL on the mocked apps/server API. */
export const apiUrl = (path: string) => `${API_URL}${path}`;

/** The standard apps/server response envelope. */
export function envelope<T>(
	data: T,
	{ status = 200, code = "ok", message = "ok" } = {}
) {
	return {
		status,
		error: status >= 400 ? "Error" : null,
		code,
		message,
		data,
	};
}

/** Default handlers: the API is up and the refresh endpoint succeeds. */
export const handlers = [
	http.get(apiUrl("/"), () =>
		HttpResponse.text("Hello from Fixr API! Reach the documentation at /docs")
	),
	http.post(apiUrl("/auth/token"), () =>
		HttpResponse.json(
			envelope({ token: "refreshed" }, { code: "revalidate_success" })
		)
	),
];
