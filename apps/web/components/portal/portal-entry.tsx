"use client";

import { useTranslation } from "@fixr/i18n/react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { portalApi } from "@/lib/services/portal";

/** Opens the portal session from the emailed link, then goes to the portal. */
export function PortalEntry({ token }: { token: string }) {
	const { t } = useTranslation();
	const router = useRouter();
	const open = useMutation({
		mutationFn: () => portalApi.openFromLink(token),
		onSuccess: () => router.replace("/portal"),
	});
	const { mutate } = open;

	useEffect(() => {
		mutate();
	}, [mutate]);

	if (open.isError) {
		return (
			<section className="w-full max-w-xl space-y-4 pt-10 text-center">
				<h1 className="font-heading font-semibold text-2xl">
					{t("portal.entry.invalidTitle")}
				</h1>
				<p className="text-muted-foreground">
					{t("portal.entry.invalidDescription")}
				</p>
				<Button asChild>
					<Link href="/portal/access">{t("portal.entry.requestNew")}</Link>
				</Button>
			</section>
		);
	}

	return (
		<p className="flex items-center gap-2 pt-10 text-muted-foreground">
			<Loader2 className="size-4 animate-spin" />
			{t("portal.entry.opening")}
		</p>
	);
}
