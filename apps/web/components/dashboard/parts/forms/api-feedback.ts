"use client";

import { useMessage } from "@fixr/i18n/react";
import { toast } from "@pheralb/toast";
import { AxiosError } from "axios";

/** Toast the copy of the `code` the API answered with (or the generic error). */
export function useApiErrorToast() {
	const message = useMessage();

	return (error: unknown) => {
		const code =
			error instanceof AxiosError ? error.response?.data?.code : undefined;
		const feedback = message(code, "error");
		toast.error({ text: feedback.title, description: feedback.description });
	};
}
