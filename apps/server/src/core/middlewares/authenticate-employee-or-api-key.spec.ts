import { afterEach, describe, expect, it, vi } from "vitest";
import { generateApiKey } from "../lib/api-key";
import { authenticateEmployeeOrApiKey } from "./authenticate-employee-or-api-key";

const mocks = vi.hoisted(() => ({
	authenticateApiKey: vi.fn(),
	authenticateEmployee: vi.fn(),
}));

vi.mock("./authenticate-api-key", () => ({
	authenticateApiKey: mocks.authenticateApiKey,
}));
vi.mock("./authenticate-employee", () => ({
	authenticateEmployee: mocks.authenticateEmployee,
}));

const request = (headers: Record<string, string>) => ({ headers }) as never;

afterEach(() => {
	vi.clearAllMocks();
});

describe("authenticateEmployeeOrApiKey", () => {
	it("uses the API key flow for a well-formed key", async () => {
		await authenticateEmployeeOrApiKey(
			request({ "x-api-key": generateApiKey().token }),
			{} as never
		);

		expect(mocks.authenticateApiKey).toHaveBeenCalled();
		expect(mocks.authenticateEmployee).not.toHaveBeenCalled();
	});

	it("uses the session flow otherwise (no key, or a bearer JWT)", async () => {
		await authenticateEmployeeOrApiKey(request({}), {} as never);
		await authenticateEmployeeOrApiKey(
			request({ authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.e30.x" }),
			{} as never
		);

		expect(mocks.authenticateEmployee).toHaveBeenCalledTimes(2);
		expect(mocks.authenticateApiKey).not.toHaveBeenCalled();
	});

	it("propagates the API key failure instead of falling back to the session", async () => {
		mocks.authenticateApiKey.mockRejectedValue(new Error("revoked"));

		await expect(
			authenticateEmployeeOrApiKey(
				request({ "x-api-key": generateApiKey().token }),
				{} as never
			)
		).rejects.toThrow("revoked");
		expect(mocks.authenticateEmployee).not.toHaveBeenCalled();
	});
});
