"use client";

import { env } from "@fixr/env/web";
import { Turnstile as TurnstileWidget } from "@marsidev/react-turnstile";
import { useEffect, useRef, useState } from "react";

const TURNSTILE_TIMEOUT = 15_000;

interface TurnstileProps {
	onToken: (token: string | null) => void;
	onError?: () => void;
	onLoad?: () => void;
	onInteractive?: () => void;
}

export function Turnstile({
	onToken,
	onError,
	onLoad,
	onInteractive,
}: TurnstileProps) {
	const [mounted, setMounted] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		setMounted(true);

		timeoutRef.current = setTimeout(() => {
			onToken(null);
			onError?.();
		}, TURNSTILE_TIMEOUT);

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [onError, onToken]);

	if (!mounted) {
		return null;
	}

	return (
		<TurnstileWidget
			onBeforeInteractive={() => {
				onInteractive?.();
			}}
			onError={() => {
				onToken(null);
				onError?.();
			}}
			onExpire={() => {
				onToken(null);
			}}
			onSuccess={(token) => {
				onToken(token);
			}}
			onTimeout={() => {
				onToken(null);
				onError?.();
			}}
			onWidgetLoad={() => {
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}
				onLoad?.();
			}}
			options={{
				theme: "light",
				appearance: "interaction-only",
			}}
			siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
		/>
	);
}
