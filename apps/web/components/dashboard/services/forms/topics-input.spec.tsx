import { createTranslator } from "@fixr/i18n";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render } from "@/test/render";
import { TopicsInput } from "./topics-input";

const { t } = createTranslator("pt-BR");

function Harness({ initial = [] as string[] }) {
	const [value, setValue] = useState(initial);

	return (
		<TopicsInput onChange={setValue} placeholder="Novo tópico" value={value} />
	);
}

const input = () => screen.getByPlaceholderText("Novo tópico");
const addButton = () =>
	screen.getByRole("button", { name: t("services.form.addTopic") });
const topics = () =>
	screen.queryAllByRole("listitem").map((item) => item.textContent);

describe("TopicsInput", () => {
	it("adds a topic with Enter and clears the draft", async () => {
		const user = userEvent.setup();
		render(<Harness />);

		await user.type(input(), "Testar o touch{Enter}");

		expect(topics()).toEqual(["Testar o touch"]);
		expect(input()).toHaveValue("");
	});

	it("adds a topic with the button, trimmed", async () => {
		const user = userEvent.setup();
		render(<Harness />);

		await user.type(input(), "  Brilho máximo  ");
		await user.click(addButton());

		expect(topics()).toEqual(["Brilho máximo"]);
	});

	it("keeps the button disabled for a blank draft", async () => {
		const user = userEvent.setup();
		render(<Harness />);

		expect(addButton()).toBeDisabled();
		await user.type(input(), "   ");
		expect(addButton()).toBeDisabled();
	});

	it("ignores a duplicate topic", async () => {
		const user = userEvent.setup();
		render(<Harness initial={["Brilho"]} />);

		await user.type(input(), "Brilho{Enter}");

		expect(topics()).toEqual(["Brilho"]);
	});

	it("removes a topic by its labelled button", async () => {
		const user = userEvent.setup();
		render(<Harness initial={["Brilho", "Som"]} />);

		await user.click(
			screen.getByRole("button", {
				name: t("services.form.removeItem", { name: "Brilho" }),
			})
		);

		expect(topics()).toEqual(["Som"]);
	});

	it("does not submit the surrounding form on Enter", async () => {
		const user = userEvent.setup();
		let submitted = false;
		render(
			<form
				onSubmit={(e) => {
					e.preventDefault();
					submitted = true;
				}}
			>
				<Harness />
			</form>
		);

		await user.type(input(), "Som{Enter}");

		expect(submitted).toBe(false);
	});
});
