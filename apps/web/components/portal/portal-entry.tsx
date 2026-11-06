"use client";

import { useTranslation } from "@fixr/i18n/react";
import { useMutation } from "@tanstack/react-query";
import { Link2Off, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { portalApi } from "@/lib/services/portal";
import { PortalCenter } from "./portal-center";

export function PortalOpening() {
	const { t } = useTranslation();
	return (
		<PortalCenter>
			<p className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
				<Loader2 className="size-4 animate-spin" />
				{t("portal.entry.opening")}
			</p>
		</PortalCenter>
	);
}

export function PortalLinkInvalid() {
	const { t } = useTranslation();
	return (
		<PortalCenter>
			<div className="space-y-4 text-center">
				<span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
					<Link2Off className="size-6" />
				</span>
				<h1 className="font-heading font-semibold text-2xl">
					{t("portal.entry.invalidTitle")}
				</h1>
				<p className="text-muted-foreground text-sm">
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
