"use client";

import { type ReactNode, useState } from "react";
import { cn, isClientSide } from "@/lib/utils";
import { Alert, type AlertProps } from "./ui/alert";

export type CookieAlertProps = {
	show: boolean;
	cookieKey: string;
	children: ReactNode;
} & Omit<AlertProps, "dismissable" | "onDismiss">;

export default function CookieAlert({
	show,
	cookieKey,
	className,
	children,
	...props
}: CookieAlertProps) {
	const [showAlert, setShowAlert] = useState(show);

	if (show && isClientSide()) {
		// biome-ignore lint/suspicious/noDocumentCookie: <TODO: Refactor to CookieStore API https://developer.mozilla.org/en-US/docs/Web/API/CookieStore>
		document.cookie = `${cookieKey}=; max-age=0; path=/`;
	}

	if (!showAlert) {
		return null;
	}

	return (
		<Alert
			className={cn("border-destructive/50 bg-destructive/20", className)}
			dismissable={true as const}
			onDismiss={() => setShowAlert(false)}
			{...props}
		>
			{children}
		</Alert>
	);
}
