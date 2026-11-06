"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PublicEstimate } from "@/components/estimates/public-estimate";
import { portalApi } from "@/lib/services/portal";
import { PortalOpening } from "./portal-entry";

/**
 * The link of an estimate email. It is also the client's access to the
 * portal: it signs them in and lands on the estimate there. When that isn't
 * possible (no client on the estimate), the estimate still opens by itself.
 */
export function EstimateEntry({ token }: { token: string }) {
	const router = useRouter();
	const open = useMutation({
		mutationFn: () => portalApi.openFromEstimate(token),
		onSuccess: ({ estimateId }) =>
			router.replace(`/portal/estimates/${estimateId}`),
	});
	const { mutate } = open;

	useEffect(() => {
		mutate();
	}, [mutate]);

	if (open.isError) {
		return (
			<div className="mx-auto min-h-dvh w-full max-w-6xl bg-muted/30 px-4 py-8 md:px-6">
				<PublicEstimate token={token} />
			</div>
		);
	}
	return <PortalOpening />;
}
