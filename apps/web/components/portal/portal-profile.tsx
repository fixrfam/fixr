"use client";

import { useTranslation } from "@fixr/i18n/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/account/profile-avatar";
import { LanguageToggle } from "@/components/language-toggle";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallpaper } from "@/components/wallpaper";
import { formatCpf, formatPhone } from "@/lib/format";
import { portalApi } from "@/lib/services/portal";
import { PortalList, ShopMark } from "./portal-cards";
import { portalKeys, usePortalMe } from "./store";

/** CPF with only the last digits visible, e.g. `***.***.725-47`. */
function maskCpf(cpf: string) {
	const formatted = formatCpf(cpf);
	return `***.***.${formatted.slice(-6)}`;
}

/** Who is signed in, their shops and the way out. */
export function PortalProfile() {
	const { t } = useTranslation();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: me, isPending } = usePortalMe();
	const signOut = useMutation({
		mutationFn: portalApi.signOut,
		onSettled: () => {
			queryClient.removeQueries({ queryKey: portalKeys.all });
			router.replace("/portal/access");
		},
	});

	if (isPending || !me) {
		return <Skeleton className="h-64 rounded-2xl" />;
	}

	return (
		<div className="space-y-5">
			<Wallpaper className="flex items-center gap-4 rounded-[1.25rem] p-4">
				<Avatar
					className="size-16 shrink-0 shadow-[0_0_0_2px_oklch(1_0_0/0.35)]"
					fallbackHash={me.email}
					fallbackType="beam"
				/>
				<div className="min-w-0">
					<h1 className="truncate font-heading font-semibold text-xl">
						{me.name ?? me.email}
					</h1>
					<dl className="flex min-w-0 flex-col text-sm text-white/70">
						<dt className="sr-only">{t("portal.profile.email")}</dt>
						<dd className="max-w-full truncate">{me.email}</dd>
						<dt className="sr-only">{t("portal.profile.cpf")}</dt>
						<dd className="whitespace-nowrap">
							{t("portal.profile.cpf")} {maskCpf(me.cpf)}
						</dd>
					</dl>
				</div>
			</Wallpaper>

			{me.shops.length > 0 && (
				<section className="space-y-2.5">
					<div>
						<h2 className="font-semibold text-sm">
							{t("portal.profile.shops")}
						</h2>
						<p className="text-pretty text-muted-foreground text-xs">
							{t("portal.profile.shopsDescription")}
						</p>
					</div>
					<PortalList>
						{me.shops.map((shop) => (
							<li className="flex items-center gap-3 px-4 py-3" key={shop.name}>
								<ShopMark className="size-9 rounded-xl text-sm" shop={shop} />
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-sm">{shop.name}</p>
									{shop.phone && (
										<p className="text-muted-foreground text-xs">
											{formatPhone(shop.phone)}
										</p>
									)}
								</div>
								{shop.phone && (
									<Button
										asChild
										className="rounded-full"
										size="icon-sm"
										variant="outline"
									>
										<a
											aria-label={t("portal.detail.call")}
											href={`tel:${shop.phone}`}
										>
											<Phone className="size-3.5" />
										</a>
									</Button>
								)}
								{shop.email && (
									<Button
										asChild
										className="rounded-full"
										size="icon-sm"
										variant="outline"
									>
										<a
											aria-label={t("portal.detail.email")}
											href={`mailto:${shop.email}`}
										>
											<Mail className="size-3.5" />
										</a>
									</Button>
								)}
							</li>
						))}
					</PortalList>
				</section>
			)}

			<section className="space-y-2.5">
				<h2 className="font-semibold text-sm">
					{t("portal.profile.preferences")}
				</h2>
				<PortalList>
					<li className="flex items-center justify-between px-4 py-2 text-sm">
						<span>{t("portal.profile.theme")}</span>
						<ModeToggle />
					</li>
					<li className="flex items-center justify-between px-4 py-2 text-sm">
						<span>{t("portal.profile.language")}</span>
						<LanguageToggle />
					</li>
				</PortalList>
			</section>

			<Button
				className="w-full rounded-full transition-[scale] active:scale-[0.96]"
				disabled={signOut.isPending}
				onClick={() => signOut.mutate()}
				size="lg"
				variant="outline"
			>
				<LogOut className="size-4" />
				{t("portal.profile.signOut")}
			</Button>
		</div>
	);
}
