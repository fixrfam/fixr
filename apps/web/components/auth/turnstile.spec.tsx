import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type WidgetProps = Record<string, (...args: unknown[]) => void>;
const widget = vi.hoisted(() => ({ props: {} as WidgetProps }));

vi.mock("@marsidev/react-turnstile", () => ({
	Turnstile: (props: WidgetProps) => {
		widget.props = props;
		return null;
	},
}));

const { Turnstile } = await import("./turnstile");

describe("Turnstile wrapper", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("reports an error when the widget never loads", () => {
		const onToken = vi.fn();
		const onError = vi.fn();
		render(<Turnstile onError={onError} onToken={onToken} />);

		act(() => {
			vi.advanceTimersByTime(15_000);
		});

		expect(onToken).toHaveBeenCalledWith(null);
		expect(onError).toHaveBeenCalledTimes(1);
	});

	it("does not error after loading, even when the parent re-renders with new callbacks", () => {
		const onError = vi.fn();
		const onToken = vi.fn();
		const { rerender } = render(
			<Turnstile onError={() => onError()} onToken={(t) => onToken(t)} />
		);

		act(() => {
			widget.props.onWidgetLoad?.();
			widget.props.onSuccess?.("token");
		});
		// A parent re-render (e.g. typing in the form) passes fresh inline callbacks.
		rerender(<Turnstile onError={() => onError()} onToken={(t) => onToken(t)} />);
		act(() => {
			vi.advanceTimersByTime(60_000);
		});

		expect(onToken).toHaveBeenCalledWith("token");
		expect(onToken).not.toHaveBeenCalledWith(null);
		expect(onError).not.toHaveBeenCalled();
	});

	it("forwards widget errors and expirations", () => {
		const onToken = vi.fn();
		const onError = vi.fn();
		render(<Turnstile onError={onError} onToken={onToken} />);

		act(() => {
			widget.props.onError?.();
			widget.props.onExpire?.();
		});

		expect(onError).toHaveBeenCalled();
		expect(onToken).toHaveBeenCalledWith(null);
	});
});
