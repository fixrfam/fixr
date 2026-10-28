"use client";

import { useTranslation } from "@fixr/i18n/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { portalApi } from "@/lib/services/portal";

export const portalMeKey = ["portal", "me"];

/** Title, greeting and sign out, shared by the portal pages. */
export function PortalHeader() {
	const { t } = useTranslation();
	const router = useRouter();
	const { data: me } = useQuery({
		queryKey: portalMeKey,
		queryFn: portalApi.me,
		retry: false,
	});
	const signOut = useMutation({
		mutationFn: portalApi.signOut,
		onSettled: () => router.replace("/portal/access"),
	});

	return (
		<header className="flex w-full items-start justify-between gap-4">
			<div>
				<h1 className="font-heading font-semibold text-2xl md:text-3xl">
					{t("portal.header.title")}
				</h1>
				{me?.name ? (
					<p className="text-muted-foreground">
						{t("portal.header.greeting", {
							name: me.name.split(" ")[0] ?? me.name,
						})}
					</p>
				) : null}
			</div>
			<Button
				disabled={signOut.isPending}
				onClick={() => signOut.mutate()}
				size="sm"
				variant="outline"
			>
				<LogOut className="size-4" />
				{t("portal.header.signOut")}
			</Button>
		</header>
	);
}
