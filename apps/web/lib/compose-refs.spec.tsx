import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { composeRefs, useComposedRefs } from "./compose-refs";

describe("composeRefs", () => {
	it("sets object refs and calls callback refs", () => {
		const objectRef = createRef<HTMLDivElement>();
		const callbackRef = vi.fn();
		const node = document.createElement("div");

		composeRefs(objectRef, callbackRef, undefined)(node);

		expect(objectRef.current).toBe(node);
		expect(callbackRef).toHaveBeenCalledWith(node);
	});

	it("returns a cleanup when a callback ref returns one (React 19)", () => {
		const objectRef = createRef<HTMLDivElement>();
		const cleanup = vi.fn();
		const node = document.createElement("div");

		const dispose = composeRefs<HTMLDivElement>(objectRef, () => cleanup)(node);
		expect(typeof dispose).toBe("function");
		(dispose as () => void)();

		expect(cleanup).toHaveBeenCalled();
		expect(objectRef.current).toBeNull();
	});
});

describe("useComposedRefs", () => {
	it("attaches the element to every ref", () => {
		const a = createRef<HTMLButtonElement>();
		const b = vi.fn();
		function Button() {
			return (
				<button ref={useComposedRefs(a, b)} type="button">
					x
				</button>
			);
		}

		render(<Button />);

		expect(a.current).toBeInstanceOf(HTMLButtonElement);
		expect(b).toHaveBeenCalledWith(a.current);
	});
});
