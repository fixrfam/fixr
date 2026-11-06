import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import "@/test/mocks";
import { StackedDialog } from "./dialog-stack";

function Stack() {
	const [child, setChild] = useState(false);
	return (
		<StackedDialog onOpenChange={() => undefined} open title="Order">
			<button onClick={() => setChild(true)} type="button">
				Add customer
			</button>
			<StackedDialog onOpenChange={setChild} open={child} title="Customer">
				<p>Customer form</p>
			</StackedDialog>
		</StackedDialog>
	);
}

describe("StackedDialog", () => {
	it("steps the dialog under it back while it's open", async () => {
		const user = userEvent.setup();
		render(<Stack />);
		const order = screen.getByRole("dialog", { name: "Order" });
		expect(order).toHaveAttribute("data-covered", "false");

		await user.click(screen.getByRole("button", { name: "Add customer" }));

		expect(await screen.findByText("Customer form")).toBeInTheDocument();
		expect(order).toHaveAttribute("data-covered", "true");

		// Escape closes only the top dialog, and the one under it comes back.
		await user.keyboard("{Escape}");
		expect(screen.queryByText("Customer form")).not.toBeInTheDocument();
		expect(order).toHaveAttribute("data-covered", "false");
	});
});
