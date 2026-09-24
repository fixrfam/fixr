import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/test/mocks";
import { SecretReveal } from "./secret-reveal";

afterEach(() => {
	vi.clearAllMocks();
	vi.restoreAllMocks();
});

describe("SecretReveal", () => {
	it("shows the secret with a one-time warning", () => {
		render(<SecretReveal onDone={vi.fn()} secret="fxr_abc_def" />);

		expect(screen.getByText("fxr_abc_def")).toBeInTheDocument();
		expect(screen.getByText(/não será exibido de novo/)).toBeInTheDocument();
	});

	it("copies the secret to the clipboard", async () => {
		const user = userEvent.setup();
		const writeText = vi
			.spyOn(navigator.clipboard, "writeText")
			.mockResolvedValue();
		render(<SecretReveal onDone={vi.fn()} secret="fxr_abc_def" />);

		await user.click(screen.getByRole("button", { name: "Copiar segredo" }));

		expect(writeText).toHaveBeenCalledWith("fxr_abc_def");
		expect(
			await screen.findByRole("button", { name: "Segredo copiado" })
		).toBeInTheDocument();
	});

	it("tells the user to copy manually when the clipboard is unavailable", async () => {
		const user = userEvent.setup();
		vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
			new Error("denied")
		);
		render(<SecretReveal onDone={vi.fn()} secret="fxr_abc_def" />);

		await user.click(screen.getByRole("button", { name: "Copiar segredo" }));

		await waitFor(() => expect(toast.error).toHaveBeenCalled());
	});

	it("closes when the user confirms they copied it", async () => {
		const user = userEvent.setup();
		const onDone = vi.fn();
		render(<SecretReveal onDone={onDone} secret="fxr_abc_def" />);

		await user.click(screen.getByRole("button", { name: "Já copiei, fechar" }));

		expect(onDone).toHaveBeenCalled();
	});
});
