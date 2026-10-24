"use client";

import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Without a portal session (401), send the client to ask for a new link. */
export function useRedirectWithoutSession(error: unknown) {
	const router = useRouter();
	const unauthorized = isAxiosError(error) && error.response?.status === 401;

	useEffect(() => {
		if (unauthorized) {
			router.replace("/portal/access");
		}
	}, [unauthorized, router]);

	return unauthorized;
}
