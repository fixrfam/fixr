"use client";

import { useTranslation } from "@fixr/i18n/react";
import { useMutation } from "@tanstack/react-query";
import { Link2Off } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { portalApi } from "@/lib/services/portal";
import { PortalCenter, PortalOpening } from "./portal-center";

export function PortalLinkInvalid() {
	const { t } = useTranslation();
	return (
		<PortalCenter>
			<div className="space-y-4">
				<Link2Off className="size-7 text-muted-foreground" />
				<h1 className="text-balance font-heading font-semibold text-2xl">
					{t("portal.entry.invalidTitle")}
				</h1>
				<p className="text-pretty text-muted-foreground text-sm">
					{t("portal.entry.invalidDescription")}
				</p>
				<Button asChild className="w-full rounded-full" size="lg">
					<Link href="/portal/access">{t("portal.entry.requestNew")}</Link>
				</Button>
			</div>
		</PortalCenter>
	);
}

/** Opens the portal session from the emailed link (magic link), then goes in. */
export function PortalEntry({ token }: { token: string }) {
	const router = useRouter();
	const open = useMutation({
		mutationFn: () => portalApi.openFromLink(token),
		onSuccess: () => router.replace("/portal"),
	});
	const { mutate } = open;

	useEffect(() => {
		mutate();
	}, [mutate]);

	return open.isError ? <PortalLinkInvalid /> : <PortalOpening />;
}
