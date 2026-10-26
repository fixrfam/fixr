import { createTranslator } from "@fixr/i18n";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/test/mocks";
import { render } from "@/test/render";
import { CopyableValue } from "./copyable-value";

const { t } = createTranslator("pt-BR");
const copyButton = () =>
	screen.getByRole("button", {
		name: t("common.clipboard.copy", { label: "CNPJ" }),
	});

afterEach(() => {
	vi.clearAllMocks();
	vi.restoreAllMocks();
});

describe("CopyableValue", () => {
	it("copies the value and confirms it", async () => {
		const user = userEvent.setup();
		const writeText = vi
			.spyOn(navigator.clipboard, "writeText")
			.mockResolvedValue();
		const onRowClick = vi.fn();
		render(<CopyableValue label="CNPJ" value="12.345.678/0001-90" />);
		// Stands in for a clickable row above React's root.
		document.body.addEventListener("click", onRowClick);

		expect(screen.getByText("12.345.678/0001-90")).toBeInTheDocument();
		await user.click(copyButton());

		expect(writeText).toHaveBeenCalledWith("12.345.678/0001-90");
		expect(toast.success).toHaveBeenCalledWith({
			text: t("common.clipboard.copied", { label: "CNPJ" }),
		});
		// Copying inside a clickable row must not open the row.
		expect(onRowClick).not.toHaveBeenCalled();
		document.body.removeEventListener("click", onRowClick);
	});

	it("tells the user to copy manually when the clipboard is unavailable", async () => {
		const user = userEvent.setup();
		vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
			new Error("denied")
		);
		render(<CopyableValue label="CNPJ" value="12.345.678/0001-90" />);

		await user.click(copyButton());

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith({
				text: t("common.clipboard.failed"),
			})
		);
	});
});
