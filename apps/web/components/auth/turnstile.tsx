"use client";

import { env } from "@fixr/env/web";
import { Turnstile as TurnstileWidget } from "@marsidev/react-turnstile";
import { useEffect, useState } from "react";

interface TurnstileProps {
	onToken: (token: string | null) => void;
	onError?: () => void;
	onLoad?: () => void;
}

export function Turnstile({ onToken, onError, onLoad }: TurnstileProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	return (
		<TurnstileWidget
			onError={() => {
				onToken(null);
				onError?.();
			}}
			onExpire={() => {
				onToken(null);
			}}
			onSuccess={(token) => {
				onLoad?.();
				onToken(token);
			}}
			options={{
				theme: "light",
				appearance: "interaction-only",
			}}
			siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
		/>
	);
}
