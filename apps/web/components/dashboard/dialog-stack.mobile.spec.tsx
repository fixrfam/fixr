import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import "@/test/mocks";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";
import { StackedDialog } from "./dialog-stack";

// A phone: every "desktop" query fails, every "mobile" one matches.
vi.mock("@/lib/hooks/use-media-query", () => ({
	useMediaQuery: (query: string) => query.includes("max-width"),
}));

function OrderDrawer() {
	const [child, setChild] = useState(false);
	return (
		<ResponsiveDialogDrawer
			description="Open an order"
			onOpenChange={() => undefined}
			open
			title="Order"
		>
			<button onClick={() => setChild(true)} type="button">
				Add customer
			</button>
			<StackedDialog onOpenChange={setChild} open={child} title="Customer">
				<p>Customer form</p>
			</StackedDialog>
		</ResponsiveDialogDrawer>
	);
}

describe("StackedDialog on a phone", () => {
	it("opens as a drawer nested in the order drawer, not as a dialog", async () => {
		render(<OrderDrawer />);

		// A plain click: jsdom can't follow the pointer events vaul reads as a drag.
		fireEvent.click(screen.getByRole("button", { name: "Add customer" }));

		const form = await screen.findByText("Customer form");
		expect(form.closest("[data-slot=drawer-content]")).not.toBeNull();
		expect(document.querySelector("[data-slot=dialog-content]")).toBeNull();
	});
});
